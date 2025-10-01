# Diseño de pagos y liquidaciones con Mercado Pago

## Entidades y metadatos
- **Jugador** (`jugador_id`): usuario que paga un cupo.
- **Cancha** (`cancha_id`): publica partidos y recibe cobros en su cuenta de Mercado Pago.
- **Partido** (`partido_id`): evento con cupos, precio y reglas.
- **Reserva** (`reserva_id`): relación Jugador-Partido. Incluye `estado_reserva` (`pendiente`, `confirmada`, `cancelada`, `devuelta`).
- **Pago** (`payment_id` de Mercado Pago): operación principal. Metadatos obligatorios enviados desde el checkout: `partido_id`, `cancha_id`, `jugador_id`, `origen=PichangApp`, `fee_plataforma=10`, `reserva_id`.
- **Devolución** (`refund_id` de Mercado Pago): referencia a reembolsos totales o parciales.
- **Liquidación** (`liquidacion_id`): resumen mensual por cancha. Estados: `pendiente`, `pagada`, `vencida`, `en_disputa`.

## Endpoints principales
1. `POST /api/canchas/{cancha_id}/partidos`
   - Crea partido con cupos, precio, hora límite, reglas de cancelación. Valida que la cancha tenga cuenta de Mercado Pago conectada.
   - Respuestas de error: `422` datos incompletos, `409` horario en conflicto, `403` cuenta sin autorización de cobro.

2. `POST /api/partidos/{partido_id}/reservas`
   - Crea reserva pendiente y genera preferencia de pago de Mercado Pago (checkout canjeado con credenciales de la cancha).
   - Devuelve URL de checkout y expira según configuración del partido.
   - Errores: `409` cupos completos, `403` jugador bloqueado, `422` datos inválidos.

3. `POST /api/mercadopago/webhooks`
   - Recibe notificaciones de Mercado Pago. Autentica `X-Signature`. Procesa eventos `payment.created`, `payment.updated`, `refund.created`.
   - Actualiza registros internos según estados (`approved`, `pending`, `rejected`, `cancelled`, `refunded`, `chargeback`).
   - Responde `200` siempre que se registre la notificación. Errores por firma inválida (`401`).

4. `POST /api/partidos/{partido_id}/reservas/{reserva_id}/cancelar`
   - Accionada por jugador o cancha. Aplica política configurada. Genera devolución cuando corresponde.
   - Errores: `403` política no permite devolución, `409` partido ya jugado, `404` reserva inexistente.

5. `POST /api/devoluciones`
   - Servicio interno para orquestar reembolsos automáticos (partido no armado o cancelación). Requiere `payment_id`, motivo, monto. Usa API de Mercado Pago de la cancha.
   - Errores: `400` monto inválido, `409` pago ya devuelto, `424` error de Mercado Pago (registrar detalle).

6. `GET /api/canchas/{cancha_id}/ventas`
   - Devuelve partidos, pagos, devoluciones y estados para panel de cancha. Permite filtros por fecha, estado de partido, estado de pago.

7. `GET /api/admin/liquidaciones`
   - Lista liquidaciones por cancha, estado y periodo. Incluye indicadores de deuda y disputas.

8. `POST /api/liquidaciones/{liquidacion_id}/cobrar`
   - Inicia cobro según modo elegido: genera cargo de débito automático o link de pago. Marca timestamps (`fecha_emision`, `fecha_vencimiento`, `fecha_pago`).

9. `POST /api/liquidaciones/{liquidacion_id}/recordatorios`
   - Endpoint interno usado por cron para enviar correos/push de recordatorio. Controla duplicados con `ultima_notificacion_at`.

10. `POST /api/liquidaciones/{liquidacion_id}/bloqueos`
    - Aplica o levanta bloqueo suave (`bloqueo_publicacion` flag en la cancha) según liquidaciones vencidas.

## Estados internos clave
- **Reserva**: `pendiente` (creada), `pagada` (pago aprobado), `liberada` (checkout vencido o rechazado), `devuelta` (refund total), `parcialmente_devuelta`.
- **Partido**: `publicado`, `confirmado` (mínimo de jugadores alcanzado), `no_armado`, `cancelado_cancha`, `jugado`.
- **Pago**: replicar estados de Mercado Pago con timestamps propios (`registrado_at`, `aprobado_at`, `devuelto_at`, `chargeback_at`).
- **Liquidación**: `pendiente`, `vencida`, `pagada`, `ajustada` (si hubo contra-cargo post cierre), `en_disputa`.

## Flujo operativo
1. **Publicación**: cancha crea partido con datos y políticas. Sistema valida ventana de ventas y vinculación de Mercado Pago.
2. **Reserva y checkout**: jugador inicia reserva. API crea `reserva_id`, prepara preferencia Mercado Pago con metadatos y expira en 15 minutos o al alcanzar hora límite.
3. **Pago aprobado**: webhook `payment.updated` con `approved` marca reserva como `pagada`, disminuye cupos, habilita chat y envía confirmación al jugador.
4. **Pago pendiente o rechazado**: reserva permanece `pendiente` hasta expiración. Cron cada 5 minutos revisa reservas expiradas y las libera. Notifica al jugador.
5. **Monitoreo de armada**: job cada 10 minutos evalúa partidos cercanos a la hora límite. Si no se alcanza mínimo, programa devolución masiva.
6. **Devoluciones**:
   - Partido no armado o cancelado por cancha: `POST /api/devoluciones` por cada pago, registra `refund_id`, cambia reserva a `devuelta`, notifica jugador.
   - Cancelación jugador: ejecuta devolución según política (total o parcial) y actualiza `monto_devuelto`. Reservas quedan `parcialmente_devuelta` si corresponde.
7. **Conciliación**: diariamente, proceso concilia todos los `payment_id` aprobados vs. base interna. Ajusta estados ante `chargeback` o `refunded` recibidos.
8. **Post-partido**: al marcar partido como `jugado`, se habilita envío de resumen y enlace de evaluación.

## Liquidaciones y comisiones
1. **Base de cálculo**: job mensual (cron `0 3 1 * *`) agrupa partidos jugados el mes anterior por cancha. Solo considera pagos `approved` sin `refund_id` asociado ni `chargeback` confirmado.
2. **Resumen**: genera `liquidacion_id` por cancha con los campos:
   - `total_bruto` (sumatoria montos aprobados),
   - `comision_mp` (datos de webhook),
   - `devoluciones` (monto total devuelto),
   - `ventas_net` = `total_bruto - devoluciones`,
   - `base_comision` (excluye pagos en disputa),
   - `comision_pichapp` = `base_comision * 0.10`,
   - `total_a_pagar` = `comision_pichapp`.
   Guarda PDF/CSV en storage y expone link en panel.
3. **Cobro automático**:
   - **Débito automático**: genera autorización recurrente con Mercado Pago. Cron mensual llama `POST /api/liquidaciones/{id}/cobrar` para ejecutar cargo y marcar `pagada` al confirmarse.
   - **Transferencia asistida**: genera link de pago/CBU y marca liquidación `pendiente`. Recordatorios: 3 días antes de vencimiento (`0 9 28 * *`), día de vencimiento (`0 9 5 * *` sobre el mes en curso), y 3 días después (`0 9 8 * *`).
4. **Seguimiento**: si vencida >7 días, aplicar `bloqueo_publicacion=true` para impedir nuevos partidos hasta regularización.

## Orquestación de notificaciones de Mercado Pago
- Consumir webhooks en tiempo real y almacenar histórico.
- Retries idempotentes usando `payment_id` como llave.
- Estados a manejar:
  - `approved`: confirmar reserva y contabilizar para liquidación.
  - `pending`/`in_process`: mantener reserva pendiente; cron limpia si expira.
  - `rejected`/`cancelled`: liberar cupo y enviar correo.
  - `refunded`: registrar `refund_id`, excluir de base y notificar.
  - `charged_back`: mover pago a `en_disputa`, descontar de base del mes del partido y reemitir liquidación ajustada.
- Si Mercado Pago falla al devolver, registrar `error_code`, programar reintento y avisar manualmente.

## Validaciones y mensajes de error
- **Checkout sin metadatos**: rechazar preferencia (`422`) indicando "Faltan metadatos requeridos".
- **Cuenta de Mercado Pago desconectada**: bloquear publicación con mensaje "Conecta Mercado Pago para habilitar cobros".
- **Pago sin webhook**: conciliación diaria marca como `pendiente` y alerta interna "Revisar transacción manualmente".
- **Devolución tardía**: si excede ventana de política, error `403` "La ventana de devolución ha expirado".
- **Liquidación pagada parcialmente**: si el cargo de débito falla, estado `en_disputa` y mensaje "No se pudo procesar el débito automático; actualiza el método de pago".

## Mensajería automática
- Confirmación de cupo (`approved`).
- Avisos de cambios de estado del partido (confirmado, no armado, cancelado).
- Notificaciones de devolución con montos y plazos estimados.
- Resumen post-partido con link a evaluación.
- Recordatorios de liquidación (emisión, previo vencimiento, vencimiento, atraso).

## Seguridad y cumplimiento
- Mostrar términos y política de reembolsos antes de cada checkout y registrar `consentimiento_at` por reserva.
- No almacenar tarjetas. Usar tokenización nativa de Mercado Pago.
- Registrar todos los eventos con timestamp, usuario ejecutor y payload recibido para auditoría.
- Aislar credenciales de Mercado Pago por cancha; PichangApp solo accede mediante tokens otorgados por la cancha.

## Roadmap futuro
- Habilitar split de pagos para retener el 10% al instante cuando la cancha autorice.
- Evaluar retención automática para reducir riesgo de cobranza.
- Generar reportes fiscales descargables (IVA, retenciones) con datos de pagos confirmados.
