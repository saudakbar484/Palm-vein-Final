const express = require('express');
const deviceManager = require('./device-manager');
const previewLoop = require('./preview-loop');
const enrollment = require('./enrollment');
const recognition = require('./recognition');
const hardwareControl = require('./hardware-control');
const db = require('./database');

const router = express.Router();

router.get('/sdk/version', (req, res) => {
  try {
    res.json({ version: deviceManager.sdkVersion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/device/count', (req, res) => {
  try {
    const count = deviceManager.updateDeviceCount();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/device/open', (req, res) => {
  try {
    const info = deviceManager.openDevice(0);
    res.json({ success: true, info });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/device/close', (req, res) => {
  try {
    deviceManager.closeDevice();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/device/info', (req, res) => {
  try {
    const info = deviceManager.getDeviceInfo();
    res.json({ info });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enroll/start', (req, res) => {
  try {
    const { userId, name, notes } = req.body;
    const session = enrollment.start({ userId, name, notes });
    res.json({ success: true, session: { userId, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/enroll/state', (req, res) => {
  try {
    res.json({ state: enrollment.currentState || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enroll/finish', async (req, res) => {
  try {
    if (!enrollment.session) {
      throw new Error('Enrollment session not active');
    }
    await enrollment.finish();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recognize', async (req, res) => {
  try {
    const result = await recognition.recognizeOneToMany();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/templates', (req, res) => {
  try {
    const identities = db.listIdentities();
    res.json({ identities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/templates/:id', (req, res) => {
  try {
    db.deleteIdentity(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/led', (req, res) => {
  try {
    const { r, g, b } = req.body;
    hardwareControl.setRgbState(r, g, b);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sleep', (req, res) => {
  try {
    const { mode, timeout_ms } = req.body;
    hardwareControl.setSleepMode(mode, timeout_ms || 0);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/audio/play', (req, res) => {
  try {
    const { file, volume = 70, loop = 0 } = req.body;
    const filePath = hardwareControl.getAudioPath(file);
    hardwareControl.playWav(filePath, volume, loop);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/audio/volume', (req, res) => {
  try {
    const { level } = req.body;
    hardwareControl.setVolume(level);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recognition/log', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = db.getRecognitionLog(limit);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings/reinit', (req, res) => {
  try {
    deviceManager.shutdown();
    deviceManager.initSdk();
    res.json({ success: true, sdkVersion: deviceManager.sdkVersion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
