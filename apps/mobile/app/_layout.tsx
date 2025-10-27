import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT).catch(() => {});
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
