const path = require('path');
const koffi = require('koffi');

const ERROR_MAP = {
  0: 'Success',
  '-4': 'Invalid parameter',
  '-99': 'Device/resource failure',
};

const dllPath = path.resolve(__dirname, '../XRCommonVeinPlusAPI.dll');
const lib = koffi.load(dllPath);

const XR_Vein_GetVersion = lib.func('int XR_Vein_GetVersion(char* buf, int len)');
const XR_Vein_Init = lib.func('int XR_Vein_Init(void** ctx_ptr)');
const XR_Vein_DeInit = lib.func('int XR_Vein_DeInit(void* ctx)');
const XR_Vein_GetDevCnt = lib.func('int XR_Vein_GetDevCnt(void* ctx, int* count, int* reserved)');
const XR_Vein_GetDevType = lib.func('int XR_Vein_GetDevType(void* ctx, int index, int* type, int* extra)');
const XR_Vein_OpenDev = lib.func('int XR_Vein_OpenDev(void* ctx, int index)');
const XR_Vein_CloseDev = lib.func('int XR_Vein_CloseDev(void* ctx)');
const XR_Vein_GetSerialNum = lib.func('int XR_Vein_GetSerialNum(void* ctx, char* buf, int len, int* out_len)');
const XR_Vein_GetFwVersion = lib.func('int XR_Vein_GetFwVersion(void* ctx, char* buf, int len, int* out_len)');
const XR_Vein_GetSrcImgSize = lib.func('int XR_Vein_GetSrcImgSize(void* ctx, int* width, int* height, int* depth)');
const XR_Vein_GetStdVeinImage = lib.func('int XR_Vein_GetStdVeinImage(void* ctx, unsigned char* img_buf)');
const XR_Vein_GetPalmDist = lib.func('int XR_Vein_GetPalmDist(void* ctx, float* distance_cm, int* quality, int* extra)');
const XR_Vein_GrabFeatureFromFullImg = lib.func('int XR_Vein_GrabFeatureFromFullImg(void* ctx)');
const XR_Vein_StartEnrollPalm = lib.func('int XR_Vein_StartEnrollPalm(void* ctx)');
const XR_Vein_GetEnrollState = lib.func('int XR_Vein_GetEnrollState(void* ctx, int* state, int* progress, int* extra)');
const XR_Vein_GetFeatSize = lib.func('int XR_Vein_GetFeatSize(void* ctx, int feat_type, int* size, int* extra)');
const XR_Vein_FinishEnroll = lib.func('int XR_Vein_FinishEnroll(void* ctx, unsigned char* sample1_buf, unsigned char* sample2_buf, unsigned char* result_feat_buf)');
const XR_Vein_fp32FeatureToMyFeature = lib.func('int XR_Vein_fp32FeatureToMyFeature(void* ctx)');
const XR_Vein_CapRecgFeat = lib.func('int XR_Vein_CapRecgFeat(void* ctx, unsigned char* feat_buf, int feat_size, int* extra)');
const XR_Vein_CheckFeat = lib.func('int XR_Vein_CheckFeat(unsigned char* feat_buf, int feat_size, int* quality_score, int* extra)');
const XR_Vein_CalcFeatureDist = lib.func('int XR_Vein_CalcFeatureDist(unsigned char* feat1, int size1, unsigned char* feat2, int size2)');
const XR_Vein_SetRgbState = lib.func('int XR_Vein_SetRgbState(void* ctx, int r, int g, int b)');
const XR_Vein_SetSleepMode = lib.func('int XR_Vein_SetSleepMode(void* ctx, int mode, int timeout_ms)');
const XR_Vein_PlayWav = lib.func('int XR_Vein_PlayWav(void* ctx, char* wav_file_path, int volume, int loop)');
const XR_Vein_SetVolume = lib.func('int XR_Vein_SetVolume(void* ctx, int volume)');

function mapError(code) {
  return ERROR_MAP[code] || `Unknown error code ${code}`;
}

function checkResult(ret, fnName) {
  if (ret !== 0) {
    const message = mapError(ret);
    const error = new Error(`${fnName} failed (${ret}): ${message}`);
    error.code = ret;
    throw error;
  }
}

function intPointer() {
  return Buffer.alloc(4);
}

function stringResult(fnName, fn, length = 64) {
  const buf = Buffer.alloc(length);
  const outLen = intPointer();
  const ret = fn(buf, length, outLen);
  checkResult(ret, fnName);
  const actualLen = outLen.readInt32LE(0);
  return buf.slice(0, actualLen).toString('utf8');
}

module.exports = {
  ERROR_MAP,
  checkResult,
  mapError,
  XR_Vein_GetVersion: () => {
    return stringResult('XR_Vein_GetVersion', XR_Vein_GetVersion, 128);
  },
  XR_Vein_Init: () => {
    const ctxPtr = Buffer.alloc(8);
    const ret = XR_Vein_Init(ctxPtr);
    checkResult(ret, 'XR_Vein_Init');
    return ctxPtr;
  },
  XR_Vein_DeInit: (ctx) => {
    const ret = XR_Vein_DeInit(ctx);
    checkResult(ret, 'XR_Vein_DeInit');
    return ret;
  },
  XR_Vein_GetDevCnt: (ctx) => {
    const countPtr = intPointer();
    const ret = XR_Vein_GetDevCnt(ctx, countPtr, null);
    checkResult(ret, 'XR_Vein_GetDevCnt');
    return countPtr.readInt32LE(0);
  },
  XR_Vein_GetDevType: (ctx, index) => {
    const typePtr = intPointer();
    const ret = XR_Vein_GetDevType(ctx, index, typePtr, null);
    checkResult(ret, 'XR_Vein_GetDevType');
    return typePtr.readInt32LE(0);
  },
  XR_Vein_OpenDev: (ctx, index) => {
    const ret = XR_Vein_OpenDev(ctx, index);
    checkResult(ret, 'XR_Vein_OpenDev');
    return ret;
  },
  XR_Vein_CloseDev: (ctx) => {
    const ret = XR_Vein_CloseDev(ctx);
    checkResult(ret, 'XR_Vein_CloseDev');
    return ret;
  },
  XR_Vein_GetSerialNum: (ctx) => {
    const buf = Buffer.alloc(64);
    const outLen = intPointer();
    const ret = XR_Vein_GetSerialNum(ctx, buf, buf.length, outLen);
    checkResult(ret, 'XR_Vein_GetSerialNum');
    return buf.slice(0, outLen.readInt32LE(0)).toString('utf8');
  },
  XR_Vein_GetFwVersion: (ctx) => {
    const buf = Buffer.alloc(64);
    const outLen = intPointer();
    const ret = XR_Vein_GetFwVersion(ctx, buf, buf.length, outLen);
    checkResult(ret, 'XR_Vein_GetFwVersion');
    return buf.slice(0, outLen.readInt32LE(0)).toString('utf8');
  },
  XR_Vein_GetSrcImgSize: (ctx) => {
    const widthPtr = intPointer();
    const heightPtr = intPointer();
    const depthPtr = intPointer();
    const ret = XR_Vein_GetSrcImgSize(ctx, widthPtr, heightPtr, depthPtr);
    checkResult(ret, 'XR_Vein_GetSrcImgSize');
    return {
      width: widthPtr.readInt32LE(0),
      height: heightPtr.readInt32LE(0),
      depth: depthPtr.readInt32LE(0),
    };
  },
  XR_Vein_GetStdVeinImage: (ctx, imgBuf) => {
    const ret = XR_Vein_GetStdVeinImage(ctx, imgBuf);
    checkResult(ret, 'XR_Vein_GetStdVeinImage');
    return imgBuf;
  },
  XR_Vein_GetPalmDist: (ctx) => {
    const distPtr = Buffer.alloc(4);
    const qualityPtr = intPointer();
    const ret = XR_Vein_GetPalmDist(ctx, distPtr, qualityPtr, null);
    checkResult(ret, 'XR_Vein_GetPalmDist');
    return {
      distance: distPtr.readFloatLE(0),
      quality: qualityPtr.readInt32LE(0),
    };
  },
  XR_Vein_GrabFeatureFromFullImg: (ctx) => {
    const ret = XR_Vein_GrabFeatureFromFullImg(ctx);
    checkResult(ret, 'XR_Vein_GrabFeatureFromFullImg');
    return ret;
  },
  XR_Vein_StartEnrollPalm: (ctx) => {
    const ret = XR_Vein_StartEnrollPalm(ctx);
    checkResult(ret, 'XR_Vein_StartEnrollPalm');
    return ret;
  },
  XR_Vein_GetEnrollState: (ctx) => {
    const statePtr = intPointer();
    const progressPtr = intPointer();
    const ret = XR_Vein_GetEnrollState(ctx, statePtr, progressPtr, null);
    checkResult(ret, 'XR_Vein_GetEnrollState');
    return {
      state: statePtr.readInt32LE(0),
      progress: progressPtr.readInt32LE(0),
    };
  },
  XR_Vein_GetFeatSize: (ctx, featType = 0) => {
    const sizePtr = intPointer();
    const ret = XR_Vein_GetFeatSize(ctx, featType, sizePtr, null);
    checkResult(ret, 'XR_Vein_GetFeatSize');
    return sizePtr.readInt32LE(0);
  },
  XR_Vein_FinishEnroll: (ctx, sample1Buf, sample2Buf, resultFeatBuf) => {
    const ret = XR_Vein_FinishEnroll(ctx, sample1Buf, sample2Buf, resultFeatBuf);
    checkResult(ret, 'XR_Vein_FinishEnroll');
    return resultFeatBuf;
  },
  XR_Vein_fp32FeatureToMyFeature: (ctx) => {
    const ret = XR_Vein_fp32FeatureToMyFeature(ctx);
    checkResult(ret, 'XR_Vein_fp32FeatureToMyFeature');
    return ret;
  },
  XR_Vein_CapRecgFeat: (ctx, featBuf, featSize) => {
    const ret = XR_Vein_CapRecgFeat(ctx, featBuf, featSize, null);
    checkResult(ret, 'XR_Vein_CapRecgFeat');
    return featBuf;
  },
  XR_Vein_CheckFeat: (featBuf, featSize) => {
    const qualityPtr = intPointer();
    const ret = XR_Vein_CheckFeat(featBuf, featSize, qualityPtr, null);
    checkResult(ret, 'XR_Vein_CheckFeat');
    return qualityPtr.readInt32LE(0);
  },
  XR_Vein_CalcFeatureDist: (feat1, size1, feat2, size2) => {
    const ret = XR_Vein_CalcFeatureDist(feat1, size1, feat2, size2);
    if (typeof ret !== 'number') {
      throw new Error('XR_Vein_CalcFeatureDist returned non-number result');
    }
    return ret;
  },
  XR_Vein_SetRgbState: (ctx, r, g, b) => {
    const ret = XR_Vein_SetRgbState(ctx, r, g, b);
    checkResult(ret, 'XR_Vein_SetRgbState');
    return ret;
  },
  XR_Vein_SetSleepMode: (ctx, mode, timeoutMs) => {
    const ret = XR_Vein_SetSleepMode(ctx, mode, timeoutMs);
    checkResult(ret, 'XR_Vein_SetSleepMode');
    return ret;
  },
  XR_Vein_PlayWav: (ctx, filePath, volume, loop) => {
    const ret = XR_Vein_PlayWav(ctx, filePath, volume, loop);
    checkResult(ret, 'XR_Vein_PlayWav');
    return ret;
  },
  XR_Vein_SetVolume: (ctx, volume) => {
    const ret = XR_Vein_SetVolume(ctx, volume);
    checkResult(ret, 'XR_Vein_SetVolume');
    return ret;
  },
};
