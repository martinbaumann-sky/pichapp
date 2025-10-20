const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Permite a Metro resolver paquetes desde la raíz del monorepo
config.watchFolders = [workspaceRoot];

// Fuerza a Metro a tomar React y React Native del workspace mobile,
// evitando que use la copia de la web (React 18) que causa el error de hooks.
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native')
};

// Alias directo para módulos internos que cambiaron en RN 0.81+
config.resolver.alias = {
  'react-native/Libraries/Utilities/LoadingView': path.resolve(
    projectRoot,
    'shims',
    'LoadingView.js'
  )
};

module.exports = config;