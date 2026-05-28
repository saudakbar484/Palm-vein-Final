const EventEmitter = require('events');
const vein = require('./vein-bridge');
const deviceManager = require('./device-manager');
const db = require('./database');
const hardwareControl = require('./hardware-control');

class Enrollment extends EventEmitter {
  constructor() {
    super();
    this.session = null;
    this.poller = null;
    this.currentState = null;
  }

  start({ userId, name, notes = '' }) {
    this.currentState = { state: 1, progress: 0, label: 'Enrollment started' };
    if (!deviceManager.opened) {
      throw new Error('Device must be opened before enrollment');
    }
    this.session = {
      userId,
      name,
      notes,
      featSize: vein.XR_Vein_GetFeatSize(deviceManager.ctx, 0),
      sample1: null,
      sample2: null,
      result: null,
      startedAt: Date.now(),
    };
    vein.XR_Vein_StartEnrollPalm(deviceManager.ctx);
    hardwareControl.setRgbState(255, 128, 0);
    hardwareControl.playPreset('start');
    this.emit('state', { state: 1, progress: 0, label: 'Enrollment started' });
    this.poller = setInterval(() => this.poll(), 200);
    return this.session;
  }

  async poll() {
    if (!this.session) {
      return;
    }
    try {
      const enrollState = vein.XR_Vein_GetEnrollState(deviceManager.ctx);
      this.currentState = {
        state: enrollState.state,
        progress: enrollState.progress,
        label: this.getLabel(enrollState.state),
      };
      this.emit('state', this.currentState);

      if (enrollState.state === 1 && !this.session.sample1) {
        this.session.sample1 = await this.captureSample();
      }
      if (enrollState.state === 2 && !this.session.sample2) {
        this.session.sample2 = await this.captureSample();
      }
      if (enrollState.state === 3 && this.session.sample1 && this.session.sample2) {
        clearInterval(this.poller);
        await this.finish();
      }
      if (enrollState.state === -1) {
        this.emit('error', new Error('Enrollment sample rejected. Please reposition palm.'));
      }
    } catch (err) {
      this.emit('error', err);
      clearInterval(this.poller);
    }
  }

  async captureSample() {
    vein.XR_Vein_GrabFeatureFromFullImg(deviceManager.ctx);
    vein.XR_Vein_fp32FeatureToMyFeature(deviceManager.ctx);
    const sampleBuf = Buffer.alloc(this.session.featSize);
    vein.XR_Vein_CapRecgFeat(deviceManager.ctx, sampleBuf, this.session.featSize);
    return sampleBuf;
  }

  async finish() {
    const resultBuf = Buffer.alloc(this.session.featSize);
    vein.XR_Vein_FinishEnroll(deviceManager.ctx, this.session.sample1, this.session.sample2, resultBuf);
    this.session.result = resultBuf;
    db.addIdentity({
      id: this.session.userId,
      name: this.session.name,
      featBuf: resultBuf,
      featSize: this.session.featSize,
      notes: this.session.notes,
    });
    hardwareControl.setRgbState(0, 255, 0);
    hardwareControl.playPreset('success');
    this.emit('complete', {
      userId: this.session.userId,
      name: this.session.name,
      enrolledAt: Date.now(),
      featSize: this.session.featSize,
    });
    this.session = null;
  }

  getLabel(state) {
    switch (state) {
      case 1:
        return 'Capturing first sample';
      case 2:
        return 'Capturing second sample';
      case 3:
        return 'Processing enrollment';
      case 4:
        return 'Enrollment complete';
      case -1:
        return 'Sample rejected';
      default:
        return 'Waiting for palm';
    }
  }
}

module.exports = new Enrollment();
