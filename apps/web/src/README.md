# Autenticación (Supabase)

Flujo estándar habilitado:

- Sign in: usa email + password con `signInWithPassword`. No hace fallback a signUp. Si el usuario no existe o la clave es incorrecta, se muestra error y no ingresa.
- Sign up: usa `signUp({ email, password, options: { data: { name, comuna, position }}})`. Tras crear el usuario, se inicializa `Profile` vía `POST /api/profile/init`. Si la confirmación de email está activa en Supabase, no habrá sesión al terminar el sign up y se muestra el mensaje “Revisa tu correo”.
- Nunca se usa OTP/magic link en el flujo por defecto.

UI:

- `AuthDialog` con tabs “Iniciar sesión” / “Crear cuenta”, centrado, con `max-h` y overflow. Campo para mostrar/ocultar contraseña. Errores visibles.
- `Header` muestra ícono de perfil. Si no hay sesión, abre `AuthModal`. Si hay sesión, se pueden añadir opciones (Dashboard, Perfil, Cerrar sesión) en el futuro.
- La opción “Organizar” solo aparece si hay sesión.

Rutas protegidas:

- `/organizar` es Server Component y usa `getServerSession()`. Si no hay sesión: `redirect('/auth/sign-in?next=/organizar')`.

API endpoints:

- Usan `requireUserId()` que lee la sesión del servidor con Supabase. No se aceptan `userId` en el body. Responden 401 si no hay sesión.

Variables de entorno:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` habilitado para Places, Place Photos y Street View Static.

Imágenes automáticas:

- `lib/places.ts` implementa `searchPlace`, `placePhotoUrl` y `streetViewUrl`.
- `/api/geocode` usa Google Places Text Search y retorna `{label,address,lat,lng,place_id,photoUrl}`.
- Al crear partido, si hay `photoUrl` se guarda como `coverImageUrl`; fallback a Street View y luego a Static Map.

Configuración Supabase:

- Habilitar Email + Password. Mantener deshabilitado el uso de OTP/magic link para el flujo UI.
- Si se desea confirmación por email: activar “Confirm email” en Auth → Providers → Email en Supabase. Con confirmación ON, el sign up no genera sesión inmediata, se exige verificar correo antes de acceder.


