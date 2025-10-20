import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '../../src/components/Screen';
import { Button } from '../../src/components/Button';
import { colors } from '../../src/theme/colors';

const heroImage = { uri: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80' };

export default function HomeScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <ImageBackground source={heroImage} style={styles.heroImage} imageStyle={styles.heroImageRadius}>
            <View style={styles.overlay}>
              <Text style={styles.heroTitle}>Organiza y juega pichangas inolvidables</Text>
              <Text style={styles.heroSubtitle}>
                Reserva canchas, asegura cupos y coordina a tu equipo con la misma experiencia premium que conoces en
                la web.
              </Text>
              <Button label="Explorar partidos" onPress={() => router.push('/explorar')} style={styles.heroCta} />
            </View>
          </ImageBackground>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Una app nativa para iOS y Android</Text>
          <Text style={styles.sectionText}>
            Diseñamos una experiencia optimizada para el móvil con navegación por pestañas, acceso rápido a tus
            partidos y recordatorios automáticos.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sincronizada con la web</Text>
          <Text style={styles.sectionText}>
            Inicia sesión con tu misma cuenta y todo se mantiene al día: partidos, pagos, cupos y comunicaciones.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    gap: 24,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroImage: {
    minHeight: 320,
    justifyContent: 'flex-end',
  },
  heroImageRadius: {
    borderRadius: 24,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    padding: 24,
    gap: 16,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  heroCta: {
    alignSelf: 'flex-start',
  },
  section: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  sectionText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
