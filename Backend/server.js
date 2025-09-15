import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '../dist')));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  let interval = null;
  let isPlaying = false;

  // Track cumulative intensity progress
let cumulativeProgress = 0;
let currentLevel = 1;

const LEVEL_THRESHOLDS = [0, 10, 25, 40, 60]; // thresholds for levels 1–5

  // Send initial zero state
  const sendZeroState = () => {
    const zeroAudioData = {
      type: 'audio_data',
      data: {
        volume: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        frequencies: new Array(32).fill(0),
        overallIntensity: 0
      },
      timestamp: Date.now()
    };

    const zeroLevelData = {
      type: 'level_state',
      data: {
        current: 1,
        progress: 0,
        isWinner: false,
        winnerStartTime: null
      },
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(zeroAudioData));
    ws.send(JSON.stringify(zeroLevelData));
  };

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'control') {
        if (data.data.play !== isPlaying) {
          isPlaying = data.data.play;
          if (isPlaying) {
            // Start sending audio data
            interval = setInterval(() => {
              if (!isPlaying) return;

              const overallIntensity = Math.random(); // your existing random generator

// Increase cumulative progress based on intensity
cumulativeProgress += overallIntensity * 2; // adjust multiplier to tune speed

// Update level when thresholds are crossed
for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
  if (cumulativeProgress >= LEVEL_THRESHOLDS[i]) {
    currentLevel = i + 1; // levels 1–5
    break;
  }
}

              const audioData = {
                type: 'audio_data',
                data: {
                  volume: Math.random(),
                  bass: Math.random(),
                  mid: Math.random(),
                  treble: Math.random(),
                  frequencies: Array.from({ length: 32 }, (_, i) => {
                    // Create more realistic frequency patterns
                    const time = Date.now() * 0.001;
                    const frequency = Math.sin(time * 2 + i * 0.2) * 0.5 + 0.5; // Base wave
                    const bass = Math.sin(time * 0.5) * 0.3 + 0.7; // Bass pulse
                    const intensity = Math.min(1, Math.max(0, frequency * (i < 8 ? bass : 1))); // Combine with bass boost
                    return Math.floor(intensity * 255); // Convert to 0-255 range
                  }),
                  overallIntensity
                },
                timestamp: Date.now()
              };

              // Calculate level based on overall intensity
              const levelData = {
  type: 'level_state',
  data: {
    current: currentLevel,
    progress: cumulativeProgress / LEVEL_THRESHOLDS[Math.min(currentLevel, 5) - 1], // normalized progress
    isWinner: currentLevel === 5,
    winnerStartTime: currentLevel === 5 ? Date.now() : null
  },
  timestamp: Date.now()
};

              ws.send(JSON.stringify(audioData));
              ws.send(JSON.stringify(levelData));
            }, 100);
          } else {
            // Stop sending audio data and reset to zero state
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
            sendZeroState();
          }
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Send initial zero state and connection status
  sendZeroState();

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(interval);
  });

  // Send initial connection success message
  ws.send(JSON.stringify({
    type: 'status',
    data: { connected: true },
    timestamp: Date.now()
  }));
});

// Handle WebSocket server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`WebSocket server running at ws://localhost:${port}`);
});