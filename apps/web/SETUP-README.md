# 🚀 CONFIGURACIÓN RÁPIDA PICHANGAPP

## ❌ PROBLEMA ACTUAL
- **Base de datos no conecta**: `Can't reach database server at 'localhost:5432'`
- **No puedes crear cuentas** ni iniciar sesión
- **No ves fotos de partidos** porque no hay datos

## ✅ SOLUCIÓN PASO A PASO

### 1. INSTALAR POSTGRESQL
```bash
# Opción A: Descargar e instalar
# https://www.postgresql.org/download/windows/

# Opción B: Docker (más fácil)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 2. CONFIGURAR VARIABLES DE ENTORNO
Crea un archivo `.env` en la carpeta `apps/web/` con:

```env
# SUPABASE (OBLIGATORIO)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# BASE DE DATOS (OBLIGATORIO)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pichanga_db"

# BASE URL (OBLIGATORIO)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# MERCADO PAGO (OPCIONAL)
MP_ACCESS_TOKEN=tu-mp-token

# GOOGLE MAPS (OPCIONAL)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu-google-key

# ADMIN (OPCIONAL)
ADMIN_EMAIL=contacto.pichapp@gmail.com
ADMIN_PASSWORD=Babolat3008
```

### 3. CONFIGURAR SUPABASE
1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto nuevo
3. En **Settings > API** copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
4. En **Authentication > Settings**:
   - Habilita "Email + Password"
   - Deshabilita "Confirm email" (para testing)

### 4. EJECUTAR CONFIGURACIÓN
```bash
cd web
# Opción A: Script automático
setup-db.bat

# Opción B: Manual
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 5. VERIFICAR CONEXIÓN
```bash
npm run dev
```
- Abre http://localhost:3000
- Ve a **Explorar** → debe mostrar partidos
- Haz click en **Organizar partido** → debe abrir modal de login
- Crea una cuenta → debe funcionar

## 🔍 DEPURACIÓN

### Si sigue sin funcionar:
1. **Verifica PostgreSQL**:
   ```bash
   # Debe mostrar "Running"
   Get-Service -Name "*postgres*"
   ```

2. **Verifica variables de entorno**:
   - Abre el modal de login
   - Mira la consola del navegador
   - Debe mostrar logs `[AUTH] env URL:` y `[AUTH] env ANON:`

3. **Verifica base de datos**:
   ```bash
   psql -U postgres -d pichanga_db -c "SELECT * FROM \"User\" LIMIT 1;"
   ```

### Errores comunes:
- **"Can't reach database"**: PostgreSQL no está corriendo
- **"Invalid API key"**: Variables de Supabase incorrectas
- **"Table doesn't exist"**: No se ejecutaron las migraciones

## 📱 FUNCIONALIDADES QUE DEBEN FUNCIONAR
- ✅ Landing page con CTA "Organizar partido"
- ✅ Modal de login/registro se abre
- ✅ Crear cuenta funciona y redirige
- ✅ Iniciar sesión funciona y redirige
- ✅ /explorar muestra partidos con fotos
- ✅ /organizar requiere login
- ✅ Tomar cupo requiere login

## 🆘 AYUDA
Si algo no funciona:
1. Ejecuta `setup-db.bat`
2. Verifica que PostgreSQL esté corriendo
3. Revisa la consola del navegador
4. Revisa la consola del servidor (npm run dev)

**¡La app debe funcionar perfectamente después de estos pasos!**
