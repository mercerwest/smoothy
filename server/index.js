const express = require('express');
const multer = require('multer');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

// Configure multer with file size limits
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 1
  }
});

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:5173', 'http://localhost:3000', 'https://smoothy.mercerwest.com', 'https://mercerwest.com'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Health check
app.get('/', (req, res) => {
  res.send('SMOOTHY server running');
});

// Video processing endpoint with improved smoothing effects
app.post('/process', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No video file uploaded');
  }

  const inputPath = req.file.path;
  const outputName = `output_${Date.now()}.webm`;
  const outputPath = path.join('outputs', outputName);
  const transFile = inputPath + '.trf';

  // Ensure outputs dir exists
  fs.mkdirSync('outputs', { recursive: true });

  // Helper to clean up temp files
  const cleanup = () => {
    [inputPath, outputPath, transFile].forEach(f => { 
      try { 
        if (fs.existsSync(f)) fs.unlinkSync(f); 
      } catch (e) {
        console.log('Cleanup error for', f, ':', e.message);
      }
    });
  };

  // Set a timeout for the entire request
  const timeout = setTimeout(() => {
    cleanup();
    if (!res.headersSent) {
      res.status(408).send('Processing timeout - video too long or complex');
    }
  }, 300000); // 5 minutes timeout

  try {
    // Get video duration first
    const duration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration);
      });
    });

    // Limit video duration to 30 seconds for processing
    if (duration > 30) {
      clearTimeout(timeout);
      cleanup();
      return res.status(400).send('Video too long - maximum 30 seconds allowed');
    }

    console.log(`Processing video: ${duration}s duration`);

    // No filters - just basic video conversion to test FFmpeg
    // Single pass: Basic conversion only
    await new Promise((resolve, reject) => {
      const processTimeout = setTimeout(() => {
        reject(new Error('processing timeout'));
      }, 180000); // 3 minutes for processing

      let progressCounter = 0;

      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libvpx',
          '-b:v 1.2M',
          '-c:a libvorbis',
          '-auto-alt-ref 0',
          '-deadline good',
          '-cpu-used 2'
        ])
        .on('start', (cmd) => {
          console.log('ffmpeg basic conversion started:', cmd);
        })
        .on('progress', (progress) => {
          progressCounter++;
          console.log('ffmpeg progress:', progress);
          if (progressCounter % 10 === 0) {
            console.log(`Processing frame: ${progress.frames || 0}, time: ${progress.timemark || 'unknown'}`);
          }
        })
        .on('end', () => {
          clearTimeout(processTimeout);
          clearTimeout(timeout);
          console.log('ffmpeg finished:', outputPath);
          res.download(outputPath, outputName, (err) => {
            if (err) console.log('Download error:', err.message);
            cleanup();
          });
        })
        .on('error', (err) => {
          clearTimeout(processTimeout);
          clearTimeout(timeout);
          console.error('ffmpeg error:', err);
          cleanup();
          if (!res.headersSent) {
            res.status(500).send('Processing failed: ' + err.message);
          }
        })
        .save(outputPath);
    });

  } catch (err) {
    clearTimeout(timeout);
    console.error('Processing error:', err);
    cleanup();
    if (!res.headersSent) {
      res.status(500).send('Processing failed: ' + err.message);
    }
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SMOOTHY server listening on port ${PORT}`);
  console.log(`CORS origins: ${corsOptions.origin.join(', ')}`);
}); 