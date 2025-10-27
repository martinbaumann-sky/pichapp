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
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 1,
  },
  accent: {
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
    borderColor: colors.primary,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  accentText: {
    color: colors.primary,
  },
});
