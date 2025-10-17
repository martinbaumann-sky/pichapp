import { forwardRef } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { colors } from '../theme/colors';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = forwardRef<TextInput, Props>(({ label, error, style, containerStyle, ...props }, ref) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, error ? styles.inputError : null, style]}
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
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    backgroundColor: '#131b26',
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 12,
  },
});
