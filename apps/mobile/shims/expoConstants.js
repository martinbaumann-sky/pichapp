'use strict';

let cachedExpoConstants = null;
let hasAttemptedLoad = false;

function loadExpoConstants() {
  if (hasAttemptedLoad) {
    return cachedExpoConstants;
  }

  hasAttemptedLoad = true;

  try {
    const expoConstantsModule = require('expo-constants');
    const expoConstants = expoConstantsModule?.default ?? expoConstantsModule;

    if (expoConstants && typeof expoConstants === 'object') {
      cachedExpoConstants = expoConstants;
    } else {
      cachedExpoConstants = null;
    }
  } catch (error) {
    cachedExpoConstants = null;
  }

  return cachedExpoConstants;
}

function getExpoConstants() {
  return loadExpoConstants();
}

module.exports = {
  getExpoConstants,
};
