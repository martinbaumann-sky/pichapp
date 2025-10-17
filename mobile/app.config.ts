import { ExpoConfig } from 'expo/config';

const defineConfig = (): ExpoConfig => ({
  name: 'PichangApp',
  slug: 'pichapp-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'pichapp',
  userInterfaceStyle: 'light',
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    }
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png'
  },
  experiments: {
    typedRoutes: true
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
  }
});

export default defineConfig;
