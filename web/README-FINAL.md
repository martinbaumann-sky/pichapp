## Reset & Seed

Para limpiar datos y cargar pichangas de ejemplo coherentes con los nuevos campos:

```bash
npm run seed:reset
```

Esto borra pagos, lista de espera, spots y partidos; mantiene usuarios/perfiles. Crea un usuario organizador `organizer@demo.cl` y ~12 partidos con lugar, comuna y foto automática.

# 🏈 PichApp - Plataforma de Partidos de Fútbol

## ✅ **FUNCIONALIDADES IMPLEMENTADAS**

### 🔐 **Autenticación Local**
- ✅ Crear cuenta con email + contraseña
- ✅ Iniciar sesión
- ✅ Campo comuna como dropdown (todas las comunas de Santiago)
- ✅ Campo posición como dropdown (Arquero, Defensa, Lateral, Volante, Delantero)
- ✅ Toast de éxito/error que desaparece automáticamente
- ✅ Sesiones persistentes con cookies

### 🏠 **Landing Page**
- ✅ CTA "Organizar partido" que abre modal de login si no hay sesión
- ✅ Redirección automática después del login

### 🔍 **Explorar Partidos**
- ✅ Lista de partidos con filtros
- ✅ Filtros por comuna, nivel, fecha, precio
- ✅ Paginación
- ✅ **IMÁGENES AUTOMÁTICAS** de Google Street View
- ✅ Estados vacíos con CTAs

### 🎯 **Organizar Partido**
- ✅ Ruta protegida (requiere sesión)
- ✅ Formulario completo con validaciones
- ✅ Autocompletado de direcciones con Google Places
- ✅ Generación automática de imágenes del lugar
- ✅ DateTimePicker funcional

### 💳 **Tomar Cupo**
- ✅ Requiere sesión (abre modal de login si no hay)
- ✅ Integración con Mercado Pago (preparado)
- ✅ Manejo de estados de pago

## 🚀 **CONFIGURACIÓN RÁPIDA**

### 1. **Instalar dependencias**
```bash
npm install
```

### 2. **Configurar base de datos**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 3. **Configurar imágenes de Google Maps**
```bash
# Copiar archivo de ejemplo
copy env-example.txt .env

# Editar .env y agregar tu API key de Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="tu-api-key-aqui"
```

### 4. **Obtener API Key de Google Maps**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Ve a "APIs y servicios" > "Credenciales"
4. Crea una nueva API key
5. Habilita estas APIs:
   - Places API
   - Street View Static API
   - Maps Static API
6. Restringe la key a estas APIs para seguridad

### 5. **Iniciar servidor**
```bash
npm run dev
```

## 🎯 **URLS IMPORTANTES**

- **Home**: http://localhost:3000
- **Explorar**: http://localhost:3000/explorar
- **Organizar**: http://localhost:3000/organizar (requiere login)
- **Crear cuenta**: Modal automático al hacer clic en "Organizar"

## 🖼️ **SISTEMA DE IMÁGENES**

### **Cómo funciona:**
1. Al crear un partido, se guarda la dirección y coordenadas
2. El sistema genera automáticamente una imagen de Google Street View
3. Si no hay Street View disponible, usa una imagen estática del mapa
4. Las imágenes se muestran en `/explorar` y en los detalles del partido

### **Configuración:**
- Las imágenes se generan usando la API key de Google Maps
- Sin API key, las imágenes no se generan (se muestra placeholder)
- Las imágenes se generan en tiempo real, no se almacenan

## 🔧 **SCRIPTS ÚTILES**

```bash
# Configurar base de datos
npm run setup-db

# Verificar endpoints
node test-endpoints.js

# Verificar imágenes
node test-images.js

# Verificar bucles infinitos
node test-loops.js
```

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **Imágenes no aparecen:**
1. Verifica que tengas la API key de Google Maps en `.env`
2. Asegúrate de que las APIs estén habilitadas
3. Revisa la consola del navegador para errores

### **Error de autenticación:**
1. Verifica que la base de datos esté configurada
2. Ejecuta `npm run prisma:migrate` si es necesario

### **Toast no desaparece:**
- ✅ **SOLUCIONADO**: Los toasts ahora desaparecen automáticamente después de 3 segundos

## 📱 **FUNCIONALIDADES COMPLETAS**

- ✅ **Autenticación completa** (crear cuenta, login, logout)
- ✅ **Protección de rutas** (organizar requiere sesión)
- ✅ **Formularios funcionales** (crear partido, registro)
- ✅ **Filtros de búsqueda** (comuna, nivel, fecha, precio)
- ✅ **Imágenes automáticas** (Google Street View)
- ✅ **Responsive design** (móvil y desktop)
- ✅ **Manejo de errores** (toasts, validaciones)
- ✅ **Base de datos SQLite** (local, sin dependencias externas)

## 🎉 **¡LISTO PARA USAR!**

La aplicación está completamente funcional. Solo necesitas:
1. Configurar la API key de Google Maps para las imágenes
2. Opcionalmente, configurar Mercado Pago para pagos

¡Disfruta organizando y jugando partidos! ⚽
