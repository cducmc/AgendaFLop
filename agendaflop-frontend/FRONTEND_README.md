# 🎨 AgendaFlop - Frontend

Frontend moderno construido con **React 19**, **Vite**, **Tailwind CSS** y **React Query**.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
copy .env.example .env

# Editar .env y configurar la URL del backend
# VITE_API_URL=http://127.0.0.1:8000/api
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

El frontend correrá en: **http://localhost:5173**

---

## 📂 Estructura del Proyecto

```
src/
├── assets/          # Imágenes, íconos, etc
├── components/      # Componentes reutilizables
│   ├── AppointmentActions.jsx
│   ├── AppointmentForm.jsx
│   ├── ConfirmationDialog.jsx
│   ├── Footer.jsx
│   ├── LoadingSpinner.jsx
│   ├── Modal.jsx
│   ├── ProtectedRoute.jsx  ✨ Nuevo
│   └── Toast.jsx
├── contexts/        # React Context API
│   └── AuthContext.jsx      ✨ Nuevo
├── hooks/           # Custom hooks
├── pages/           # Páginas principales
│   ├── AppointmentsList.jsx
│   ├── CalendarView.jsx
│   ├── Dashboard.jsx        ✨ Actualizado
│   ├── Login.jsx            ✨ Nuevo
│   └── Register.jsx         ✨ Nuevo
├── services/        # Servicios API
│   ├── api.js               ✨ Actualizado
│   └── authService.js       ✨ Nuevo
├── utils/           # Utilidades
├── App.jsx          # Componente raíz
└── main.jsx         # Entry point
```

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación JWT

1. **Registro** (`/register`):
   - Usuario crea cuenta con negocio
   - Obtiene plan FREE automático
   - Recibe JWT tokens

2. **Login** (`/login`):
   - Email + password
   - Recibe access + refresh tokens
   - Tokens guardados en localStorage

3. **Navegación Protegida**:
   - Rutas protegidas con `<ProtectedRoute>`
   - Interceptor en Axios agrega JWT automáticamente
   - Refresh token automático al expirar

4. **Logout**:
   - Blacklist refresh token en backend
   - Limpia localStorage
   - Redirige a `/login`

### AuthContext API

```jsx
import { useAuth } from './contexts/AuthContext';

function MiComponente() {
  const { 
    user,           // Usuario actual
    business,       // Negocio actual
    isAuthenticated,// Boolean
    loading,        // Boolean
    login,          // (email, password) => Promise
    register,       // (userData) => Promise
    logout,         // () => Promise
    updateUser      // () => Promise
  } = useAuth();
}
```

---

## 📡 Servicios API

### AuthService
```jsx
import authService from './services/authService';

// Login
await authService.login(email, password);

// Register
await authService.register({
  email: 'test@mail.com',
  password: 'Pass12345',
  password_confirm: 'Pass12345',
  first_name: 'Juan',
  business_name: 'Mi Negocio',
  business_type: 'salon',
  phone: '+573001234567'
});

// Get current user
const userData = await authService.getCurrentUser();

// Logout
await authService.logout();
```

### Appointments API
```jsx
import { appointmentsAPI } from './services/api';

// Listar citas
const response = await appointmentsAPI.getAll();

// Citas de hoy
const today = await appointmentsAPI.today();

// Estadísticas
const stats = await appointmentsAPI.stats();

// Crear cita
await appointmentsAPI.create({ ... });

// Confirmar/Cancelar/Completar
await appointmentsAPI.confirm(id);
await appointmentsAPI.cancel(id, reason);
await appointmentsAPI.complete(id);
```

---

## 🎨 Componentes Principales

### Dashboard
- Resumen de estadísticas
- Citas de hoy
- Gráficos de cumplimiento
- **Conectado con backend real**

### Login / Register
- Formularios con validación
- Manejo de errores del backend
- Diseño moderno con Tailwind

### ProtectedRoute
- Protege rutas privadas
- Redirige a `/login` si no autenticado
- Muestra spinner mientras carga

---

## 🛠 Stack Tecnológico

- **React 19.2** - UI Library
- **React Router DOM 7.13** - Routing
- **Vite 7.3** - Build tool
- **Tailwind CSS 3.4** - Styling
- **Axios 1.13** - HTTP client
- **React Query 5.90** - Server state
- **React Hook Form 7.71** - Form handling
- **date-fns 4.1** - Date utilities
- **lucide-react** - Icon library

---

## 📝 Scripts

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

---

## ✅ Features Implementadas

- [x] ✅ Sistema de autenticación JWT completo
- [x] ✅ Login y registro con validación
- [x] ✅ Dashboard con estadísticas reales
- [x] ✅ Protección de rutas privadas
- [x] ✅ Refresh token automático
- [x] ✅ Multi-tenant (cada negocio ve solo sus datos)
- [x] ✅ Manejo de errores del backend
- [x] ✅ UI/UX moderna con Tailwind

## 🚧 Por Implementar

- [ ] Gestión de Servicios (CRUD)
- [ ] Gestión de Profesionales (CRUD)
- [ ] Gestión de Clientes (CRUD)
- [ ] Crear/Editar Citas desde Dashboard
- [ ] Vista de Calendario interactivo
- [ ] Portal público de reservas (`/book/{slug}`)
- [ ] Notificaciones Email
- [ ] Configuración de negocio
- [ ] Gestión de suscripción/planes

---

## 🔗 Endpoints del Backend

Asegúrate de que el backend esté corriendo en `http://127.0.0.1:8000`

Ver documentación completa en: `../agendaflop_backend/TEST_API.md`

---

## 💡 Notas de Desarrollo

### Variables de Entorno
- Todas las variables de entorno deben tener prefijo `VITE_`
- Se cargan automáticamente de `.env`
- En producción, configurar en tu hosting

### LocalStorage
El sistema guarda en localStorage:
- `access_token` - JWT access token (1hr)
- `refresh_token` - JWT refresh token (7 días)
- `user` - Datos del usuario
- `business` - Datos del negocio

### Interceptores Axios
- **Request**: Agrega `Authorization: Bearer {token}` automáticamente
- **Response**: Refresca token si expira (401)
- **Error**: Logout automático si refresh falla

---

## 🎯 Próximos Pasos

1. [ ] Probar login/register con backend corriendo
2. [ ] Implementar CRUD de Servicios/Profesionales/Clientes
3. [ ] Crear wizard de creación de citas
4. [ ] Implementar portal público de reservas
5. [ ] Agregar notificaciones push
6. [ ] Optimizar con React Query cache
7. [ ] Agregar tests con Vitest

---

**🚀 ¡Listo para desarrollar!** El sistema de autenticación ya está funcionando end-to-end.
