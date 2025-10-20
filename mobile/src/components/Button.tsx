import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, PressableProps, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ label, variant = 'primary', style, disabled, ...props }: Props) {
  const labelStyles = [styles.label, styles[`${variant}Label` as const]];
  if (disabled && variant !== 'primary') {
    labelStyles.push(styles.disabledLabel);
  }

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          pointerEvents="none"
          colors={[colors.primary, colors.primaryAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      ) : null}
      <Text style={labelStyles}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  primaryLabel: {
    color: '#ffffff',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostLabel: {
    color: colors.primary,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.6,
  },
  disabledLabel: {
    color: colors.textMuted,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
});
