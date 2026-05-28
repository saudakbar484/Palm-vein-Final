const EventEmitter = require('events');
const vein = require('./vein-bridge');

const DEVICE_TYPE_LABELS = {
  0: 'Magic Vein Plus',
  1: 'Magic Vein Plus Pro',
  2: 'Magic Vein Plus Mini',
};

class DeviceManager extends EventEmitter {
  constructor() {
    super();
    this.ctx = null;
    this.sdkVersion = null;
    this.deviceCount = 0;
    this.deviceType = null;
    this.deviceInfo = {};
    this.opened = false;
    this.sleeping = false;
    this.deviceIndex = null;
  }

  initSdk() {
    try {
      this.sdkVersion = vein.XR_Vein_GetVersion();
      this.ctx = vein.XR_Vein_Init();
      console.log('[DeviceManager] SDK initialized successfully');
      return this.sdkVersion;
    } catch (err) {
      console.error('[DeviceManager] SDK init failed:', err.message);
      // Fallback: create a mock ctx so we can continue
      this.ctx = Buffer.alloc(8);
      this.sdkVersion = 'Mock SDK (init failed)';
      throw err;
    }
  }

  shutdown() {
    if (this.ctx) {
      try {
        vein.XR_Vein_DeInit(this.ctx);
      } catch (err) {
        console.error('Error during SDK deinit:', err.message);
      }
      this.ctx = null;
    }
  }

  updateDeviceCount() {
    if (!this.ctx) {
      console.warn('[DeviceManager] SDK not initialized, returning 0 devices');
      this.deviceCount = 0;
      return 0;
    }
    try {
      this.deviceCount = vein.XR_Vein_GetDevCnt(this.ctx);
      console.log(`[DeviceManager] Device count: ${this.deviceCount}`);
      this.emit('deviceCount', this.deviceCount);
      return this.deviceCount;
    } catch (err) {
      console.error('[DeviceManager] Error getting device count:', err.message);
      this.deviceCount = 0;
      return 0;
    }
  }

  getDeviceCount() {
    return this.deviceCount;
  }

  async openDevice(index = 0) {
    if (!this.ctx) {
      console.warn('[DeviceManager] SDK not initialized, cannot open device');
      return {};
    }
    try {
      if (this.opened) {
        await this.closeDevice();
      }
      vein.XR_Vein_OpenDev(this.ctx, index);
      this.deviceIndex = index;
      this.opened = true;
      this.deviceType = DEVICE_TYPE_LABELS[vein.XR_Vein_GetDevType(this.ctx, index)] || 'Unknown Device';
      this.deviceInfo.serialNumber = vein.XR_Vein_GetSerialNum(this.ctx);
      this.deviceInfo.firmwareVersion = vein.XR_Vein_GetFwVersion(this.ctx);
      const imgSize = vein.XR_Vein_GetSrcImgSize(this.ctx);
      this.deviceInfo.imageSize = imgSize;
      vein.XR_Vein_SetVolume(this.ctx, 70);
      vein.XR_Vein_SetRgbState(this.ctx, 0, 0, 255);
      console.log(`[DeviceManager] Device opened: ${this.deviceType}`);
      this.emit('deviceOpened', this.deviceInfo);
      return this.deviceInfo;
    } catch (err) {
      console.error('[DeviceManager] Error opening device:', err.message);
      this.opened = false;
      return {};
    }
  }

  closeDevice() {
    if (!this.ctx) {
      throw new Error('SDK not initialized');
    }
    if (!this.opened) {
      return;
    }
    vein.XR_Vein_CloseDev(this.ctx);
    this.opened = false;
    this.deviceIndex = null;
    this.emit('deviceClosed');
  }

  getDeviceInfo() {
    return {
      sdkVersion: this.sdkVersion,
      opened: this.opened,
      deviceCount: this.deviceCount,
      deviceType: this.deviceType,
      serialNumber: this.deviceInfo.serialNumber,
      firmwareVersion: this.deviceInfo.firmwareVersion,
      imageSize: this.deviceInfo.imageSize,
      sleeping: this.sleeping,
    };
  }

  setSleepState(value) {
    this.sleeping = value;
    this.emit('sleepState', value);
  }
}

module.exports = new DeviceManager();
