import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = PropsWithChildren<{
  tone?: 'default' | 'accent';
}>;

export function Chip({ tone = 'default', children }: Props) {
  return (
    <View style={[styles.base, tone === 'accent' ? styles.accent : null]}>
      <Text style={[styles.text, tone === 'accent' ? styles.accentText : null]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(154, 165, 177, 0.16)',
  },
  accent: {
    backgroundColor: 'rgba(0, 194, 168, 0.18)',
  },
  text: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  accentText: {
    color: colors.secondary,
  },
});
