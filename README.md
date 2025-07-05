# SMOOTHY

A video processing application that applies a unified jelly effect to videos, inspired by the YouTube stabilizer from 2013-2016.

## Features

- **Unified Jelly Effect**: Combines stabilization, smoothing, and the characteristic jelly wobble
- **Real-time Processing**: Upload videos and see the effect applied instantly
- **Web-based Interface**: Simple, retro-styled UI for easy video processing
- **Cross-platform**: Works on any modern web browser

## Deployment Options

### Option 1: EC2 Deployment (Recommended for Production)

This deploys both frontend and backend to your EC2 instance at `smoothy.mercerwest.com`.

#### Prerequisites
- EC2 instance with Docker and Docker Compose installed
- Domain configured to point to your EC2 instance

#### Deployment Steps

1. **Clone the repository to your EC2 instance:**
   ```bash
   git clone <your-repo-url>
   cd motion-smoothing-app
   ```

2. **Run the deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Configure your domain:**
   - Point `smoothy.mercerwest.com` to your EC2 instance
   - Configure SSL certificate (recommended)

4. **Access the application:**
   - Frontend: `https://smoothy.mercerwest.com`
   - Backend API: `https://smoothy.mercerwest.com/process`

#### Management Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update and redeploy
git pull
docker-compose down
docker-compose up -d --build
```

### Option 2: GitHub Pages Deployment

This deploys the frontend to GitHub Pages at `mercerwest.com/smoothy`.

#### Prerequisites
- GitHub repository with GitHub Pages enabled
- Backend deployed separately (EC2 recommended)

#### Setup Steps

1. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to Pages section
   - Select "GitHub Actions" as source

2. **Configure the backend URL:**
   - Update the `VITE_SERVER_URL` in `.github/workflows/deploy.yml`
   - Point it to your EC2 backend: `https://smoothy.mercerwest.com`

3. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Access the application:**
   - Frontend: `https://mercerwest.com/smoothy`
   - Backend: `https://smoothy.mercerwest.com`

## Local Development

### Prerequisites
- Node.js 18+
- FFmpeg installed on your system

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install
   ```

2. **Start the development server:**
   ```bash
   # Terminal 1: Start backend
   cd server && npm start
   
   # Terminal 2: Start frontend
   npm run dev
   ```

3. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:4000`

## Technical Details

### Jelly Effect Implementation

The unified jelly effect combines several FFmpeg filters:

- **Stabilization**: `vidstabdetect` and `vidstabtransform` for motion smoothing
- **Frame Blending**: `tblend` for temporal smoothing
- **Noise Addition**: Subtle noise for the characteristic look
- **Color Enhancement**: Slight contrast and saturation adjustments
- **Sharpening**: `unsharp` for enhanced detail

### Architecture

- **Frontend**: React + Vite
- **Backend**: Node.js + Express + FFmpeg
- **Deployment**: Docker + Docker Compose
- **Reverse Proxy**: Nginx for production

### Security Considerations

- CORS configured for production domains
- File upload size limits
- Temporary file cleanup
- Input validation

## Troubleshooting

### Common Issues

1. **FFmpeg not found:**
   - Ensure FFmpeg is installed on the system
   - For Docker deployment, FFmpeg is included in the image

2. **Processing fails:**
   - Check server logs: `docker-compose logs smoothy-server`
   - Verify video format is supported
   - Check available disk space

3. **CORS errors:**
   - Verify the server URL is correctly configured
   - Check CORS settings in the backend

4. **Memory issues:**
   - Large videos may require more memory
   - Consider increasing Docker memory limits

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs smoothy-server
docker-compose logs smoothy-frontend

# Follow logs in real-time
docker-compose logs -f
```

## License

ISC License - see LICENSE file for details.

## Author

Mercer West
