'use strict';

/**
 * Lightweight shim around React Native's TurboModuleRegistry that injects
 * JavaScript fallbacks for TurboModules Expo Go does not provide.
 */

const invariant = require('invariant');
const NativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');
const Platform = require('react-native/Libraries/Utilities/Platform');

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

registerFallbackTurboModule('PlatformConstants', () => {
  const constantsModule =
    Platform.OS === 'android'
      ? require('./NativePlatformConstantsAndroid')
      : require('./NativePlatformConstantsIOS');

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
