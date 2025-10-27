import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  message?: string;
};

export function LoadingState({ message = 'Cargando...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  text: {
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
