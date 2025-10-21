const { version } = require('react-native/Libraries/Core/ReactNativeVersion');

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
  try {
    // expo-constants returns a plain object but gracefully handles missing native module.
    // In a bridgeless / Expo Go runtime without the native PlatformConstants module,
    // the object may be mostly empty – that's fine, we simply fall back to defaults.
    const expoConstantsModule = require('expo-constants');
    const expoConstants = expoConstantsModule?.default ?? expoConstantsModule;

    if (!expoConstants || typeof expoConstants !== 'object') {
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
  } catch (error) {
    // expo-constants might not be available or could throw if it can't locate its native module.
    // In that situation we simply fall back to our default constants.
    return {};
  }
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
