
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../Detection.css'
const App = () => {
  const [image, setImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Could not access camera. Please check permissions.');
        console.error('Camera access error:', err);
      }
    };

    startVideo();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;

    context.drawImage(video, 0, 0, 640, 480);
    const imageData = canvas.toDataURL('image/jpeg');
    setImage(imageData);
    sendImageToBackend(imageData);
  };

  const sendImageToBackend = async (base64Image) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5001/upload', {
        image: base64Image,
      });

      console.log('Backend Response:', response.data);

      if (response.data.detections) {
        setDetections(response.data.detections);
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (error) {
      console.error('Error sending image to backend:', error);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const renderDetections = () => {
    if (!image || detections.length === 0) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    

    const img = new Image();
    img.src = image;
    ctx.drawImage(img, 0, 0, 640, 480);
    

    detections.forEach(detection => {
      const [x1, y1, x2, y2] = detection.coordinates;
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.fillStyle = '#FF0000';
      const text = `${detection.class} ${detection.confidence}%`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(x1, y1 - 25, textWidth + 10, 25);
      

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(text, x1 + 5, y1 - 7);
    });
    
    return canvas.toDataURL('image/jpeg');
  };

  const detectedImage = renderDetections();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Plant Disease Detection</h1>
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0', textAlign: 'center' }}>
          {error}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          width="640"
          height="480"
          style={{ border: '1px solid black', borderRadius: '8px' }}
        />
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={captureImage}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {isLoading ? 'Processing...' : 'Capture Image'}
        </button>
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {image && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ textAlign: 'center' }}>Results:</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img 
              src={detectedImage || image} 
              alt="Detection results" 
              width="640" 
              height="480"
              style={{ border: '1px solid #ddd', borderRadius: '8px' }}
            />
          </div>
          
          {detections.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ textAlign: 'center' }}>Detected Plant Diseases:</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {detections.map((detection, index) => (
                  <li 
                    key={index} 
                    style={{
                      backgroundColor: '#f8f9fa',
                      margin: '5px 0',
                      padding: '10px',
                      borderRadius: '4px',
                      borderLeft: '4px solid #4CAF50'
                    }}
                  >
                    <strong>{detection.class}</strong> - Confidence: {detection.confidence}%
                    <br />
                    Location: [x1: {detection.coordinates[0]}, y1: {detection.coordinates[1]}, 
                    x2: {detection.coordinates[2]}, y2: {detection.coordinates[3]}]
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {isLoading && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <p>Analyzing plant health...</p>
        </div>
      )}
    </div>
  );
};

export default App;
