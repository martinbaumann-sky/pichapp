import { Pressable, PressableProps, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ label, variant = 'primary', style, ...props }: Props) {
  return (
    <Pressable style={[styles.base, styles[variant], style]} accessibilityRole="button" {...props}>
      <Text style={[styles.label, styles[`${variant}Label` as const]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryLabel: {
    color: '#101820',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textPrimary,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostLabel: {
    color: colors.textSecondary,
  },
});
