const path = require('path');
const vein = require('./vein-bridge');
const deviceManager = require('./device-manager');

const AUDIO_PATH = path.resolve(__dirname, '../assets/audio');
const PRESET_FILES = {
  start: 'start.wav',
  success: 'success.wav',
  fail: 'fail.wav',
  match: 'match.wav',
  beep: 'beep.wav',
};

function getAudioPath(filename) {
  return path.resolve(AUDIO_PATH, filename);
}

function setRgbState(r, g, b) {
  if (!deviceManager.opened) {
    throw new Error('Device not opened');
  }
  return vein.XR_Vein_SetRgbState(deviceManager.ctx, r, g, b);
}

function setSleepMode(mode, timeoutMs = 0) {
  if (!deviceManager.opened) {
    throw new Error('Device not opened');
  }
  const result = vein.XR_Vein_SetSleepMode(deviceManager.ctx, mode, timeoutMs);
  deviceManager.setSleepState(mode === 1);
  return result;
}

function playWav(filePath, volume = 70, loop = 0) {
  if (!deviceManager.opened) {
    throw new Error('Device not opened');
  }
  return vein.XR_Vein_PlayWav(deviceManager.ctx, filePath, volume, loop);
}

function setVolume(volume) {
  if (!deviceManager.opened) {
    throw new Error('Device not opened');
  }
  return vein.XR_Vein_SetVolume(deviceManager.ctx, volume);
}

function playPreset(name, volume = 70, loop = 0) {
  const filename = PRESET_FILES[name];
  if (!filename) {
    throw new Error(`Unknown preset sound ${name}`);
  }
  return playWav(getAudioPath(filename), volume, loop);
}

module.exports = {
  setRgbState,
  setSleepMode,
  playWav,
  setVolume,
  playPreset,
  getAudioPath,
};
