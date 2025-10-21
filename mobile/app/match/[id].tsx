import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { LoadingState } from '../../src/components/LoadingState';
import { ErrorState } from '../../src/components/ErrorState';
import { colors } from '../../src/theme/colors';
import { Button } from '../../src/components/Button';
import { getMatch, joinMatch } from '../../src/api/matches';

function useMatch(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ['match', id],
    queryFn: () => getMatch(id as string),
  });
}

export default function MatchDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const matchId = typeof params.id === 'string' ? params.id : null;
  const { data, isLoading, isError, refetch, isRefetching } = useMatch(matchId);

  if (!matchId) {
    return (
      <Screen>
        <ErrorState message="No encontramos el partido solicitado." />
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <LoadingState message="Cargando partido" />
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <ErrorState message="No pudimos cargar el detalle. Intenta nuevamente." />
        <Button label="Reintentar" onPress={() => refetch()} style={{ marginHorizontal: 16 }} />
      </Screen>
    );
  }

  const formattedDate = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data.startsAt));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Button label="Volver" variant="ghost" onPress={() => router.back()} />
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.comuna}</Text>
        </View>
        {data.coverImageUrl ? <Image source={{ uri: data.coverImageUrl }} style={styles.cover} /> : null}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Detalles del partido</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Inicio</Text>
            <Text style={styles.infoValue}>{formattedDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duración</Text>
            <Text style={styles.infoValue}>{data.durationMins ?? 90} minutos</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Precio</Text>
            <Text style={styles.infoValue}>{data.pricePerSpot > 0 ? `$${data.pricePerSpot.toLocaleString('es-CL')}` : 'Gratis'}</Text>
          </View>
          {data.level ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nivel</Text>
              <Text style={[styles.infoValue, styles.levelValue]}>{data.level}</Text>
            </View>
          ) : null}
          {data.venueAddress ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>{data.venueAddress}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Jugadores confirmados</Text>
          {data.players.length === 0 ? (
            <Text style={styles.infoValue}>Aún no hay jugadores confirmados.</Text>
          ) : (
            data.players.map((player) => (
              <View key={player.spotId} style={styles.playerRow}>
                <Text style={styles.playerName}>{player.displayName}</Text>
                <Text style={styles.playerMeta}>{player.position ?? 'Sin posición'}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Organizador</Text>
          <Text style={styles.infoValue}>{data.organizer?.name ?? 'Organizador verificado'}</Text>
        </View>

        <Button
          label={data.viewer?.hasJoined ? 'Ya estás dentro' : 'Reservar cupo'}
          onPress={async () => {
            try {
              await joinMatch(data.id);
              await refetch();
              Alert.alert('Listo', 'Confirmamos tu reserva en este partido.');
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'No fue posible unirse al partido');
            }
          }}
          disabled={isRefetching || data.viewer?.hasJoined}
          style={styles.ctaButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  cover: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 3,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  infoValue: {
    color: colors.textPrimary,
  },
  levelValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    paddingTop: 4,
  },
  playerName: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  playerMeta: {
    color: colors.textSecondary,
  },
  ctaButton: {
    marginTop: 12,
    marginBottom: 40,
  },
});
