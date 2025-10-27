import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  title?: string;
  message?: string;
};

export function ErrorState({ title = 'Uy!', message = 'Ocurrió un error inesperado.' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
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
  title: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
});
