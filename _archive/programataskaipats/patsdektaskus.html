<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Camera Angle Measurement Tool</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        header {
            background: #4a6fa5;
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        h1 {
            font-size: 2.2rem;
            margin-bottom: 10px;
        }
        
        .instructions {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #eaeaea;
        }
        
        .instructions ol {
            padding-left: 20px;
            margin: 10px 0;
        }
        
        .instructions li {
            margin-bottom: 8px;
        }
        
        .app-content {
            display: flex;
            flex-wrap: wrap;
            padding: 20px;
        }
        
        .camera-section {
            flex: 1;
            min-width: 300px;
            margin-right: 20px;
        }
        
        .data-section {
            flex: 1;
            min-width: 300px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
        }
        
        #camera-container {
            position: relative;
            width: 100%;
            padding-top: 75%; /* 4:3 aspect ratio */
            background: #000;
            border-radius: 10px;
            overflow: hidden;
        }
        
        #camera-view, #overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        #camera-view {
            object-fit: cover;
        }
        
        #overlay {
            pointer-events: none;
        }
        
        .controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 20px;
        }
        
        button {
            padding: 12px 15px;
            background: #4a6fa5;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.3s;
        }
        
        button:hover {
            background: #385d8a;
        }
        
        button:disabled {
            background: #cccccc;
            cursor: not-allowed;
        }
        
        #start-btn {
            background: #2e7d32;
        }
        
        #start-btn:hover {
            background: #1b5e20;
        }
        
        #save-btn {
            background: #d32f2f;
        }
        
        #save-btn:hover {
            background: #b71c1c;
        }
        
        #data-display {
            margin-top: 20px;
        }
        
        .angle-display {
            background: white;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .point-count {
            font-weight: bold;
            color: #4a6fa5;
            margin-bottom: 15px;
        }
        
        .recording-status {
            display: inline-block;
            padding: 5px 10px;
            background: #ffcdd2;
            border-radius: 4px;
            margin-left: 10px;
            font-size: 0.9rem;
        }
        
        .recording {
            background: #c8e6c9;
        }
        
        footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .app-content {
                flex-direction: column;
            }
            
            .camera-section {
                margin-right: 0;
                margin-bottom: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Camera Angle Measurement Tool</h1>
            <p>Measure angles between points placed on your camera feed</p>
        </header>
        
        <div class="instructions">
            <h2>How to Use:</h2>
            <ol>
                <li>Allow camera access when prompted</li>
                <li>Click on the camera feed to place points (minimum 3 points)</li>
                <li>Click "Start Recording" to capture data for 1 second</li>
                <li>Use "Save Data" to download your measurements as JSON</li>
            </ol>
        </div>
        
        <div class="app-content">
            <div class="camera-section">
                <div id="camera-container">
                    <video id="camera-view" autoplay playsinline></video>
                    <canvas id="overlay"></canvas>
                </div>
                
                <div class="controls">
                    <button id="start-btn">Start Recording (1s)</button>
                    <button id="add-point-btn">Add Point</button>
                    <button id="delete-point-btn">Delete Selected</button>
                    <button id="clear-all-btn">Clear All</button>
                    <button id="save-btn">Save Data</button>
                </div>
            </div>
            
            <div class="data-section">
                <h2>Measurements</h2>
                <div class="point-count">Points placed: <span id="point-count">0</span></div>
                
                <div id="data-display">
                    <p>Place at least 3 points to see angle measurements</p>
                </div>
            </div>
        </div>
        
        <footer>
            <p>Angle Measurement Tool &copy; 2023 | Refresh the page to reset the application</p>
        </footer>
    </div>

    <script>
        // App state
        const state = {
            points: [],
            selectedPoint: null,
            isRecording: false,
            recordedData: [],
            pointCounter: 1
        };

        // DOM elements
        const cameraView = document.getElementById('camera-view');
        const overlay = document.getElementById('overlay');
        const startBtn = document.getElementById('start-btn');
        const addPointBtn = document.getElementById('add-point-btn');
        const deletePointBtn = document.getElementById('delete-point-btn');
        const clearAllBtn = document.getElementById('clear-all-btn');
        const saveBtn = document.getElementById('save-btn');
        const dataDisplay = document.getElementById('data-display');
        const pointCountElement = document.getElementById('point-count');
        const ctx = overlay.getContext('2d');

        // Initialize camera
        async function initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "environment" } 
                });
                cameraView.srcObject = stream;
                
                // Set canvas size to match video
                cameraView.addEventListener('loadedmetadata', () => {
                    overlay.width = cameraView.videoWidth;
                    overlay.height = cameraView.videoHeight;
                    drawPointsAndLines();
                });
            } catch (err) {
                console.error('Error accessing camera:', err);
                dataDisplay.innerHTML = `<p class="error">Error accessing camera: ${err.message}</p>`;
            }
        }

        // Add point at center of screen
        addPointBtn.addEventListener('click', () => {
            if (overlay.width) {
                const x = overlay.width / 2;
                const y = overlay.height / 2;
                addPoint(x, y);
            } else {
                alert('Please wait for camera to initialize first');
            }
        });

        // Add point function
        function addPoint(x, y) {
            const point = {
                id: Date.now(),
                x,
                y,
                label: `P${state.pointCounter++}`
            };
            
            state.points.push(point);
            updatePointCount();
            drawPointsAndLines();
            calculateAngles();
        }

        // Update point count display
        function updatePointCount() {
            pointCountElement.textContent = state.points.length;
        }

        // Draw points and connecting lines
        function drawPointsAndLines() {
            if (!overlay.width) return;
            
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            
            // Draw lines between points
            if (state.points.length > 1) {
                for (let i = 0; i < state.points.length - 1; i++) {
                    const p1 = state.points[i];
                    const p2 = state.points[i + 1];
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }
            
            // Draw points
            state.points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
                ctx.fillStyle = point === state.selectedPoint ? '#ffeb3b' : '#f44336';
                ctx.fill();
                
                // Draw label
                ctx.font = '16px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(point.label, point.x, point.y);
            });
        }

        // Calculate angles between points
        function calculateAngles() {
            if (state.points.length < 3) {
                dataDisplay.innerHTML = '<p>Place at least 3 points to see angle measurements</p>';
                return;
            }
            
            let anglesHTML = '';
            
            for (let i = 1; i < state.points.length - 1; i++) {
                const p1 = state.points[i - 1];
                const p2 = state.points[i];
                const p3 = state.points[i + 1];
                
                // Calculate vectors
                const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
                const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
                
                // Calculate angle
                const dot = v1.x * v2.x + v1.y * v2.y;
                const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                const angleRad = Math.acos(dot / (mag1 * mag2));
                const angleDeg = angleRad * (180 / Math.PI);
                
                anglesHTML += `
                    <div class="angle-display">
                        <strong>Angle at ${p2.label}:</strong> ${angleDeg.toFixed(2)}°
                        <br><small>Between ${p1.label}-${p2.label}-${p3.label}</small>
                    </div>
                `;
                
                // Record if we're in recording mode
                if (state.isRecording) {
                    state.recordedData.push({
                        timestamp: Date.now(),
                        points: [...state.points],
                        angle: angleDeg,
                        anglePoint: p2.label
                    });
                }
            }
            
            dataDisplay.innerHTML = anglesHTML;
        }

        // Start recording for 1 second
        startBtn.addEventListener('click', async () => {
            if (state.points.length < 3) {
                alert('Place at least 3 points before recording');
                return;
            }
            
            state.isRecording = true;
            state.recordedData = [];
            startBtn.disabled = true;
            startBtn.textContent = 'Recording...';
            startBtn.classList.add('recording');
            
            // Record for 1 second
            setTimeout(() => {
                state.isRecording = false;
                startBtn.disabled = false;
                startBtn.textContent = 'Start Recording (1s)';
                startBtn.classList.remove('recording');
                alert(`Recorded ${state.recordedData.length} measurements`);
            }, 1000);
        });

        // Save data function
        saveBtn.addEventListener('click', () => {
            if (state.recordedData.length === 0) {
                alert('No data to save. Record some measurements first.');
                return;
            }
            
            const dataStr = JSON.stringify(state.recordedData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `angle-measurements-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        // Delete selected point
        deletePointBtn.addEventListener('click', () => {
            if (state.selectedPoint) {
                const index = state.points.indexOf(state.selectedPoint);
                if (index > -1) {
                    state.points.splice(index, 1);
                    state.selectedPoint = null;
                    updatePointCount();
                    drawPointsAndLines();
                    calculateAngles();
                }
            }
        });

        // Clear all points
        clearAllBtn.addEventListener('click', () => {
            state.points = [];
            state.selectedPoint = null;
            state.pointCounter = 1;
            updatePointCount();
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            dataDisplay.innerHTML = '<p>Place at least 3 points to see angle measurements</p>';
        });

        // Handle canvas clicks to select/move points
        overlay.addEventListener('click', (e) => {
            const rect = overlay.getBoundingClientRect();
            const scaleX = overlay.width / rect.width;
            const scaleY = overlay.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            // Check if clicked on a point
            for (const point of state.points) {
                const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
                if (distance <= 12) {
                    state.selectedPoint = point;
                    drawPointsAndLines();
                    return;
                }
            }
            
            // If not clicked on a point, add a new one
            addPoint(x, y);
        });

        // Initialize the app
        initCamera();
    </script>
</body>
</html>