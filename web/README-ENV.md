# Cómo organizar las variables de entorno

Este proyecto usa variables de entorno para claves de terceros (Supabase, Twilio, Textbelt, Resend, etc.). Sigue estas indicaciones.

1) Archivo local (no subir a git)
- Crea `web/.env.local` (o en la raíz `.env.local`) y añade todas las variables secretas.
- Ejemplo mínimo:

```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...TU_SERVICE_ROLE_KEY...
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
TEXTBELT_KEY=textbelt
# Opcionales:
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
RESEND_API_KEY=
```

2) No subir secretos a GitHub
- Asegúrate que `.gitignore` contiene entradas para `.env*` (ya añadido).

3) Variables en producción
- Configura estas variables en tu proveedor de hosting (Vercel, Fly, Railway, etc.) usando su panel de secretos.

4) Comprobar variables usadas en el código
- Revisa `web/src` para ver qué variables son necesarias (`process.env.*`).

5) Rotación y seguridad
- Cambia las claves si crees que se filtraron. No uses la misma clave para desarrollo y producción.






















