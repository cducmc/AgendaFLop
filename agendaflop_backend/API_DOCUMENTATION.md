# 📡 AgendaFlop - Documentación de la API

## 🚀 Base URL

```
http://localhost:8000/api/
```

---

## 📋 Endpoints Disponibles

### 🏠 Información General

**GET** `/api/`

Retorna información general de la API.

**Respuesta:**
```json
{
  "message": "Bienvenido a AgendaFlop API",
  "version": "1.0.0",
  "endpoints": {
    "admin": "/admin/",
    "api": "/api/",
    "appointments": "/api/appointments/",
    "documentation": "/api/docs/"
  },
  "status": "operational"
}
```

---

## 📅 Appointments (Citas)

### Listar todas las citas

**GET** `/api/appointments/`

**Query Parameters:**
- `?page=2` - Paginación
- `?page_size=50` - Cantidad por página (default: 20)
- `?status=pending` - Filtrar por estado
- `?appointment_date=2026-02-15` - Filtrar por fecha exacta
- `?appointment_date__gte=2026-02-01` - Desde fecha
- `?appointment_date__lte=2026-02-28` - Hasta fecha
- `?search=Juan` - Buscar en nombre, teléfono, email, servicio
- `?ordering=-created_at` - Ordenar (- para descendente)

**Ejemplo de Respuesta:**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/appointments/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "client_name": "Juan Pérez",
      "client_phone": "5512345678",
      "service_name": "Corte de cabello",
      "service_price": "150.00",
      "appointment_date": "2026-02-15",
      "appointment_time": "10:00:00",
      "status": "pending",
      "status_display": "Pendiente",
      "created_at": "2026-02-12T14:30:00Z"
    }
  ]
}
```

---

### Crear una cita

**POST** `/api/appointments/`

**Body (JSON):**
```json
{
  "client_name": "María García",
  "client_phone": "5598765432",
  "client_email": "maria@example.com",
  "service_name": "Manicure",
  "service_duration": 45,
  "service_price": "200.00",
  "appointment_date": "2026-02-20",
  "appointment_time": "14:30:00",
  "notes": "Cliente prefiere esmalte rojo"
}
```

**Validaciones:**
- `client_name`: Requerido, máximo 150 caracteres
- `client_phone`: Requerido, máximo 20 caracteres
- `client_email`: Opcional, formato email válido
- `service_name`: Requerido, máximo 200 caracteres
- `service_duration`: Requerido, mínimo 15 minutos, máximo 480 minutos
- `service_price`: Requerido, no negativo
- `appointment_date`: Requerido, no puede ser en el pasado
- `appointment_time`: Requerido, entre 08:00 y 20:00
- `notes`: Opcional

**Respuesta (201 Created):**
```json
{
  "id": 5,
  "client_name": "María García",
  "client_phone": "5598765432",
  "client_email": "maria@example.com",
  "service_name": "Manicure",
  "service_duration": 45,
  "service_price": "200.00",
  "appointment_date": "2026-02-20",
  "appointment_time": "14:30:00",
  "status": "pending",
  "status_display": "Pendiente",
  "notes": "Cliente prefiere esmalte rojo",
  "cancellation_reason": "",
  "created_at": "2026-02-12T15:00:00Z",
  "updated_at": "2026-02-12T15:00:00Z",
  "is_upcoming": true,
  "is_today": false,
  "can_be_modified": true
}
```

---

### Ver detalle de una cita

**GET** `/api/appointments/{id}/`

**Ejemplo:** GET `/api/appointments/5/`

**Respuesta (200 OK):**
```json
{
  "id": 5,
  "client_name": "María García",
  "client_phone": "5598765432",
  "client_email": "maria@example.com",
  "service_name": "Manicure",
  "service_duration": 45,
  "service_price": "200.00",
  "appointment_date": "2026-02-20",
  "appointment_time": "14:30:00",
  "status": "pending",
  "status_display": "Pendiente",
  "notes": "Cliente prefiere esmalte rojo",
  "cancellation_reason": "",
  "created_at": "2026-02-12T15:00:00Z",
  "updated_at": "2026-02-12T15:00:00Z",
  "is_upcoming": true,
  "is_today": false,
  "can_be_modified": true
}
```

---

### Actualizar una cita completa

**PUT** `/api/appointments/{id}/`

Actualiza todos los campos de la cita.

---

### Actualizar campos específicos

**PATCH** `/api/appointments/{id}/`

**Body (JSON):**
```json
{
  "notes": "Cliente solicita cambio de hora"
}
```

Solo los campos enviados serán actualizados.

---

### Eliminar una cita

**DELETE** `/api/appointments/{id}/`

**Respuesta (204 No Content)**

---

## 🎯 Acciones Personalizadas

### Confirmar cita

**POST** `/api/appointments/{id}/confirm/`

Cambia el estado de `pending` a `confirmed`.

**Respuesta (200 OK):**
```json
{
  "id": 5,
  "status": "confirmed",
  "status_display": "Confirmada",
  ...
}
```

---

### Cancelar cita

**POST** `/api/appointments/{id}/cancel/`

**Body (JSON):**
```json
{
  "reason": "Cliente solicitó cancelación por motivos personales"
}
```

**Respuesta (200 OK):**
```json
{
  "id": 5,
  "status": "cancelled",
  "status_display": "Cancelada",
  "cancellation_reason": "Cliente solicitó cancelación por motivos personales",
  ...
}
```

---

### Marcar como completada

**POST** `/api/appointments/{id}/complete/`

Marca la cita como completada (solo si está confirmada).

---

### Marcar como "No asistió"

**POST** `/api/appointments/{id}/no_show/`

Marca que el cliente no se presentó (solo si está confirmada).

---

## 📊 Endpoints Especiales

### Citas futuras

**GET** `/api/appointments/upcoming/`

Retorna todas las citas futuras (no canceladas ni completadas).

---

### Citas de hoy

**GET** `/api/appointments/today/`

Retorna todas las citas del día actual.

---

### Estadísticas por estado

**GET** `/api/appointments/by_status/`

**Respuesta:**
```json
{
  "pending": 10,
  "confirmed": 25,
  "completed": 100,
  "cancelled": 5,
  "no_show": 3
}
```

---

## 🔒 Autenticación

**Actual:** Sistema básico (IsAuthenticatedOrReadOnly)
- GET endpoints: Accesibles sin autenticación
- POST/PUT/PATCH/DELETE: Requieren autenticación

**Futuro:** JWT (JSON Web Tokens)
```
Authorization: Bearer <token>
```

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Eliminado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 500 | Internal Server Error - Error del servidor |

---

## 🧪 Ejemplos con cURL

### Listar citas
```bash
curl -X GET http://localhost:8000/api/appointments/
```

### Crear cita
```bash
curl -X POST http://localhost:8000/api/appointments/ \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Juan Pérez",
    "client_phone": "5512345678",
    "service_name": "Corte de cabello",
    "service_duration": 30,
    "service_price": "150.00",
    "appointment_date": "2026-02-20",
    "appointment_time": "10:00:00"
  }'
```

### Confirmar cita
```bash
curl -X POST http://localhost:8000/api/appointments/1/confirm/
```

### Cancelar cita
```bash
curl -X POST http://localhost:8000/api/appointments/1/cancel/ \
  -H "Content-Type: application/json" \
  -d '{"reason": "Cliente canceló"}'
```

---

## 🧪 Ejemplos con Python (requests)

```python
import requests

BASE_URL = "http://localhost:8000/api"

# Listar citas
response = requests.get(f"{BASE_URL}/appointments/")
print(response.json())

# Crear cita
data = {
    "client_name": "Juan Pérez",
    "client_phone": "5512345678",
    "service_name": "Corte de cabello",
    "service_duration": 30,
    "service_price": "150.00",
    "appointment_date": "2026-02-20",
    "appointment_time": "10:00:00"
}
response = requests.post(f"{BASE_URL}/appointments/", json=data)
print(response.json())

# Confirmar cita
response = requests.post(f"{BASE_URL}/appointments/1/confirm/")
print(response.json())
```

---

## 🧪 Ejemplos con JavaScript (fetch)

```javascript
const BASE_URL = 'http://localhost:8000/api';

// Listar citas
fetch(`${BASE_URL}/appointments/`)
  .then(response => response.json())
  .then(data => console.log(data));

// Crear cita
fetch(`${BASE_URL}/appointments/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    client_name: 'Juan Pérez',
    client_phone: '5512345678',
    service_name: 'Corte de cabello',
    service_duration: 30,
    service_price: '150.00',
    appointment_date: '2026-02-20',
    appointment_time: '10:00:00'
  })
})
  .then(response => response.json())
  .then(data => console.log(data));

// Confirmar cita
fetch(`${BASE_URL}/appointments/1/confirm/`, {
  method: 'POST'
})
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## 🎨 Testing con Postman

1. Importar colección (próximamente)
2. Configurar variable de entorno `base_url=http://localhost:8000/api`
3. Ejecutar requests

---

## 📚 Próximas Mejoras

- [ ] Autenticación JWT
- [ ] Documentación Swagger/OpenAPI
- [ ] WebSockets para notificaciones en tiempo real
- [ ] Filtros por profesional/servicio
- [ ] Endpoints de disponibilidad de horarios
- [ ] Sistema de recordatorios
- [ ] API de pagos
