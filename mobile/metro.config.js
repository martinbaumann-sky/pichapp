const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const { resolve: metroResolve } = require('metro-resolver');

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
  ...(config.resolver.extraNodeModules ?? {}),
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

const shimMap = new Map(
  [
    ['react-native/Libraries/Utilities/LoadingView', 'LoadingView.js'],
    [
      'react-native/src/private/webapis/performance/specs/NativePerformance',
      'NativePerformance.js',
    ],
    [
      'react-native/src/private/webapis/performance/specs/NativePerformanceObserver',
      'NativePerformanceObserver.js',
    ],
    ['react-native/Libraries/WebPerformance/NativePerformance', 'NativePerformance.js'],
    [
      'react-native/Libraries/WebPerformance/NativePerformanceObserver',
      'NativePerformanceObserver.js',
    ],
  ].map(([moduleName, shim]) => [moduleName, path.resolve(projectRoot, 'shims', shim)])
);

const previousResolveRequest = config.resolver.resolveRequest;
const fallbackResolveRequest =
  typeof previousResolveRequest === 'function'
    ? previousResolveRequest
    : (context, moduleName, platform) => metroResolve(context, moduleName, platform);

function resolveShim(moduleName, platform) {
  if (moduleName.startsWith('react-native/Libraries/Utilities/NativePlatformConstants')) {
    const shimFile =
      platform === 'android'
        ? 'NativePlatformConstantsAndroid.js'
        : 'NativePlatformConstantsIOS.js';

    return path.resolve(projectRoot, 'shims', shimFile);
  }

  return shimMap.get(moduleName) ?? null;
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const shimPath = resolveShim(moduleName, platform);

  if (shimPath) {
    return {
      type: 'sourceFile',
      filePath: shimPath,
    };
  }

  return fallbackResolveRequest(context, moduleName, platform);
};

// Ignorar artefactos de Next.js
config.resolver.blockList = exclusionList([/web\/\.next\/.*/]);

module.exports = config;
