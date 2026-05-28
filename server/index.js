const path = require('path');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const apiRoutes = require('./api-routes');
const deviceManager = require('./device-manager');
const previewLoop = require('./preview-loop');
const enrollment = require('./enrollment');
const hardwareControl = require('./hardware-control');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);
app.use(express.static(path.resolve(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on('connection', (socket) => {
  socket.on('message', async (raw) => {
    try {
      const message = JSON.parse(raw);
      switch (message.type) {
        case 'startPreview':
          previewLoop.start();
          break;
        case 'stopPreview':
          previewLoop.stop();
          break;
        case 'startEnroll':
          enrollment.start({ userId: message.userId, name: message.name, notes: message.notes });
          break;
        case 'startRecognize': {
          const result = await require('./recognition').recognizeOneToMany();
          broadcast({ type: 'matchResult', ...result });
          break;
        }
        case 'setLed':
          hardwareControl.setRgbState(message.r, message.g, message.b);
          break;
        case 'setVolume':
          hardwareControl.setVolume(message.level);
          break;
        case 'setSleep':
          hardwareControl.setSleepMode(message.mode, message.timeout_ms || 0);
          break;
        default:
          break;
      }
    } catch (err) {
      socket.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });

  socket.send(JSON.stringify({
    type: 'deviceStatus',
    connected: !!deviceManager.opened,
    count: deviceManager.deviceCount || 0,
    sleeping: !!deviceManager.sleeping,
  }));
});

previewLoop.on('frame', (frame) => broadcast({ type: 'frame', ...frame }));
previewLoop.on('palmDist', (data) => broadcast({ type: 'palmDist', ...data }));
previewLoop.on('sleep', (sleeping) => broadcast({ type: 'deviceStatus', sleeping }));
previewLoop.on('error', (error) => broadcast({ type: 'error', message: error.message }));

enrollment.on('state', (state) => broadcast({ type: 'enrollState', ...state }));
enrollment.on('complete', (info) => broadcast({ type: 'enrollComplete', info }));
enrollment.on('error', (err) => broadcast({ type: 'error', message: err.message }));

deviceManager.on('deviceOpened', (info) => broadcast({ type: 'deviceStatus', connected: true, info }));
deviceManager.on('deviceClosed', () => broadcast({ type: 'deviceStatus', connected: false }));
deviceManager.on('deviceCount', (count) => broadcast({ type: 'deviceStatus', count }));
deviceManager.on('sleepState', (sleeping) => broadcast({ type: 'deviceStatus', sleeping }));

async function startup() {
  try {
    console.log('Starting SDK...');
    const version = deviceManager.initSdk();
    console.log('✓ SDK initialized, version:', version);
    
    console.log('Checking for devices...');
    const count = deviceManager.updateDeviceCount();
    console.log(`✓ Found ${count} device(s)`);
    
    if (count > 0) {
      console.log('Opening device 0...');
      deviceManager.openDevice(0);
      console.log('✓ Device opened successfully');
      
      console.log('Starting preview loop...');
      previewLoop.start();
      console.log('✓ Preview loop started');
    } else {
      console.log('⚠ No devices found. Waiting for device connection...');
    }
  } catch (err) {
    console.error('⚠ SDK initialization error:', err.message);
    console.log('Server will continue running in fallback mode.');
    // Don't crash - server continues to serve frontend
  }
}

function shutdown() {
  previewLoop.stop();
  deviceManager.closeDevice();
  deviceManager.shutdown();
  server.close();
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Magic Vein Plus server listening on http://localhost:${PORT}`);
  startup();
});
