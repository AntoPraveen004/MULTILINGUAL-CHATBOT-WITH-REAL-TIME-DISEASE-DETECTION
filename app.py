from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO
import math

app = Flask(__name__)
CORS(app)

# Load your YOLO model
model = YOLO( r"D:\MINI\Realtime plantdisease\best (1).pt")

classnames = [
    'Apple Scab Leaf', 'Apple leaf', 'Apple rust leaf', 'Bell_pepper leaf',
    'Bell_pepper leaf spot', 'Blueberry leaf', 'Cherry leaf', 'Corn Gray leaf spot',
    'Corn leaf blight', 'Corn rust leaf', 'Peach leaf', 'Potato leaf',
    'Potato leaf early blight', 'Potato leaf late blight', 'Raspberry leaf',
    'Soyabean leaf', 'Squash Powdery mildew leaf', 'Strawberry leaf',
    'Tomato Early blight leaf', 'Tomato Septoria leaf spot', 'Tomato leaf',
    'Tomato leaf bacterial spot', 'Tomato leaf late blight', 'Tomato leaf mosaic virus',
    'Tomato leaf yellow virus', 'Tomato mold leaf', 'Tomato two spotted spider mites leaf',
    'grape leaf', 'grape leaf black rot'
]

@app.route('/upload', methods=['POST'])
def upload_image():
    data = request.json
    image_data = data.get('image')
    
    if not image_data:
        return jsonify({"error": "No image data received"}), 400

    try:
        # Decode the base64 image data
        header, encoded = image_data.split(",", 1)
        img_data = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_data))
        
        # Convert to OpenCV format
        frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        frame = cv2.resize(frame, (640, 480))
        
        # Perform detection - IMPORTANT: Remove stream=True for single image
        results = model(frame)  # Changed from stream=True
        
        detections = []
        
        for result in results:
            for box in result.boxes:
                confidence = math.ceil(box.conf.item() * 100)
                class_id = int(box.cls.item())
                
                if confidence > 50:  # Only consider detections with >50% confidence
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    
                    detections.append({
                        "class": classnames[class_id],
                        "confidence": confidence,
                        "coordinates": [x1, y1, x2, y2]
                    })

        return jsonify({"detections": detections})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)