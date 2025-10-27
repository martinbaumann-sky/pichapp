const { version } = require('react-native/Libraries/Core/ReactNativeVersion');
const { getExpoConstants } = require('./expoConstants');

const DEFAULT_CONSTANTS = {
  forceTouchAvailable: false,
  interfaceIdiom: 'phone',
  isTesting: typeof jest !== 'undefined',
  isDisableAnimations: false,
  osVersion: '0.0',
  reactNativeVersion: version,
  systemName: 'iOS',
  isMacCatalyst: false,
};

function readExpoConstants() {
  const expoConstants = getExpoConstants();

  if (!expoConstants) {
    return {};
  }

  const resolved = {};

  const systemVersion =
    expoConstants.systemVersion ?? expoConstants.osVersion ?? expoConstants.iosVersion;
  if (typeof systemVersion === 'string' && systemVersion.length > 0) {
    resolved.osVersion = systemVersion;
  }

  const systemName = expoConstants.systemName ?? expoConstants.osName;
  if (typeof systemName === 'string' && systemName.length > 0) {
    resolved.systemName = systemName;
  }

  const userInterfaceIdiom =
    expoConstants.userInterfaceIdiom ??
    expoConstants.interfaceIdiom ??
    expoConstants.platform?.ios?.userInterfaceIdiom;
  if (typeof userInterfaceIdiom === 'string' && userInterfaceIdiom.length > 0) {
    resolved.interfaceIdiom = userInterfaceIdiom;
  }

  if (typeof expoConstants.forceTouchAvailable === 'boolean') {
    resolved.forceTouchAvailable = expoConstants.forceTouchAvailable;
  }

  if (typeof expoConstants.isTesting === 'boolean') {
    resolved.isTesting = expoConstants.isTesting;
  }

  if (typeof expoConstants.isDisableAnimations === 'boolean') {
    resolved.isDisableAnimations = expoConstants.isDisableAnimations;
  }

  if (typeof expoConstants.isMacCatalyst === 'boolean') {
    resolved.isMacCatalyst = expoConstants.isMacCatalyst;
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
};
