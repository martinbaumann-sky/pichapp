import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { MatchSummary } from '../api/matches';

const formatPrice = (price: number) => {
  if (price <= 0) return 'Gratis';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

type Props = {
  match: MatchSummary;
};

const levelTone: Record<string, string> = {
  BEGINNER: colors.success,
  INTERMEDIATE: colors.warning,
  ADVANCED: colors.danger,
};

export function MatchCard({ match }: Props) {
  const occupied = Math.max(0, match.totalSpots - match.available);
  const progress = match.totalSpots > 0 ? Math.min(1, occupied / match.totalSpots) : 0;
  const levelColor = levelTone[match.level] ?? colors.accent;

  return (
    <View style={styles.card}>
      {match.coverImageUrl ? (
        <Image source={{ uri: match.coverImageUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>Pichanga</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{match.title}</Text>
          <View style={[styles.badge, { backgroundColor: `${levelColor}1A` }]}>
            <Text style={[styles.badgeText, { color: levelColor }]}>{match.level}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{match.comuna}</Text>
        <Text style={styles.meta}>{formatDateTime(match.startsAt)}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.status, match.confirmed ? styles.statusConfirmed : styles.statusPending]}>
            {match.confirmed ? 'Confirmado' : 'Abierto'}
          </Text>
          <Text style={styles.spots}>{occupied}/{match.totalSpots} confirmados</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressIndicator, { width: `${Math.max(6, progress * 100)}%`, backgroundColor: levelColor }]} />
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(match.pricePerSpot)}</Text>
          <Text style={styles.spots}>{match.available} cupos libres</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 3,
  },
  cover: {
    width: '100%',
    height: 168,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  coverPlaceholderText: {
    color: colors.textMuted,
    fontSize: 18,
    letterSpacing: 1,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: {
    color: colors.primaryMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  spots: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusConfirmed: {
    color: colors.accent,
  },
  statusPending: {
    color: colors.warning,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.borderMuted,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 999,
  },
});
