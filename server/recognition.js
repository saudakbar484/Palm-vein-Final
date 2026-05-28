const vein = require('./vein-bridge');
const deviceManager = require('./device-manager');
const db = require('./database');
const hardwareControl = require('./hardware-control');

const DEFAULT_MATCH_THRESHOLD = 3000;

function featureScoreToConfidence(score) {
  return Math.max(0, Math.round(100 - score / 30));
}

async function recognizeOneToMany() {
  if (!deviceManager.opened) {
    throw new Error('Device not opened');
  }
  vein.XR_Vein_GrabFeatureFromFullImg(deviceManager.ctx);
  const featSize = vein.XR_Vein_GetFeatSize(deviceManager.ctx, 0);
  const probe = Buffer.alloc(featSize);
  vein.XR_Vein_fp32FeatureToMyFeature(deviceManager.ctx);
  vein.XR_Vein_CapRecgFeat(deviceManager.ctx, probe, featSize);
  const quality = vein.XR_Vein_CheckFeat(probe, featSize);
  if (quality < 40) {
    throw new Error('Low quality feature capture. Please retry.');
  }

  const identities = db.listIdentities();
  let best = null;
  for (const identity of identities) {
    const distance = vein.XR_Vein_CalcFeatureDist(probe, featSize, identity.feat_data, identity.feat_size);
    if (!best || distance < best.score) {
      best = { identity, score: distance };
    }
  }

  const matched = best && best.score <= DEFAULT_MATCH_THRESHOLD;
  const confidence = best ? featureScoreToConfidence(best.score) : 0;
  if (matched) {
    hardwareControl.setRgbState(0, 255, 0);
    hardwareControl.playPreset('match');
  } else {
    hardwareControl.setRgbState(255, 0, 0);
    hardwareControl.playPreset('fail');
  }
  db.logRecognition({
    identityId: matched ? best.identity.id : null,
    score: best ? best.score : null,
    confidence,
    matched,
    quality,
  });

  return {
    matched,
    identity: matched ? { id: best.identity.id, name: best.identity.name } : null,
    score: best ? best.score : null,
    confidence,
    quality,
  };
}

async function verifyOneToOne(identityId) {
  const identity = db.getIdentity(identityId);
  if (!identity) {
    throw new Error('Identity not found');
  }
  const probeResult = await recognizeOneToMany();
  const matched = probeResult.matched && probeResult.identity.id === identityId;
  return { ...probeResult, matched, requestedId: identityId };
}

module.exports = {
  recognizeOneToMany,
  verifyOneToOne,
};
