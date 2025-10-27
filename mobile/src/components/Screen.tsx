import { PropsWithChildren } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';

export function Screen({ children }: PropsWithChildren) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(6,182,212,0.12)', 'rgba(11,143,61,0.06)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundOverlay}
      />
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
