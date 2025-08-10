const express = require('express');
const multer = require('multer');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const upload = multer({ dest: 'uploads/' });

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Health check
app.get('/', (req, res) => {
  res.send('SMOOTHY server running');
});

// Video processing endpoint with unified jelly effect
app.post('/process', upload.single('video'), async (req, res) => {
  const inputPath = req.file.path;
  const outputName = `output_${Date.now()}.webm`;
  const outputPath = path.join('outputs', outputName);
  const transFile = inputPath + '.trf';

  // Ensure outputs dir exists
  fs.mkdirSync('outputs', { recursive: true });

  // Helper to clean up temp files
  const cleanup = () => {
    [inputPath, outputPath, transFile].forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} });
  };

  // Unified jelly effect filter chain
  // Combines stabilization, smoothing, and the characteristic jelly wobble
  const jellyEffect = `vidstabdetect=shakiness=8:accuracy=15:result='${transFile}',` +
    `vidstabtransform=smoothing=25:input='${transFile}',` +
    `tblend=all_mode=average:all_opacity=0.3,` +
    `noise=alls=15:allf=t+u,` +
    `eq=contrast=1.1:brightness=0.02:saturation=1.05,` +
    `unsharp=3:3:1.5:3:3:0.5`;

  try {
    // Pass 1: vidstabdetect
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`vidstabdetect=shakiness=8:accuracy=15:result='${transFile}'`)
        .outputOptions(['-f null'])
        .on('start', cmd => console.log('ffmpeg vidstabdetect:', cmd))
        .on('end', resolve)
        .on('error', reject)
        .save('/dev/null');
    });

    // Pass 2: Apply jelly effect
    let command = ffmpeg(inputPath)
      .videoFilters(jellyEffect)
      .outputOptions([
        '-c:v libvpx',
        '-b:v 2M',
        '-c:a libvorbis',
        '-auto-alt-ref 0'
      ])
      .on('start', (cmd) => {
        console.log('ffmpeg jelly effect started:', cmd);
      })
      .on('progress', (progress) => {
        console.log('ffmpeg progress:', progress);
      })
      .on('end', () => {
        console.log('ffmpeg finished:', outputPath);
        res.download(outputPath, outputName, (err) => {
          cleanup();
        });
      })
      .on('error', (err) => {
        console.error('ffmpeg error:', err);
        cleanup();
        res.status(500).send('Processing failed: ' + err.message);
      });

    command.save(outputPath);
  } catch (err) {
    console.error('Processing error:', err);
    cleanup();
    res.status(500).send('Processing failed: ' + err.message);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SMOOTHY server listening on port ${PORT}`);
  console.log(`CORS origins: ${corsOptions.origin.join(', ')}`);
}); 