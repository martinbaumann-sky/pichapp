const { version: rnVersion } = require('react-native/Libraries/Core/ReactNativeVersion');
const { getExpoConstants } = require('./expoConstants');

const DEFAULT_CONSTANTS = {
  isTesting: typeof jest !== 'undefined',
  isDisableAnimations: false,
  reactNativeVersion: rnVersion,
  Version: 0,
  Release: '0',
  Serial: 'unknown',
  Fingerprint: 'unknown',
  Model: 'unknown',
  ServerHost: undefined,
  uiMode: 'normal',
  Brand: 'unknown',
  Manufacturer: 'unknown',
};

function readExpoConstants() {
  const expoConstants = getExpoConstants();

  if (!expoConstants) {
    return {};
  }

  const resolved = {};

  const release = expoConstants.androidVersion ?? expoConstants.releaseChannel;
  if (typeof release === 'string' && release.length > 0) {
    resolved.Release = release;
  }

  const apiLevel =
    expoConstants.androidApiLevel ?? expoConstants.platform?.android?.versionCode;
  if (typeof apiLevel === 'number' && Number.isFinite(apiLevel)) {
    resolved.Version = apiLevel;
  }

  const uiMode = expoConstants.androidUiMode ?? expoConstants.uiMode;
  if (typeof uiMode === 'string' && uiMode.length > 0) {
    resolved.uiMode = uiMode;
  }

  const brand = expoConstants.androidBrand ?? expoConstants.brand;
  if (typeof brand === 'string' && brand.length > 0) {
    resolved.Brand = brand;
  }

  const manufacturer = expoConstants.androidManufacturer ?? expoConstants.manufacturer;
  if (typeof manufacturer === 'string' && manufacturer.length > 0) {
    resolved.Manufacturer = manufacturer;
  }

  const model = expoConstants.androidModel ?? expoConstants.model;
  if (typeof model === 'string' && model.length > 0) {
    resolved.Model = model;
  }

  const fingerprint = expoConstants.androidFingerprint ?? expoConstants.fingerprint;
  if (typeof fingerprint === 'string' && fingerprint.length > 0) {
    resolved.Fingerprint = fingerprint;
  }

  const serial = expoConstants.androidId ?? expoConstants.deviceId;
  if (typeof serial === 'string' && serial.length > 0) {
    resolved.Serial = serial;
  }

  const serverHost = expoConstants.debuggerHost ?? expoConstants.hostUri;
  if (typeof serverHost === 'string' && serverHost.length > 0) {
    resolved.ServerHost = serverHost;
  }

  if (typeof expoConstants.isDisableAnimations === 'boolean') {
    resolved.isDisableAnimations = expoConstants.isDisableAnimations;
  }

  if (typeof expoConstants.isTesting === 'boolean') {
    resolved.isTesting = expoConstants.isTesting;
  }

  return resolved;
}

let cachedConstants;

module.exports = {
  getConstants() {
    if (!cachedConstants) {
      cachedConstants = Object.freeze({
        ...DEFAULT_CONSTANTS,
        ...readExpoConstants(),
      });
    }

    return cachedConstants;
  },
  getAndroidID() {
    const expoConstants = getExpoConstants();
    const androidId = expoConstants?.androidId ?? expoConstants?.deviceId;
    if (typeof androidId === 'string' && androidId.length > 0) {
      return androidId;
    }

    return 'unknown';
  },
};
