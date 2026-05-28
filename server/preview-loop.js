const EventEmitter = require('events');
const sharp = require('sharp');
const vein = require('./vein-bridge');
const deviceManager = require('./device-manager');

const IMG_WIDTH = 640;
const IMG_HEIGHT = 480;
const IMG_SIZE = IMG_WIDTH * IMG_HEIGHT;
const FRAME_MS = 100;

class PreviewLoop extends EventEmitter {
  constructor() {
    super();
    this.previewTimer = null;
    this.active = false;
    this.imgBuffer = Buffer.alloc(IMG_SIZE);
    this.lastPalmSeenAt = Date.now();
    this.autoSleepTimeoutMs = 30000;
  }

  start() {
    if (this.active) {
      return;
    }
    this.active = true;
    this.previewTimer = setInterval(() => this.tick(), FRAME_MS);
    this.emit('previewStarted');
  }

  stop() {
    this.active = false;
    if (this.previewTimer) {
      clearInterval(this.previewTimer);
      this.previewTimer = null;
    }
    this.emit('previewStopped');
  }

  async tick() {
    if (!deviceManager.opened || deviceManager.sleeping) {
      return;
    }

    try {
      vein.XR_Vein_GetStdVeinImage(deviceManager.ctx, this.imgBuffer);
      const pngBuffer = await sharp(this.imgBuffer, {
        raw: { width: IMG_WIDTH, height: IMG_HEIGHT, channels: 1 },
      }).png().toBuffer();

      const palmData = vein.XR_Vein_GetPalmDist(deviceManager.ctx);
      if (palmData.quality > 0) {
        this.lastPalmSeenAt = Date.now();
      }

      this.emit('frame', {
        timestamp: Date.now(),
        image: pngBuffer.toString('base64'),
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
      });
      this.emit('palmDist', palmData);
      this.checkAutoSleep(palmData);
    } catch (err) {
      this.emit('error', err);
    }
  }

  checkAutoSleep(palmData) {
    if (Date.now() - this.lastPalmSeenAt > this.autoSleepTimeoutMs && !deviceManager.sleeping) {
      try {
        vein.XR_Vein_SetSleepMode(deviceManager.ctx, 1, 0);
        vein.XR_Vein_SetRgbState(deviceManager.ctx, 0, 0, 0);
        deviceManager.setSleepState(true);
        this.emit('sleep', true);
      } catch (err) {
        this.emit('error', err);
      }
    }
  }

  wake() {
    if (!deviceManager.opened) {
      return;
    }
    vein.XR_Vein_SetSleepMode(deviceManager.ctx, 0, 0);
    vein.XR_Vein_SetRgbState(deviceManager.ctx, 0, 0, 255);
    deviceManager.setSleepState(false);
    this.lastPalmSeenAt = Date.now();
    this.emit('sleep', false);
  }
}

module.exports = new PreviewLoop();
