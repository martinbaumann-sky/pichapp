import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '../../src/components/Screen';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { useSession } from '../../src/hooks/useSession';
import { colors } from '../../src/theme/colors';
import { useMatches } from '../../src/hooks/useMatches';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, loading, logout } = useSession();
  const { data } = useMatches({});

  const suggested = useMemo(() => (data ?? []).slice(0, 3), [data]);

  if (loading) {
    return (
      <Screen>
        <LoadingState message="Cargando tu perfil" />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.heading}>Bienvenido a PichangApp</Text>
          <Text style={styles.subheading}>
            Inicia sesión desde la pestaña “Organizar” para sincronizar tu perfil, administrar tus partidos y recibir
            notificaciones.
          </Text>
          <Button label="Ir a Organizar" onPress={() => router.push('/organizar')} style={{ marginTop: 16 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.heading}>Hola, {user.name ?? 'jugador'}</Text>
          <Text style={styles.subheading}>
            Todo lo que organizes o reserves aquí queda sincronizado con la versión web y la base de datos existente.
          </Text>
          <View style={styles.profileRow}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Email</Text>
              <Text style={styles.profileValue}>{user.email}</Text>
            </View>
            {user.comuna ? (
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Comuna</Text>
                <Text style={styles.profileValue}>{user.comuna}</Text>
              </View>
            ) : null}
            {user.position ? (
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Posición</Text>
                <Text style={styles.profileValue}>{user.position}</Text>
              </View>
            ) : null}
          </View>
          <Button label="Cerrar sesión" variant="ghost" onPress={logout} style={{ marginTop: 16 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Próximas sugerencias</Text>
          <Text style={styles.subheading}>Tres partidos destacados para inspirarte.</Text>
          {suggested.map((match) => (
            <View key={match.id} style={styles.suggestion}>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionTitle}>{match.title}</Text>
                <Text style={styles.suggestionMeta}>
                  {match.comuna} · {new Date(match.startsAt).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })}
                </Text>
              </View>
              <Button label="Ver" variant="secondary" onPress={() => router.push(`/match/${match.id}`)} />
            </View>
          ))}
          {suggested.length === 0 ? <Text style={styles.subheading}>Aún no hay partidos publicados.</Text> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 24,
    gap: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  subheading: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  profileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  profileItem: {
    minWidth: '45%',
  },
  profileLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  suggestionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionMeta: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
