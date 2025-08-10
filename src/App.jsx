import { useState, useRef } from 'react'
import './App.css'

// Get server URL from environment or default to localhost
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://smoothy-server:4000';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoURL, setVideoURL] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputURL, setOutputURL] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef();
  const canvasRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoURL(URL.createObjectURL(file));
      setOutputURL('');
      setError('');
    }
  };

  // Server-side processing: upload video for jelly effect processing
  const handleProcess = async () => {
    if (!videoFile) return;
    setProcessing(true);
    setProgress(0);
    setOutputURL('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      // Use fetch with progress (XHR for progress, fallback to fetch)
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${SERVER_URL}/process`, true);
      xhr.responseType = 'blob';
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 50));
        }
      };
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 2) setProgress(60); // headers received
        if (xhr.readyState === 3) setProgress(80); // loading
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          setProgress(100);
          const outBlob = xhr.response;
          setOutputURL(URL.createObjectURL(outBlob));
        } else {
          setError('Processing failed: ' + xhr.statusText);
        }
        setProcessing(false);
      };
      xhr.onerror = () => {
        setError('Processing failed: Network error');
        setProcessing(false);
      };
      xhr.send(formData);
    } catch (err) {
      setError('Processing failed: ' + (err.message || err));
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputURL) return;
    const a = document.createElement('a');
    a.href = outputURL;
    a.download = 'smoothy.webm';
    a.click();
  };

  return (
    <div className="ms-app-wrapper">
      <h1 className="ms-title">SMOOTHY</h1>
      <div className="ms-controls">
        <label className="ms-label">
          Upload Video
          <input type="file" accept="video/*" onChange={handleFileChange} />
        </label>
      </div>
      <div className="ms-video-preview">
        {videoURL ? (
          <video ref={videoRef} src={videoURL} controls width="480" className="ms-video" />
        ) : (
          <div className="ms-placeholder">No video selected</div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      <div style={{ margin: '1.5rem 0' }}>
        <button
          className="ms-mode-btn"
          onClick={handleProcess}
          disabled={!videoFile || processing}
        >
          {processing ? 'Processing...' : 'Make it Smooth'}
        </button>
        {outputURL && (
          <button className="ms-mode-btn" onClick={handleDownload} style={{ marginLeft: 12 }}>
            Download
          </button>
        )}
      </div>
      {processing && (
        <div style={{ margin: '1rem 0' }}>
          <div className="ms-progress-bar">
            <div className="ms-progress" style={{ width: `${progress}%` }} />
          </div>
          <div className="ms-progress-label">Processing: {progress}%</div>
        </div>
      )}
      {error && (
        <div className="ms-error">{error}</div>
      )}
      {outputURL && (
        <div className="ms-video-preview" style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: '1.2rem', color: '#444', marginBottom: 8 }}>Preview Processed Video</h2>
          <video src={outputURL} controls width="480" className="ms-video" style={{ border: '2px solid #ff2a6d' }} />
        </div>
      )}
    </div>
  );
}

export default App
