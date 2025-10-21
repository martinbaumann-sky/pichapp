import { forwardRef, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { colors } from '../theme/colors';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = forwardRef<TextInput, Props>(({ label, error, style, containerStyle, onFocus, onBlur, ...props }, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, focused ? styles.inputFocused : null, error ? styles.inputError : null, style]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: colors.textMuted,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontSize: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 1,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
});
