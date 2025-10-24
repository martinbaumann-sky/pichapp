'use strict';

/**
 * Lightweight shim around React Native's TurboModuleRegistry that injects
 * JavaScript fallbacks for TurboModules Expo Go does not provide.
 */

const invariant = require('invariant');
const NativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');
const { getExpoConstants } = require('./expoConstants');

const runtimeGlobal = typeof globalThis !== 'undefined' ? globalThis : global;

const moduleLoadHistory = {
  NativeModules: [],
  TurboModules: [],
  FallbackModules: [],
  NotFound: [],
};

function isBridgeless() {
  return global.RN$Bridgeless === true;
}

function isTurboModuleInteropEnabled() {
  return global.RN$TurboInterop === true;
}

const fallbackFactories = new Map();
const fallbackInstances = new Map();

function registerFallbackTurboModule(name, factory) {
  fallbackFactories.set(name, factory);
}

function getFallbackTurboModule(name) {
  if (fallbackInstances.has(name)) {
    return fallbackInstances.get(name);
  }

  const factory = fallbackFactories.get(name);
  if (!factory) {
    return null;
  }

  const instance = factory();
  fallbackInstances.set(name, instance);
  return instance;
}

function readPlatformFromGlobals() {
  const platform = runtimeGlobal?.RN$Platform;
  const os = platform?.OS;
  if (typeof os === 'string' && os.length > 0) {
    return os;
  }

  const osOverride = runtimeGlobal?.expoPlatform;
  if (typeof osOverride === 'string' && osOverride.length > 0) {
    return osOverride;
  }

  return null;
}

function inferRuntimePlatform() {
  if (inferRuntimePlatform.cached) {
    return inferRuntimePlatform.cached;
  }

  const globalPlatform = readPlatformFromGlobals();
  if (globalPlatform) {
    inferRuntimePlatform.cached = globalPlatform;
    return globalPlatform;
  }

  const expoConstants = getExpoConstants();
  if (expoConstants) {
    const platformInfo = expoConstants.platform;
    if (platformInfo && typeof platformInfo === 'object') {
      if (platformInfo.android) {
        inferRuntimePlatform.cached = 'android';
        return inferRuntimePlatform.cached;
      }

      if (platformInfo.ios) {
        inferRuntimePlatform.cached = 'ios';
        return inferRuntimePlatform.cached;
      }
    }

    const systemName =
      expoConstants.systemName ??
      expoConstants.osName ??
      expoConstants.platform?.osName ??
      expoConstants.platform?.web?.platform ??
      expoConstants.platform?.web?.osName;
    if (typeof systemName === 'string' && systemName.length > 0) {
      const normalized = systemName.toLowerCase();
      if (normalized.includes('android')) {
        inferRuntimePlatform.cached = 'android';
        return inferRuntimePlatform.cached;
      }
      if (normalized.includes('ios') || normalized.includes('mac')) {
        inferRuntimePlatform.cached = 'ios';
        return inferRuntimePlatform.cached;
      }
    }
  }

  const navigatorObject = typeof navigator !== 'undefined' ? navigator : undefined;
  if (navigatorObject) {
    const userAgent = navigatorObject.userAgent;
    if (typeof userAgent === 'string' && userAgent.length > 0) {
      const normalizedUA = userAgent.toLowerCase();
      if (normalizedUA.includes('android')) {
        inferRuntimePlatform.cached = 'android';
        return inferRuntimePlatform.cached;
      }
      if (
        normalizedUA.includes('iphone') ||
        normalizedUA.includes('ipad') ||
        normalizedUA.includes('ios')
      ) {
        inferRuntimePlatform.cached = 'ios';
        return inferRuntimePlatform.cached;
      }
    }

    const product = navigatorObject.product;
    if (typeof product === 'string' && product.length > 0) {
      const normalizedProduct = product.toLowerCase();
      if (normalizedProduct.includes('android')) {
        inferRuntimePlatform.cached = 'android';
        return inferRuntimePlatform.cached;
      }
      if (normalizedProduct.includes('iphone') || normalizedProduct.includes('ipad')) {
        inferRuntimePlatform.cached = 'ios';
        return inferRuntimePlatform.cached;
      }
    }
  }

  inferRuntimePlatform.cached = 'ios';
  return inferRuntimePlatform.cached;
}

registerFallbackTurboModule('PlatformConstants', () => {
  const runtimePlatform = inferRuntimePlatform();

  if (runtimePlatform === 'android') {
    const constantsModule = require('./NativePlatformConstantsAndroid');
    return {
      getConstants() {
        return constantsModule.getConstants();
      },
      getAndroidID() {
        return constantsModule.getAndroidID();
      },
    };
  }

  const constantsModule = require('./NativePlatformConstantsIOS');
  return {
    getConstants() {
      return constantsModule.getConstants();
    },
  };
});

function shouldReportDebugInfo() {
  return true;
}

function requireModule(name) {
  if (!isBridgeless() || isTurboModuleInteropEnabled()) {
    const legacyModule = NativeModules[name];
    if (legacyModule != null) {
      if (shouldReportDebugInfo()) {
        moduleLoadHistory.NativeModules.push(name);
      }
      return legacyModule;
    }
  }

  const turboModuleProxy = global.__turboModuleProxy;
  if (typeof turboModuleProxy === 'function') {
    const module = turboModuleProxy(name);
    if (module != null) {
      if (shouldReportDebugInfo()) {
        moduleLoadHistory.TurboModules.push(name);
      }
      return module;
    }
  }

  const fallbackModule = getFallbackTurboModule(name);
  if (fallbackModule != null) {
    if (shouldReportDebugInfo()) {
      moduleLoadHistory.FallbackModules.push(name);
    }
    return fallbackModule;
  }

  if (shouldReportDebugInfo() && !moduleLoadHistory.NotFound.includes(name)) {
    moduleLoadHistory.NotFound.push(name);
  }

  return null;
}

function get(name) {
  return requireModule(name);
}

function getEnforcing(name) {
  const module = requireModule(name);
  let message =
    `TurboModuleRegistry.getEnforcing(...): '${name}' could not be found. ` +
    'Verify that a module by this name is registered in the native binary.';

  if (shouldReportDebugInfo()) {
    message += ' Bridgeless mode: ' + (isBridgeless() ? 'true' : 'false') + '. ';
    message +=
      'TurboModule interop: ' +
      (isTurboModuleInteropEnabled() ? 'true' : 'false') +
      '. ';
    message += 'Modules loaded: ' + JSON.stringify(moduleLoadHistory);
  }

  invariant(module != null, message);
  return module;
}

module.exports = {
  get,
  getEnforcing,
};
