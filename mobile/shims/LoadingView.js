// React Native 0.81 elimina el módulo interno LoadingView. Expo aún lo solicita
// desde @expo/metro-runtime, por lo que creamos este shim que reexporta
// la implementación actual (DevLoadingView).
module.exports = require('react-native/Libraries/Utilities/DevLoadingView');
