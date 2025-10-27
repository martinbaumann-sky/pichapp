# Sistema de pagos de PichangApp con Mercado Pago

> Documento funcional y técnico para habilitar cobros de cupos con autorización diferida, split automático por plan y suscripciones autónomas de canchas.

## 1. Roles, cuentas y conexión OAuth

### 1.1 Roles
- **Jugador**: toma cupos y autoriza pagos diferidos.
- **Cancha (venue)**: crea partidos, cobra cupos y paga su plan mensual.
- **Admin PichangApp**: gestiona configuraciones globales y recibe comisiones/planes.

### 1.2 Cuentas de Mercado Pago
- **Cancha**: conecta su cuenta mediante OAuth `Connect with Mercado Pago` desde el perfil. Persistir `seller_user_id`, `access_token`, `refresh_token`, `scope`, `expires_at`, `estado_conexion` (`pending`, `active`, `revoked`).
  - Endpoint `POST /api/canchas/{id}/mercadopago/oauth/callback` procesa `code` y `state`. Idempotente por `code`.
  - Endpoint `DELETE /api/canchas/{id}/mercadopago/conexion` revoca tokens y marca `estado_conexion=revoked`.
- **Admin PichangApp**: registra una cuenta recaudadora (collector) para application fees y planes. Configurable en `POST /api/admin/mercadopago/collector`.
- Validación de publicación/confirmación de partidos: `403` si `estado_conexion != active` o `account_verified=false`.

## 2. Planes de cancha y comisiones

| Plan      | Comisión cupo (application fee) |
|-----------|---------------------------------|
| Gratis    | 14%                              |
| Avanzado  | 7%                               |
| Pro       | 2%                               |

- Configuración central en tabla `cancha_planes` con `plan`, `fee_percent`, `vigente_desde`, `vigente_hasta`.
- El cálculo de comisión ocurre en la captura (`application_fee_amount = monto_cupo * fee_percent`).
- Endpoints:
  - `GET /api/canchas/{id}/planes` lista opciones y estado actual.
  - `POST /api/canchas/{id}/planes` cambia plan; valida suscripción activa para Avanzado/Pro.

## 3. Modelo de partido y cupo

### 3.1 Estados
- **Partido**: `DRAFT`, `PUBLISHED`, `PENDING_MIN`, `CONFIRMED`, `CANCELLED`, `FAILED`.
- **Cupo**: `HELD`, `AUTHORIZED`, `CAPTURED`, `RELEASED`, `REFUND_PENDING`, `REFUNDED`, `FAILED`.

### 3.2 Orden de Cupo
```
OrdenCupo {
  id,
  partido_id,
  jugador_id,
  cancha_id,
  monto,
  estado,
  payment_id,
  authorization_expires_at,
  idempotency_key_create,
  idempotency_key_capture,
  idempotency_key_refund,
  metadata: { plan, fee_percent }
}
```

## 4. Flujo de pago con captura diferida

### 4.1 Reserva y autorización
1. Jugador solicita cupo (`POST /api/partidos/{id}/cupos`). Valida `player_has_no_other_cupo`.
2. Crear OrdenCupo en `estado=HELD`.
3. Crear pago en Mercado Pago con credenciales de la cancha:
   - `capture=false`, `binary_mode=true`.
   - `collector_id = seller_user_id` de la cancha.
   - `application_fee_amount = monto * fee_percent` (solo se debita al capturar).
   - Metadatos obligatorios: `partido_id`, `cancha_id`, `jugador_id`, `orden_cupo_id`, `plan`, `fee_percent`.
   - Guardar `payment_id` y `status_detail`.
4. Webhook `payment_authorized` o `payment_in_process` marca OrdenCupo según resultado:
   - `AUTHORIZED` si `status in ['authorized', 'in_process']`.
   - `FAILED` si `status in ['rejected', 'cancelled']`.
5. Notificar al jugador el resultado. Si `authorization_expires_at` < `deadline_partido`, programar job de revalidación.

### 4.2 Confirmación del partido
Cuando `players_confirmed >= min_players`:
1. Transactional job recorre Ordenes `AUTHORIZED`.
2. Ejecuta `POST /v1/payments/{payment_id}/capture` con `idempotency-key = OrdenCupo.idempotency_key_capture`.
3. Si `status='approved'` → estado `CAPTURED` y registrar `captured_at`.
4. Si falla, aplicar reintentos con backoff exponencial. Tras `N` fallos, estado `FAILED`, liberar cupo y notificar.

### 4.3 No alcanza el mínimo
Al expirar deadline sin mínimos:
- Para cada Orden `AUTHORIZED`, llamar `POST /v1/payments/{payment_id}` con body `status='cancelled'`. Estado → `RELEASED`.
- Notificar al jugador.

### 4.4 Cancelaciones
- **Cancha cancela antes de confirmación**: liberar autorizaciones (`RELEASED`).
- **Cancha cancela luego de confirmación**: `POST /v1/payments/{payment_id}/refunds` total. Estado → `REFUND_PENDING` hasta webhook `payment_refunded` (`REFUNDED`). Reversa de fee: registrar nota contable y `POST /v1/application_fee/{id}/refunds` si política lo permite (parametrizable `fee_refund_window_hours`).
- **Jugador cancela antes de confirmación**: `RELEASED`.
- **Jugador cancela post-confirmación**: aplicar política de reembolso de cancha (`refund_percent`). Calcular refund parcial y ajustar fee proporcional (`application_fee_refund = refund_amount * fee_percent`).

### 4.5 Expiración de autorizaciones
- Job diario revisa `authorization_expires_at <= now+24h`. Intenta `payment/capture` con `transaction_amount=0` o solicita al jugador actualizar tarjeta via `PUT /api/jugadores/{id}/metodos-pago`.

## 5. Split de dinero
- Collector de la operación: cuenta de la cancha (obtenida por OAuth).
- `application_fee_amount` se transfiere a la cuenta recaudadora de PichangApp (configuración global `collector_id_platform`).
- Resultado de captura:
  - Cancha recibe `monto - fee - tarifas_MP`.
  - PichangApp recibe `fee`.
- Multi-sede: `fee_percent` se calcula usando el plan vigente (`cancha_planes`) al momento de crear OrdenCupo.

## 6. Suscripciones de planes

### 6.1 Gestión
- `POST /api/canchas/{id}/suscripciones` crea Preapproval en Mercado Pago para planes Avanzado/Pro.
- Guardar `preapproval_id`, `status`, `next_payment_date`, `external_reference=cancha_id`.
- Estados internos de Suscripción: `ACTIVE`, `PAST_DUE`, `GRACE`, `CANCELLED`, `DOWNGRADED`.

### 6.2 Cobro mensual
1. Mercado Pago ejecuta cargo automático. Webhook `preapproval_charged` actualiza `last_payment_at`.
2. Si evento `preapproval_paused` o `preapproval_cancelled` → estado `PAST_DUE`.
3. Job diario revisa suscripciones `PAST_DUE` y crea grace period de 7 días (`GRACE`).
4. Si no se regulariza en grace → `DOWNGRADED` y plan de cancha pasa a `Gratis`.

## 7. Endpoints principales

### 7.1 Conexión de cuentas
- `GET /api/canchas/{id}/mercadopago/status`
- `POST /api/canchas/{id}/mercadopago/oauth/url` → genera URL con `state` antifraude.
- `POST /api/canchas/{id}/mercadopago/oauth/callback`
- `DELETE /api/canchas/{id}/mercadopago/conexion`

### 7.2 Gestión de planes
- `GET /api/canchas/{id}/planes`
- `POST /api/canchas/{id}/planes`
- `POST /api/canchas/{id}/suscripciones`
- `DELETE /api/canchas/{id}/suscripciones/{preapproval_id}` (opcional)

### 7.3 Partidos y cupos
- `POST /api/canchas/{id}/partidos`
- `POST /api/partidos/{id}/publicar`
- `POST /api/partidos/{id}/cupos`
- `POST /api/partidos/{id}/confirmar`
- `POST /api/partidos/{id}/cancelar`
- `POST /api/partidos/{id}/cupos/{cupo_id}/cancelar`
- `GET /api/partidos/{id}/cupos`

### 7.4 Paneles
- **Cancha**: `GET /api/canchas/{id}/ingresos`, `GET /api/canchas/{id}/partidos/{partido_id}/liquidacion`.
- **Jugador**: `GET /api/jugadores/{id}/pagos`.
- **Admin**: `GET /api/admin/mercadopago/comisiones`, `POST /api/admin/mercadopago/reintentos`, `POST /api/admin/mercadopago/refunds`.

## 8. Webhooks

### 8.1 Configuración
- Endpoint único `POST /api/mercadopago/webhooks`.
- Validar cabeceras `x-signature`, `x-request-id`. Registrar payload en `webhook_logs`.
- Procesamiento idempotente usando `event_id`.

### 8.2 Eventos y acciones
| Evento | Acción |
|--------|--------|
| `payment_authorized` | OrdenCupo → `AUTHORIZED`, guardar `authorized_at` |
| `payment_in_process` | Mantener `AUTHORIZED`, registrar motivo |
| `payment_captured`/`payment_approved` | OrdenCupo → `CAPTURED`, actualizar montos reales |
| `payment_cancelled` | OrdenCupo → `RELEASED` |
| `payment_refunded` | OrdenCupo → `REFUNDED`, ajustar fee |
| `chargeback` | OrdenCupo → `FAILED`, bloquear retiros cancha y notificar admin |
| `preapproval_created` | Suscripción → `ACTIVE` |
| `preapproval_charged` | Actualiza `last_payment_at`, mantiene `ACTIVE` |
| `preapproval_paused` | Suscripción → `PAST_DUE` y activa grace |
| `preapproval_cancelled` | Suscripción → `CANCELLED` |

### 8.3 Reintentos automáticos
- Job `capture_retry_worker` procesa Ordenes `FAILED` por error temporal con reintentos exponenciales (1m, 5m, 30m, 3h, 24h).
- Job `refund_retry_worker` para reembolsos pendientes.

## 9. Auditoría y facturación
- Registrar `party_id` (jugador, cancha, admin), `order_id`, `payment_id`, `seller_user_id` en `audit_logs`.
- Hooks para contabilidad: `POST /internal/facturacion` con `base_imponible`, `fee`, `iva`.

## 10. Parametrizaciones clave
- `fee_percent` por plan (tabla).
- `fee_refund_window_hours`.
- `grace_period_days` (default 7).
- `capture_retry_attempts`.
- `min_players` por partido.
- `authorization_hold_hours`.

## 11. Casos de prueba automatizados
1. **Flujo feliz**: crear partido, autorizar múltiples cupos, alcanzar mínimo, capturar todos, validar split según plan.
2. **No alcanza mínimo**: expira deadline, liberar autorizaciones (`RELEASED`).
3. **Fallo de captura**: simular error, reintentos y fallback a liberación.
4. **Cancelación cancha**: antes (`RELEASED`) y después (`REFUND_PENDING` → `REFUNDED`).
5. **Cambio de plan**: upgrade/downgrade y verificación de `fee_percent` en partidos nuevos.
6. **Suscripción**: cobro exitoso, cobro fallido y downgrade automático tras grace.
7. **Desconexión de cuenta**: intentar publicar/confirmar partido → `403`.

## 12. Interfaz de usuario
- **Cancha**: sección "Pagos y Plan" con botones conectar/desconectar, estado OAuth, resumen por partido, selector de plan, próximas suscripciones, configuración de reembolsos.
- **Jugador**: historial de pagos con estados (`AUTORIZADO`, `CAPTURADO`, `LIBERADO`, `REEMBOLSADO`), opción de actualizar tarjeta.
- **Admin**: panel con cuenta recaudadora, métricas de comisiones por partido, ingresos por planes, controles de reintentos y reembolsos.

## 13. Seguridad
- Tokens cifrados en repositorio seguro.
- Uso de `idempotency-key` en `POST /payments`, `POST /capture`, `POST /refunds`.
- Rate limiting en webhooks.
- Logs auditables exportables.

## 14. Roadmap
- Migrar a capturas parciales para cupos parcialmente confirmados.
- Implementar settlement automático con payouts diarios.
- Integrar notificaciones push en app móvil.

