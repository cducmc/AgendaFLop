# 🎨 Crear Frontend React para AgendaFlop

## ✅ EL BACKEND YA ESTÁ LISTO

Tu backend está **100% funcional** y **NO se va a dañar**. Ahora vamos a crear el frontend en una **carpeta separada**.

---

## 🏗️ ARQUITECTURA FINAL

```
📁 C:\Users\leny1\OneDrive\Documentos\Proyectos personales SOFT\
│
├── 📁 agendaflop_backend/        ← Backend (YA EXISTE) ✅
│   ├── config/
│   ├── appointments/
│   ├── manage.py
│   └── db.sqlite3
│
└── 📁 agendaflop-frontend/       ← Frontend (VAMOS A CREAR)  🆕
    ├── src/
    │   ├── components/
    │   ├── services/
    │   ├── pages/
    │   └── App.jsx
    ├── public/
    ├── package.json
    └── index.html
```

**DOS PROYECTOS INDEPENDIENTES:**
- Backend: Puerto 8000 (Django)
- Frontend: Puerto 5173 (React + Vite)
- Se comunican por HTTP/JSON

---

## 📋 PASOS PARA CREAR EL FRONTEND

### Paso 1: Verificar Node.js instalado

```bash
node --version
npm --version
```

**Si NO tienes Node.js:**
- Descarga desde: https://nodejs.org (versión LTS)
- Instala y reinicia la terminal

---

### Paso 2: Crear proyecto React con Vite

```bash
# Navega a la carpeta principal (donde está el backend)
cd "C:\Users\leny1\OneDrive\Documentos\Proyectos personales SOFT"

# Crea el proyecto React
npm create vite@latest agendaflop-frontend -- --template react

# Entra a la carpeta del frontend
cd agendaflop-frontend

# Instala dependencias base
npm install
```

---

### Paso 3: Instalar dependencias necesarias

```bash
# Axios - Para llamadas al API
npm install axios

# React Router - Para navegación entre páginas
npm install react-router-dom

# React Query - Manejo optimizado de datos del servidor
npm install @tanstack/react-query

# React Hook Form - Formularios fáciles
npm install react-hook-form

# Date-fns - Manejo de fechas
npm install date-fns

# Lucide React - Iconos modernos
npm install lucide-react
```

---

### Paso 4: Instalar y configurar Tailwind CSS

```bash
# Instalar Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Inicializar configuración
npx tailwindcss init -p
```

**Edita `tailwind.config.js`:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Edita `src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Paso 5: Crear estructura de carpetas

```bash
# Dentro de agendaflop-frontend/src/
mkdir components services pages hooks utils
```

**Estructura final:**
```
src/
├── components/         # Componentes reutilizables
├── services/           # API calls
├── pages/              # Páginas de la app
├── hooks/              # Custom hooks
├── utils/              # Funciones auxiliares
├── App.jsx
└── main.jsx
```

---

### Paso 6: Crear el servicio de API

**Crea `src/services/api.js`:**

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Crear instancia de axios con configuración
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API de Appointments
export const appointmentsAPI = {
  // Listar todas las citas
  getAll: (params = {}) => api.get('/appointments/', { params }),
  
  // Crear nueva cita
  create: (data) => api.post('/appointments/', data),
  
  // Ver detalle de una cita
  getById: (id) => api.get(`/appointments/${id}/`),
  
  // Actualizar cita
  update: (id, data) => api.patch(`/appointments/${id}/`, data),
  
  // Eliminar cita
  delete: (id) => api.delete(`/appointments/${id}/`),
  
  // Confirmar cita
  confirm: (id) => api.post(`/appointments/${id}/confirm/`),
  
  // Cancelar cita
  cancel: (id, reason) => api.post(`/appointments/${id}/cancel/`, { reason }),
  
  // Completar cita
  complete: (id) => api.post(`/appointments/${id}/complete/`),
  
  // Marcar como no asistió
  noShow: (id) => api.post(`/appointments/${id}/no_show/`),
  
  // Citas de hoy
  today: () => api.get('/appointments/today/'),
  
  // Citas futuras
  upcoming: () => api.get('/appointments/upcoming/'),
  
  // Estadísticas por estado
  stats: () => api.get('/appointments/by_status/'),
};

export default api;
```

---

### Paso 7: Crear componentes básicos

**Crea `src/pages/AppointmentsList.jsx`:**

```jsx
import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../services/api';
import { Calendar, Clock, User, Phone } from 'lucide-react';

function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsAPI.getAll();
      setAppointments(response.data.results || []);
    } catch (err) {
      setError('Error al cargar las citas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Citas Agendadas</h1>
      
      {appointments.length === 0 ? (
        <div className="text-center text-gray-500">
          No hay citas registradas
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Estado */}
              <div className="mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                  {appointment.status_display}
                </span>
              </div>

              {/* Cliente */}
              <div className="mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-semibold">{appointment.client_name}</span>
              </div>

              {/* Teléfono */}
              <div className="mb-2 flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{appointment.client_phone}</span>
              </div>

              {/* Servicio */}
              <div className="mb-2">
                <span className="text-sm font-medium text-indigo-600">
                  {appointment.service_name}
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  ${appointment.service_price}
                </span>
              </div>

              {/* Fecha */}
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{appointment.appointment_date}</span>
              </div>

              {/* Hora */}
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>{appointment.appointment_time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppointmentsList;
```

---

### Paso 8: Actualizar App.jsx

**Edita `src/App.jsx`:**

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppointmentsList from './pages/AppointmentsList';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-indigo-600">
              AgendaFlop
            </h1>
          </div>
        </header>

        {/* Content */}
        <main>
          <Routes>
            <Route path="/" element={<AppointmentsList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App();
```

---

### Paso 9: Actualizar main.jsx

**Edita `src/main.jsx`:**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## 🚀 EJECUTAR EL PROYECTO COMPLETO

### Terminal 1 - Backend

```bash
cd "C:\Users\leny1\OneDrive\Documentos\Proyectos personales SOFT\agendaflop_backend"
venv\Scripts\activate
python manage.py runserver --settings=config.settings.dev
```

**Backend corriendo en:** `http://localhost:8000`

### Terminal 2 - Frontend

```bash
cd "C:\Users\leny1\OneDrive\Documentos\Proyectos personales SOFT\agendaflop-frontend"
npm run dev
```

**Frontend corriendo en:** `http://localhost:5173`

---

## 🎯 PROBAR LA INTEGRACIÓN

1. **Abre el navegador:** `http://localhost:5173`
2. **Deberías ver:** Lista vacía de citas
3. **Crea citas desde el admin:** `http://localhost:8000/admin/`
4. **Refresca el frontend:** Se mostrarán las citas

---

## ✅ CHECKLIST

- [ ] Node.js instalado
- [ ] Proyecto React creado
- [ ] Dependencias instaladas
- [ ] Tailwind CSS configurado
- [ ] Estructura de carpetas creada
- [ ] Servicio API creado
- [ ] Componente AppointmentsList creado
- [ ] Backend corriendo (puerto 8000)
- [ ] Frontend corriendo (puerto 5173)
- [ ] CORS configurado en backend ✅ (ya lo hice)
- [ ] Frontend mostrando datos del backend

---

## 🎨 PRÓXIMOS PASOS

Una vez que lo tengas funcionando, podemos agregar:
- ✅ Formulario para crear citas
- ✅ Editar y eliminar citas
- ✅ Dashboard con estadísticas
- ✅ Filtros y búsqueda
- ✅ Calendario visual
- ✅ Login y autenticación

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Network Error" o "CORS"
- ✅ Ya configuré CORS en el backend
- Verifica que el backend esté corriendo en puerto 8000

### Error: "Cannot GET /api/appointments/"
- Verifica que el backend esté corriendo
- Verifica la URL en `src/services/api.js`

### No se ven las citas
- Crea algunas citas desde el admin de Django primero
- Verifica la consola del navegador (F12) para ver errores

---

**¿Listo para empezar? Sigue los pasos y avísame si necesitas ayuda!** 🚀
