import { useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { TextField } from '../../src/components/TextField';
import { Button } from '../../src/components/Button';
import { colors } from '../../src/theme/colors';
import { useSession } from '../../src/hooks/useSession';
import { LoadingState } from '../../src/components/LoadingState';
import { createMatch } from '../../src/api/matches';

const LEVEL_OPTIONS = [
  { label: 'Principiante', value: 'BEGINNER' },
  { label: 'Intermedio', value: 'INTERMEDIATE' },
  { label: 'Avanzado', value: 'ADVANCED' },
];

const defaultStart = () => {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0, 0);
  return tomorrow;
};

export default function OrganizeScreen() {
  const { user, loading, error, login } = useSession();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [startsAt, setStartsAt] = useState(defaultStart());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState('Partido amistoso');
  const [comuna, setComuna] = useState('Santiago');
  const [venueName, setVenueName] = useState('Cancha principal');
  const [venueAddress, setVenueAddress] = useState('');
  const [duration, setDuration] = useState('90');
  const [price, setPrice] = useState('6000');
  const [totalSpots, setTotalSpots] = useState('10');
  const [minSpots, setMinSpots] = useState('6');
  const [level, setLevel] = useState('INTERMEDIATE');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const displayDate = useMemo(() => {
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(startsAt);
  }, [startsAt]);

  if (loading) {
    return (
      <Screen>
        <LoadingState message="Preparando el organizador" />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.authContainer}>
          <View style={styles.card}>
            <Text style={styles.heading}>Inicia sesión para organizar partidos</Text>
            <Text style={styles.subheading}>
              Usa la misma cuenta que en la web. Guardaremos la sesión en el dispositivo para que puedas administrar tus
              partidos desde la app.
            </Text>
            <TextField label="Email" value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextField label="Contraseña" value={loginPassword} onChangeText={setLoginPassword} secureTextEntry />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button
              label={loginLoading ? 'Ingresando...' : 'Iniciar sesión'}
              onPress={async () => {
                setLoginLoading(true);
                setSubmitError(null);
                try {
                  await login(loginEmail.trim(), loginPassword);
                  setLoginEmail('');
                  setLoginPassword('');
                } catch (err: any) {
                  setSubmitError(err?.message ?? 'No fue posible iniciar sesión');
                } finally {
                  setLoginLoading(false);
                }
              }}
              disabled={loginLoading}
              style={{ marginTop: 8 }}
            />
            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.formContainer}>
        <View style={styles.card}>
          <Text style={styles.heading}>Publica una pichanga</Text>
          <Text style={styles.subheading}>Completa los detalles para compartirla con toda la comunidad.</Text>
          <TextField label="Título" value={title} onChangeText={setTitle} />
          <TextField label="Comuna" value={comuna} onChangeText={setComuna} />
          <TextField label="Cancha" value={venueName} onChangeText={setVenueName} />
          <TextField label="Dirección" value={venueAddress} onChangeText={setVenueAddress} placeholder="Av. Siempre Viva 123" />

          <View style={styles.inlineRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Fecha y hora</Text>
              <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{displayDate}</Text>
              </Pressable>
            </View>
          </View>

          {showDatePicker ? (
            <DateTimePicker
              value={startsAt}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, date) => {
                if (Platform.OS !== 'ios') {
                  setShowDatePicker(false);
                }
                if (date) {
                  setStartsAt(date);
                }
              }}
            />
          ) : null}

          <View style={styles.inlineRow}>
            <TextField
              label="Duración (min)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
            />
            <TextField
              label="Precio por cupo"
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
            />
          </View>
          <View style={styles.inlineRow}>
            <TextField
              label="Cupos totales"
              value={totalSpots}
              onChangeText={setTotalSpots}
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
            />
            <TextField
              label="Cupos para confirmar"
              value={minSpots}
              onChangeText={setMinSpots}
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
            />
          </View>

          <View style={styles.levelRow}>
            <Text style={styles.label}>Nivel</Text>
            <View style={styles.levelChips}>
              {LEVEL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setLevel(opt.value)}
                  style={[styles.levelChip, level === opt.value ? styles.levelChipActive : null]}
                >
                  <Text style={[styles.levelChipText, level === opt.value ? styles.levelChipTextActive : null]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {submitMessage ? <Text style={styles.successText}>{submitMessage}</Text> : null}
          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

          <Button
            label={submitting ? 'Publicando...' : 'Publicar partido'}
            onPress={async () => {
              setSubmitError(null);
              setSubmitMessage(null);
              setSubmitting(true);
              try {
                const total = Number.parseInt(totalSpots, 10) || 0;
                const minRequired = Number.parseInt(minSpots, 10) || Math.max(1, Math.round(total * 0.6));
                const payload = {
                  title: title.trim(),
                  comuna: comuna.trim(),
                  startsAt: startsAt.toISOString(),
                  durationMins: Number.parseInt(duration, 10) || 90,
                  pricePerSpot: Number.parseInt(price, 10) || 0,
                  totalSpots: Math.max(1, total),
                  minSpotsToConfirm: Math.max(1, Math.min(minRequired, Math.max(1, total))),
                  level,
                  venueName: venueName.trim(),
                  venueAddress: venueAddress.trim(),
                  public: true,
                };
                await createMatch(payload);
                setSubmitMessage('Partido publicado correctamente. Puedes seguirlo desde el panel.');
              } catch (err: any) {
                setSubmitError(err?.message ?? 'No fue posible crear el partido');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    paddingVertical: 32,
    gap: 16,
  },
  formContainer: {
    paddingVertical: 24,
    gap: 16,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subheading: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  label: {
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  dateButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  dateText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  levelRow: {
    gap: 12,
  },
  levelChips: {
    flexDirection: 'row',
    gap: 12,
  },
  levelChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  levelChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
    borderColor: colors.primary,
  },
  levelChipText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  levelChipTextActive: {
    color: colors.primary,
  },
  successText: {
    color: colors.success,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 26,
    elevation: 4,
    gap: 16,
  },
});
