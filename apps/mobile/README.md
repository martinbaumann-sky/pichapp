# PichangApp Mobile

Aplicación móvil desarrollada con [Expo](https://expo.dev/) y [Expo Router](https://expo.github.io/router/) que replica las funcionalidades principales de la versión web de PichangApp para iOS, Android y web (PWA).

## Características

- **Navegación nativa** con pestañas diferenciadas para Inicio, Exploración de partidos, Organización y Panel del jugador.
- **Integración con la API existente** (`/api/*`) reutilizando la misma base de datos y reglas de negocio que la versión web.
- **Autenticación con sesión compartida**: se reutiliza el flujo de login por email/contraseña y se almacena la cookie de sesión de Next.js en `SecureStore` para todas las solicitudes posteriores.
- **Explorador de partidos** con filtros por comuna y nivel, además de detalle completo de cada partido y reserva directa.
- **Organización de partidos** validando reglas de negocio y publicando directamente en la base actual.
- **Dashboard personalizado** que sincroniza los datos del usuario y sugiere próximos encuentros.

## Requisitos previos

- Node.js 18 o superior.
- NPM 9+
- [Expo CLI](https://docs.expo.dev/get-started/installation/#expo-cli) (opcional, `npx expo` también funciona).
- Tener la API web corriendo localmente (`npm run dev --workspace web`) o un entorno remoto accesible.

## Variables de entorno

La app utiliza la variable `EXPO_PUBLIC_API_BASE_URL` para conectarse a la API.

Opciones:

1) Crear `apps/mobile/.env` a partir de `apps/mobile/.env.example` (recomendado):

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

2) O exportar la variable antes de correr Expo:

```bash
export EXPO_PUBLIC_API_BASE_URL="http://localhost:3000"
```

En producción apunta a la URL pública desplegada (por ejemplo, la de Vercel).

## Scripts disponibles

En la raíz del repo, instala las dependencias (incluye web y mobile):

```bash
npm install
```

Comandos específicos del workspace `mobile`:

```bash
# Levanta Expo Go / Dev Client
npm run start --workspace mobile

# Compila para Android/iOS (build nativa)
npm run android --workspace mobile
npm run ios --workspace mobile

# Ejecuta la versión web (PWA)
npm run web --workspace mobile
```

> **Nota:** la pestaña "Organizar" requiere una cuenta con permisos de cancha verificada (como en la web) para publicar partidos pagados.

## Diferencias entre plataformas

- **iOS / Android:** navegación con pestañas inferiores, formularios adaptados a touch, bloqueo de orientación vertical y componentes nativos (DateTimePicker, Alertas).
- **Web (Expo Router):** conserva la estética móvil pero aprovecha la navegación tipo SPA, permitiendo probar la app sin emulador.

## Estructura

```
apps/mobile/
├── app/           # Rutas de Expo Router (tabs y pantallas)
├── assets/        # Iconos y recursos de Expo
├── src/
│   ├── api/       # Cliente HTTP y módulos de autenticación/matches
│   ├── components # UI reutilizable (botones, tarjetas, etc.)
│   ├── hooks/     # Hooks para sesión y queries
│   └── theme/     # Colores y estilos base
└── ...
```

## Testing manual

1. Levanta la API web (`npm run dev --workspace web`).
2. En otra terminal: `npm run start --workspace mobile`.
3. Escanea el QR con Expo Go o abre la versión web (`w` en la terminal de Expo).
4. Inicia sesión con una cuenta existente y verifica que los partidos publicados desde la web se reflejen en la app.
