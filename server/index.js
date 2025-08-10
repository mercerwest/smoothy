const express = require('express');
const multer = require('multer');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

// Store progress for each job
const progressById = new Map();

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

// Progress endpoint
app.get('/progress/:id', (req, res) => {
  const id = req.params.id;
  const progress = progressById.get(id) || 0;
  res.json({ progress });
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
  const jobId = String(Date.now());

  // Initialize progress
  progressById.set(jobId, 0);

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
    progressById.delete(jobId);
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

    // Smoothing effect with frame blending only (no vidstab to avoid failures)
    const smoothingEffect = `tblend=all_mode=average:all_opacity=0.4,` +
      `hqdn3d=1:1:2:1,` +
      `fade=t=in:st=0:d=0.2,` +
      `fade=t=out:st=${Math.max(0, duration - 0.2)}:d=0.2`;

    // Single pass: Apply smoothing effect with progress tracking
    await new Promise((resolve, reject) => {
      const processTimeout = setTimeout(() => {
        reject(new Error('processing timeout'));
      }, 180000);

      ffmpeg(inputPath)
        .videoFilters(smoothingEffect)
        .outputOptions([
          '-c:v libvpx',
          '-b:v 1.2M',
          '-c:a libvorbis',
          '-auto-alt-ref 0',
          '-deadline good',
          '-cpu-used 2'
        ])
        .on('start', (cmd) => {
          console.log('ffmpeg smoothing effect started:', cmd);
          progressById.set(jobId, 20);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            const percent = Math.min(95, 20 + Math.floor(progress.percent * 0.75));
            progressById.set(jobId, percent);
            console.log(`Processing: ${percent}%`);
          }
        })
        .on('end', () => {
          clearTimeout(processTimeout);
          clearTimeout(timeout);
          progressById.set(jobId, 100);
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