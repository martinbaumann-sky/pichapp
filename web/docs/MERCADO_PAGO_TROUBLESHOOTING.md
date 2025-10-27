# Solución de Problemas - Mercado Pago

## Problema: Las canchas no pueden recibir pagos

### Diagnóstico Rápido

1. **Verificar Variables de Entorno**
   - Ir a `/admin/mp-diagnostic` (solo administradores)
   - Verificar que todas las variables estén configuradas:
     - `MP_CLIENT_ID`
     - `MP_CLIENT_SECRET`
     - `MP_REDIRECT_URI`
     - `MP_WEBHOOK_URL`
     - `MP_WEBHOOK_SIGNATURE_SECRET`

2. **Verificar Conexión de Cancha**
   - Ir al panel de cancha (`/panel/cancha`)
   - En la sección "Conexión con Mercado Pago"
   - Usar el botón "Probar Conexión" para verificar el estado

### Soluciones Comunes

#### 1. Variables de Entorno Faltantes

**Síntomas:**
- Error: "Mercado Pago no está configurado"
- Error: "MP_REDIRECT_URI no está configurado"

**Solución:**
```bash
# En el archivo .env.local o variables de entorno del servidor
MP_CLIENT_ID="tu_client_id_de_mercadopago"
MP_CLIENT_SECRET="tu_client_secret_de_mercadopago"
MP_REDIRECT_URI="https://tu-dominio.com/api/mp/oauth/callback"
MP_WEBHOOK_URL="https://tu-dominio.com/api/mp/webhook"
MP_WEBHOOK_SIGNATURE_SECRET="tu_webhook_secret"
```

#### 2. URL de Redirección No Registrada

**Síntomas:**
- Error: "redirect_uri_mismatch"
- La conexión OAuth falla inmediatamente

**Solución:**
1. Ir al [Dashboard de Mercado Pago](https://www.mercadopago.com.ar/developers)
2. En "Aplicaciones" → Tu aplicación
3. Agregar la URL exacta en "URLs de redirección":
   ```
   https://tu-dominio.com/api/mp/oauth/callback
   ```

#### 3. Tokens Expirados

**Síntomas:**
- Error: "El token de Mercado Pago expiró"
- Los pagos no se procesan

**Solución:**
1. Ir al panel de cancha
2. Desconectar Mercado Pago
3. Volver a conectar la cuenta

#### 4. Webhook No Configurado

**Síntomas:**
- Los pagos se procesan pero no se confirman automáticamente
- Los cupos quedan en estado "pendiente"

**Solución:**
1. En el Dashboard de Mercado Pago
2. Configurar webhook con URL:
   ```
   https://tu-dominio.com/api/mp/webhook
   ```
3. Configurar eventos: `payment`, `merchant_order`

### Verificación Paso a Paso

#### Para Administradores:

1. **Verificar Configuración Global**
   ```bash
   curl -X GET https://tu-dominio.com/api/admin/mp-diagnostic
   ```

2. **Revisar Logs del Servidor**
   - Buscar errores relacionados con Mercado Pago
   - Verificar que las variables estén cargadas

#### Para Canchas:

1. **Probar Conexión**
   - Panel de cancha → "Probar Conexión"
   - Debe mostrar "Conexión exitosa"

2. **Verificar Checklist**
   - ✅ Cuenta autorizada
   - ✅ Collector ID sincronizado
   - ✅ Tipo de cuenta detectado
   - ✅ Correo de liquidación
   - ✅ Titular y RUT configurados

### Configuración en Mercado Pago

#### 1. Crear Aplicación
1. Ir a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Crear nueva aplicación
3. Copiar `Client ID` y `Client Secret`

#### 2. Configurar URLs
- **URL de redirección:** `https://tu-dominio.com/api/mp/oauth/callback`
- **Webhook URL:** `https://tu-dominio.com/api/mp/webhook`

#### 3. Configurar Webhook
- Eventos: `payment`, `merchant_order`
- Método: `POST`
- Autenticación: Usar `MP_WEBHOOK_SIGNATURE_SECRET`

### Monitoreo

#### Métricas Importantes:
- Canchas con conexión activa
- Tokens válidos vs expirados
- Errores de webhook
- Tiempo de respuesta de API

#### Alertas Recomendadas:
- Tokens próximos a expirar (7 días)
- Errores de webhook repetidos
- Canchas sin conexión por más de 24h

### Contacto de Soporte

Si el problema persiste:
1. Revisar logs del servidor
2. Verificar configuración en Mercado Pago
3. Contactar soporte técnico con:
   - Logs de error
   - ID de cancha afectada
   - Timestamp del problema

