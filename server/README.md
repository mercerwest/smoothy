# SMOOTHY Server

This is the backend for SMOOTHY, providing video upload and processing using ffmpeg.

## Usage

1. Install dependencies (already done):
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   node index.js
   ```
   The server will run on port 4000 by default.

## Endpoints

### `GET /`
Health check. Returns `SMOOTHY server running`.

### `POST /process`
Upload a video for processing. Returns a processed WebM file.

- **Form fields:**
  - `video`: the video file (any format ffmpeg supports)
  - `mode`: (optional) one of `2012`, `2016`, `vhs` (currently only format conversion is applied)

**Example using curl:**
```sh
curl -F "video=@input.mp4" -F "mode=2012" http://localhost:4000/process --output output.webm
```

## Notes
- The processed file is always returned as WebM (VP8+Vorbis).
- More advanced effects (2012/2016/VHS) can be added to the ffmpeg pipeline. 