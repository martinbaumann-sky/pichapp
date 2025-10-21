import { ExpoConfig } from 'expo/config';

const defineConfig = (): ExpoConfig => ({
  name: 'PichangApp',
  slug: 'pichapp-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  platforms: ['ios', 'android'],
  icon: './assets/icon.png',
  scheme: 'pichapp',
  userInterfaceStyle: 'light',
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: ['**/*'],
  ios: {,\n    bundleIdentifier: 'com.anonymous.pichappmobile'\n  },
  android: {,\n    package: 'com.anonymous.pichappmobile'\n  },
    jsEngine: 'hermes'
  },
  jsEngine: 'hermes',
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


