import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Screen } from '../../src/components/Screen';
import { Button } from '../../src/components/Button';
import { colors } from '../../src/theme/colors';

const steps = [
  {
    number: '1',
    title: 'Explora partidos',
    description: 'Filtra por comuna, nivel o fecha para encontrar tu próxima pichanga oficial.',
  },
  {
    number: '2',
    title: 'Reserva y paga',
    description: 'Confirma tu cupo con Mercado Pago y recibe confirmación inmediata en tu correo.',
  },
  {
    number: '3',
    title: 'Juega y disfruta',
    description: 'Llega con tu QR, conoce nuevos equipos y evalúa la experiencia en la app.',
  },
];

const highlights = [
  {
    title: 'Una app nativa alineada al sitio web',
    description:
      'La misma identidad visual, los mismos módulos y sincronización en tiempo real con la plataforma web oficial.',
  },
  {
    title: 'Herramientas modernas',
    description:
      'Recibe notificaciones push, guarda tus partidos favoritos y administra reservas sin salir del teléfono.',
  },
  {
    title: 'Para jugadores y canchas',
    description:
      'Si administras una cancha puedes publicar partidos, confirmar pagos y llevar el control desde cualquier lugar.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const heroStyle = {
    opacity: fadeAnim,
    transform: [
      {
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.heroCard, heroStyle]}> 
          <LinearGradient
            colors={['#ffffff', '#e0f7f9', '#f0fff4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          />
          <Text style={styles.heroTitle}>Partidos oficiales organizados por canchas.</Text>
          <Text style={styles.heroSubtitle}>
            Reserva tu cupo y juega hoy con pagos seguros, cupos garantizados y canchas verificadas.
          </Text>
          <View style={styles.heroCtas}>
            <Button label="Explorar partidos" onPress={() => router.push('/explorar')} />
            <Button
              label="¿Administras una cancha?"
              variant="secondary"
              onPress={() => router.push('/organizar')}
            />
          </View>
          <Text style={styles.heroHelper}>Pagos protegidos, notificaciones al equipo y administración desde la app.</Text>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Cómo funciona</Text>
          <View style={styles.stepsGrid}>
            {steps.map((step) => (
              <View key={step.number} style={styles.stepCard}>
                <Text style={styles.stepNumber}>{step.number}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Todo lo que ya conoces de la web</Text>
          <View style={styles.highlightsGrid}>
            {highlights.map((item) => (
              <View key={item.title} style={styles.highlightCard}>
                <Text style={styles.highlightTitle}>{item.title}</Text>
                <Text style={styles.highlightDescription}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 28,
    gap: 28,
  },
  heroCard: {
    position: 'relative',
    borderRadius: 28,
    padding: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 32,
    elevation: 4,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  heroCtas: {
    marginTop: 24,
    flexDirection: 'column',
    gap: 12,
  },
  heroHelper: {
    marginTop: 20,
    color: colors.textMuted,
    fontSize: 13,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  section: {
    gap: 16,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  stepsGrid: {
    gap: 16,
  },
  stepCard: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 3,
  },
  stepNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  highlightsGrid: {
    gap: 16,
  },
  highlightCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 3,
    gap: 8,
  },
  highlightTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  highlightDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
