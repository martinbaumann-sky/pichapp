# Plan de implementación del sistema de pagos en PichangApp

## 1. Alcance general
- Cobro de cupos a jugadores mediante checkout de Mercado Pago con captura diferida.
- Distribución automática de comisiones según plan de la cancha (Gratis, Avanzado, Pro).
- Vinculación OAuth de cuentas de canchas y cuenta global de PichangApp.
- Cobro recurrente de planes de suscripción de canchas vía Preapproval.
- Automatización de confirmaciones, cancelaciones y reembolsos vía webhooks.

## 2. Preparativos y configuraciones
1. **Credenciales y entornos**
   - Confirmar disponibilidad de `MP_ACCESS_TOKEN` (plataforma) y credenciales OAuth (app Mercado Pago) para entornos sandbox y producción.
   - Configurar URLs de redirección OAuth y webhook en el dashboard de Mercado Pago.
2. **Seguridad**
   - Almacenar tokens cifrados (KMS/Secrets Manager) y definir rotación de `refresh_token`.
   - Implementar verificación de firma `x-signature` en webhooks.
3. **Backoffice**
   - Habilitar en el panel Admin la sección para registrar la cuenta recaudadora (tokens de PichangApp) y monitorear eventos de pagos.

## 3. Cambios en la base de datos
1. **Canchas (`venues`)**
   - Campos: `mp_seller_user_id`, `mp_access_token`, `mp_refresh_token`, `mp_scope`, `mp_token_expires_at`, `mp_connection_status` (`pending`, `active`, `revoked`).
2. **Partidos y cupos**
   - Tabla `match_slots` u `ordenes_cupo` con estados: `HELD`, `AUTHORIZED`, `CAPTURED`, `RELEASED`, `REFUND_PENDING`, `REFUNDED`, `FAILED`.
   - Campos adicionales: `payment_id`, `authorization_expires_at`, `capture_attempts`, `refund_attempts`, `metadata_plan`, `metadata_fee_percent`.
3. **Pagos**
   - Tabla `payments_logs` para auditoría de eventos de Mercado Pago (`event_id`, `type`, `payload`).
4. **Planes y suscripciones**
   - Tabla `venue_plans` con `plan`, `fee_percent`, `price_amount`.
   - Tabla `venue_subscriptions` con `preapproval_id`, `status`, `last_charge_at`, `next_charge_at`, `cancelled_at`.

## 4. Flujos funcionales
### 4.1 Conexión de cuentas de canchas
1. Botón “Conectar Mercado Pago” en panel de cancha llama a `POST /api/venues/{id}/mercadopago/oauth/url`.
2. Redirigir al flujo OAuth; callback procesa `code` → almacena tokens y marca `mp_connection_status=active`.
3. Permitir desconexión (`DELETE /api/venues/{id}/mercadopago/connection`).
4. Validar `mp_connection_status=active` antes de publicar partido con cobro.

### 4.2 Reserva de cupos con autorización diferida
1. Jugador reserva (`POST /api/matches/{match_id}/slots`).
2. Backend crea orden `HELD`, prepara `idempotency-key` y valida plan de la cancha para calcular `application_fee_amount`.
3. Crear preferencia/pago en Mercado Pago con `capture=false`, `binary_mode=true`, credenciales OAuth de la cancha, `application_fee_amount= monto * fee_percent` y metadatos (match, venue, player, plan).
4. Redirigir al `init_point` para checkout.
5. Webhook `payment_authorized`/`payment_in_process` marca orden `AUTHORIZED`; rechazos → `FAILED` + notificación.
6. Programar job para expiración (`authorization_expires_at`).

### 4.3 Confirmación de partido y captura
1. Cuando `confirmed_players >= min_players`, transacción atómica recorre órdenes `AUTHORIZED`.
2. Ejecutar `POST /v1/payments/{payment_id}/capture` (con `idempotency-key` propio).
3. Si `status=approved`, marcar `CAPTURED`, guardar `captured_at` y notificar jugador/cancha.
4. Reintentos con backoff para errores transitorios (`capture_attempts`).

### 4.4 Cancelación o no armado del partido
1. Si expira el plazo sin mínimos, job cambia estado del partido a `FAILED`.
2. Por cada orden `AUTHORIZED`, invocar `POST /v1/payments/{payment_id}` con body `status='cancelled'` → estado `RELEASED`.
3. Si el partido estaba confirmado y luego se cancela, ejecutar `POST /v1/payments/{payment_id}/refunds` total o parcial.
4. Actualizar estados a `REFUND_PENDING` hasta recibir webhook `payment_refunded` (→ `REFUNDED`).
5. Reembolsar comisión (`application_fee_refund`) si política aplica.

### 4.5 Retiro voluntario del jugador
- Antes de confirmación → cancelar pago (`status='cancelled'`).
- Después de confirmación → reembolso parcial según política de la cancha (`refund_percent`).

## 5. Distribución de comisiones
1. Obtener plan de la cancha (`venue.plan`).
2. Determinar porcentaje (14%, 7% o 2%) y calcular `application_fee_amount`.
3. Al crear el pago, incluir `application_fee_amount` y `collector_id` de la cancha.
4. Confirmar vía webhooks que la plataforma recibe la comisión (registrar `application_fee_id`).
5. Panel Admin muestra resumen de comisiones por cancha y total.

## 6. Cobro de planes por suscripción
1. Panel de cancha lista planes y precio.
2. Seleccionar plan Avanzado/Pro → backend crea Preapproval (`POST /preapproval`) con `auto_recurring.frequency=1`, `frequency_type=months`, `transaction_amount=precio_plan`, `reason` descriptiva.
3. Redirigir al `init_point` de preapproval.
4. Webhook `preapproval.authorized` marca suscripción `ACTIVE`, actualiza `venue.plan` y `next_charge_at`.
5. Webhook mensual `preapproval.credited` actualiza `last_charge_at`.
6. Eventos `preapproval.paused/cancelled/expired` → actualizar estado y degradar plan a Gratis si no hay otra suscripción activa.
7. Permitir cancelación manual desde panel (`DELETE /api/venues/{id}/subscriptions/{preapproval_id}`).

## 7. Webhooks unificados
1. Endpoint `POST /api/mercadopago/webhooks`.
2. Procesar tipos `payment`, `merchant_order`, `preapproval`.
3. Guardar `event_id` en `payments_logs` para idempotencia.
4. Distribuir procesamiento a workers específicos:
   - `payment_worker` (autorizar, capturar, refund).
   - `subscription_worker` (activación, cobros, cancelaciones).
5. Responder `200 OK` solo tras persistir cambios.

## 8. Jobs y automatizaciones
- `match_confirmation_worker`: verifica partidos publicados y confirma/cancela según mínimos.
- `authorization_expiration_worker`: libera autorizaciones próximas a vencer.
- `capture_retry_worker` y `refund_retry_worker` con backoff exponencial.
- `subscription_grace_worker`: maneja suscripciones en `PAST_DUE` y baja plan tras periodo de gracia.

## 9. Interfaces de usuario
1. **Panel Cancha**
   - Estado de conexión Mercado Pago y botón conectar/desconectar.
   - Lista de partidos con montos brutos, comisión y neto.
   - Historial de pagos y reembolsos por jugador.
   - Gestión de plan actual, suscripción activa y posibilidad de cancelar.
2. **Jugador**
   - Historial de cupos con estados (`Pendiente`, `Confirmado`, `Reembolsado`).
   - Notificaciones y correos al confirmar partido o al emitir reembolso.
3. **Admin PichangApp**
   - Dashboard con total de comisiones, ingresos por planes y estado de conexiones de canchas.
   - Alertas de suscripciones fallidas, chargebacks y reintentos pendientes.

## 10. Comunicaciones y notificaciones
- Emails transaccionales / push:
  - Reserva recibida (pago pendiente).
  - Partido confirmado (pago capturado).
  - Partido cancelado / reembolso emitido.
  - Suscripción activada, cobro exitoso, cobro fallido, suscripción cancelada.
- Registrar plantillas en servicio de notificaciones existente.

## 11. Pruebas y despliegue
1. **Pruebas unitarias/integración**
   - Mock de SDK Mercado Pago para flujos de autorización, captura y refund.
   - Tests de webhooks verificando transiciones de estado.
2. **Sandbox end-to-end**
   - Escenarios: partido confirmado, partido no armado, cancelación posterior, cambio de plan, fallo de cobro recurrente.
3. **Checklist de producción**
   - Variables de entorno configuradas (tokens, URLs, secrets).
   - Webhook registrado y accesible desde Mercado Pago.
   - Job schedulers habilitados.
   - Monitoreo y alertas (logs, métricas de errores).

## 12. Roadmap posterior
- Soporte para capturas parciales por cupo.
- Liquidaciones programadas hacia cuentas bancarias.
- Conciliación automática con ERP / contabilidad externa.
- Notificaciones push en aplicaciones móviles.

