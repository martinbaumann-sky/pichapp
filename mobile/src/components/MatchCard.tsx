import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { MatchSummary } from '../api/matches';

const formatPrice = (price: number) => {
  if (price <= 0) return 'Gratis';
  return `$${price.toLocaleString('es-CL')}`;
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

export function MatchCard({ match }: Props) {
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
          <View style={[styles.badge, match.confirmed ? styles.badgeConfirmed : styles.badgePending]}>
            <Text style={styles.badgeText}>{match.confirmed ? 'Confirmado' : 'Buscando'}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{match.comuna}</Text>
        <Text style={styles.meta}>{formatDateTime(match.startsAt)}</Text>
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: {
    width: '100%',
    height: 160,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    color: colors.textSecondary,
    fontSize: 18,
    letterSpacing: 2,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  spots: {
    color: colors.textSecondary,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeConfirmed: {
    backgroundColor: 'rgba(33, 197, 93, 0.15)',
  },
  badgePending: {
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});
