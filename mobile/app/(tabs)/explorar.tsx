import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Screen } from '../../src/components/Screen';
import { MatchCard } from '../../src/components/MatchCard';
import { LoadingState } from '../../src/components/LoadingState';
import { ErrorState } from '../../src/components/ErrorState';
import { Chip } from '../../src/components/Chip';
import { colors } from '../../src/theme/colors';
import { useMatches } from '../../src/hooks/useMatches';

const COMUNAS = ['Santiago', 'Providencia', 'Ñuñoa', 'Las Condes', 'La Florida'];
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export default function ExploreScreen() {
  const [comuna, setComuna] = useState<string | undefined>();
  const [level, setLevel] = useState<string | undefined>();
  const filters = useMemo(() => ({ comuna, level }), [comuna, level]);
  const { data, isLoading, isError, refetch, isRefetching } = useMatches(filters);

  return (
    <Screen>
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <View style={styles.filtersIntro}>
              <Text style={styles.heading}>Explora pichangas oficiales</Text>
              <Text style={styles.subheading}>
                Busca partidos verificados, sincronizados con la experiencia web y con la misma estética de PichangApp.
              </Text>
            </View>
            <View style={styles.filterCard}>
              <Text style={styles.filterHeading}>Filtra tu búsqueda</Text>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Comuna</Text>
                <View style={styles.chipRow}>
                  <Chip tone={!comuna ? 'accent' : 'default'}>
                    <Pressable onPress={() => setComuna(undefined)}>
                      <Text style={styles.chipPressable}>Todas</Text>
                    </Pressable>
                  </Chip>
                  {COMUNAS.map((c) => (
                    <Chip key={c} tone={comuna === c ? 'accent' : 'default'}>
                      <Pressable onPress={() => setComuna(c)}>
                        <Text style={styles.chipPressable}>{c}</Text>
                      </Pressable>
                    </Chip>
                  ))}
                </View>
              </View>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Nivel</Text>
                <View style={styles.chipRow}>
                  <Chip tone={!level ? 'accent' : 'default'}>
                    <Pressable onPress={() => setLevel(undefined)}>
                      <Text style={styles.chipPressable}>Todos</Text>
                    </Pressable>
                  </Chip>
                  {LEVELS.map((lvl) => (
                    <Chip key={lvl} tone={level === lvl ? 'accent' : 'default'}>
                      <Pressable onPress={() => setLevel(lvl)}>
                        <Text style={styles.chipPressable}>{lvl}</Text>
                      </Pressable>
                    </Chip>
                  ))}
                </View>
              </View>
            </View>
          </View>
        }
        data={data ?? []}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <Link href={`/match/${item.id}`} asChild>
            <Pressable accessibilityRole="button" style={styles.cardWrapper}>
              <MatchCard match={item} />
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={() => {
          if (isLoading) return <LoadingState message="Buscando partidos disponibles" />;
          if (isError) {
            return <ErrorState message="No pudimos cargar los partidos. Desliza para reintentar." />;
          }
          return (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No hay partidos con estos filtros</Text>
              <Text style={styles.emptyMessage}>Prueba cambiando la comuna o el nivel de juego.</Text>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerArea: {
    gap: 20,
    paddingTop: 12,
  },
  filtersIntro: {
    gap: 12,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subheading: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 3,
    gap: 16,
  },
  filterHeading: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  filterRow: {
    gap: 12,
  },
  filterLabel: {
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chipPressable: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 48,
    paddingTop: 16,
    gap: 16,
  },
  empty: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardWrapper: {
    borderRadius: 20,
  },
});
