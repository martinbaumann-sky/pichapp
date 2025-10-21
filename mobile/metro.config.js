const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Monorepo: observar raíz, pero no ascender módulos
config.watchFolders = [workspaceRoot];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// Shim para cambios internos de RN
config.resolver.alias = {
  'react-native/Libraries/Utilities/LoadingView': path.resolve(
    projectRoot,
    'shims',
    'LoadingView.js'
  ),
  'react-native/Libraries/Utilities/NativePlatformConstantsIOS': path.resolve(
    projectRoot,
    'shims',
    'NativePlatformConstantsIOS.js'
  ),
  'react-native/Libraries/Utilities/NativePlatformConstantsAndroid': path.resolve(
    projectRoot,
    'shims',
    'NativePlatformConstantsAndroid.js'
  ),
  'react-native/src/private/webapis/performance/specs/NativePerformance': path.resolve(
    projectRoot,
    'shims',
    'NativePerformance.js'
  ),
  'react-native/src/private/webapis/performance/specs/NativePerformanceObserver': path.resolve(
    projectRoot,
    'shims',
    'NativePerformanceObserver.js'
  ),
};

// Ignorar artefactos de Next.js
config.resolver.blockList = exclusionList([/web\/\.next\/.*/]);

module.exports = config;
