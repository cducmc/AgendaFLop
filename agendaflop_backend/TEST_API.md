# 🧪 GUÍA DE PRUEBAS - API REST

## 🚀 Iniciar el servidor

```bash
# Activar entorno virtual
.\.venv\Scripts\Activate.ps1

# Iniciar servidor de desarrollo
python manage.py runserver
```

El servidor correrá en: **http://127.0.0.1:8000**

---

## 📋 ENDPOINTS DISPONIBLES

### 🔐 **1. AUTENTICACIÓN**

#### Registro de nuevo negocio
```bash
POST http://127.0.0.1:8000/api/auth/register/
Content-Type: application/json

{
    "email": "test@salon.com",
    "password": "Test12345",
    "password_confirm": "Test12345",
    "first_name": "Maria",
    "last_name": "Garcia",
    "business_name": "Salón de Belleza María",
    "business_type": "salon",
    "phone": "+573001234567"
}
```

**Respuesta esperada:**
```json
{
    "user": {
        "id": "uuid...",
        "email": "test@salon.com",
        "first_name": "Maria",
        "role": "business_owner"
    },
    "business": {
        "id": 2,
        "name": "Salón de Belleza María",
        "slug": "salon-de-belleza-maria"
    },
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Login
```bash
POST http://127.0.0.1:8000/api/auth/login/
Content-Type: application/json

{
    "email": "admin@agendaflop.com",
    "password": "tu_contraseña"
}
```

#### Obtener datos del usuario actual
```bash
GET http://127.0.0.1:8000/api/auth/me/
Authorization: Bearer {access_token}
```

---

### 🏢 **2. NEGOCIO**

#### Ver mi negocio
```bash
GET http://127.0.0.1:8000/api/businesses/me/
Authorization: Bearer {access_token}
```

#### Actualizar mi negocio
```bash
PATCH http://127.0.0.1:8000/api/businesses/me/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "phone": "+573009876543",
    "address": "Calle 123 #45-67",
    "website": "https://misalon.com",
    "allow_online_booking": true
}
```

---

### 💇 **3. SERVICIOS**

#### Listar servicios
```bash
GET http://127.0.0.1:8000/api/services/
Authorization: Bearer {access_token}
```

#### Crear servicio
```bash
POST http://127.0.0.1:8000/api/services/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "name": "Pedicure Spa",
    "description": "Tratamiento completo de pedicura con exfoliación",
    "price": "45000.00",
    "duration": 60,
    "allow_online_booking": true,
    "is_active": true
}
```

---

### 👤 **4. PROFESIONALES**

#### Listar profesionales
```bash
GET http://127.0.0.1:8000/api/professionals/
Authorization: Bearer {access_token}
```

#### Crear profesional
```bash
POST http://127.0.0.1:8000/api/professionals/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "user": {
        "email": "peluquera@salon.com",
        "password": "Pass12345",
        "first_name": "Laura",
        "last_name": "Martínez"
    },
    "specialty": "Coloración y Tratamientos",
    "services": [1, 2],
    "accepts_online_bookings": true
}
```

---

### 👥 **5. CLIENTES**

#### Listar clientes
```bash
GET http://127.0.0.1:8000/api/clients/
Authorization: Bearer {access_token}
```

#### Buscar cliente
```bash
GET http://127.0.0.1:8000/api/clients/?search=Maria
Authorization: Bearer {access_token}
```

#### Clientes VIP
```bash
GET http://127.0.0.1:8000/api/clients/vip/
Authorization: Bearer {access_token}
```

#### Crear cliente
```bash
POST http://127.0.0.1:8000/api/clients/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "name": "Carlos Rodríguez",
    "phone": "+573112345678",
    "email": "carlos@email.com",
    "is_vip": false
}
```

---

### 📅 **6. CITAS (Dashboard)**

#### Listar todas las citas
```bash
GET http://127.0.0.1:8000/api/appointments/
Authorization: Bearer {access_token}
```

#### Citas de HOY
```bash
GET http://127.0.0.1:8000/api/appointments/today/
Authorization: Bearer {access_token}
```

#### Próximas citas
```bash
GET http://127.0.0.1:8000/api/appointments/upcoming/
Authorization: Bearer {access_token}
```

#### Estadísticas
```bash
GET http://127.0.0.1:8000/api/appointments/stats/
Authorization: Bearer {access_token}
```

#### Crear cita
```bash
POST http://127.0.0.1:8000/api/appointments/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "client": 1,
    "service": 1,
    "professional": 1,
    "appointment_date": "2026-02-25",
    "appointment_time": "10:00:00",
    "notes": "Cliente prefiere color castaño claro"
}
```

#### Confirmar cita
```bash
POST http://127.0.0.1:8000/api/appointments/1/confirm/
Authorization: Bearer {access_token}
```

#### Cancelar cita
```bash
POST http://127.0.0.1:8000/api/appointments/1/cancel/
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "cancellation_reason": "Cliente cambió de fecha"
}
```

#### Completar cita
```bash
POST http://127.0.0.1:8000/api/appointments/1/complete/
Authorization: Bearer {access_token}
```

#### Marcar como No Show
```bash
POST http://127.0.0.1:8000/api/appointments/1/no_show/
Authorization: Bearer {access_token}
```

#### Filtrar citas
```bash
# Por estado
GET http://127.0.0.1:8000/api/appointments/?status=confirmed
Authorization: Bearer {access_token}

# Por rango de fechas
GET http://127.0.0.1:8000/api/appointments/?date_from=2026-02-20&date_to=2026-02-28
Authorization: Bearer {access_token}

# Por profesional
GET http://127.0.0.1:8000/api/appointments/?professional=1
Authorization: Bearer {access_token}

# Buscar por cliente
GET http://127.0.0.1:8000/api/appointments/?search=Maria
Authorization: Bearer {access_token}
```

---

### 🌐 **7. PORTAL PÚBLICO (Sin autenticación)**

#### Ver información del negocio
```bash
GET http://127.0.0.1:8000/api/public/businesses/salon-elegance/
```

#### Ver servicios disponibles
```bash
GET http://127.0.0.1:8000/api/public/businesses/salon-elegance/services/
```

#### Ver profesionales disponibles
```bash
GET http://127.0.0.1:8000/api/public/businesses/salon-elegance/professionals/
```

#### Crear cita pública (Portal de reservas)
```bash
POST http://127.0.0.1:8000/api/public/businesses/salon-elegance/appointments/
Content-Type: application/json

{
    "client_name": "Juan Pérez",
    "client_phone": "+573201234567",
    "client_email": "juan@email.com",
    "service": 1,
    "professional": 1,
    "appointment_date": "2026-02-25",
    "appointment_time": "14:00:00",
    "notes": "Primera vez en el salón"
}
```

---

### 💳 **8. PLANES DE SUSCRIPCIÓN**

#### Ver planes disponibles
```bash
GET http://127.0.0.1:8000/api/plans/
# No requiere autenticación
```

---

## 🧪 PRUEBA RÁPIDA CON CURL

### Windows PowerShell:
```powershell
# 1. Login
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login/" -Method POST -Body (@{
    email = "admin@agendaflop.com"
    password = "tu_contraseña"
} | ConvertTo-Json) -ContentType "application/json"

$token = $response.access

# 2. Ver mis datos
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/me/" -Headers @{
    Authorization = "Bearer $token"
}

# 3. Citas de hoy
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/appointments/today/" -Headers @{
    Authorization = "Bearer $token"
}
```

---

## ✅ CHECKLIST DE PRUEBAS

- [ ] ✅ Registro de nuevo negocio
- [ ] ✅ Login con email/password
- [ ] ✅ Obtener datos del usuario autenticado
- [ ] ✅ Crear servicio
- [ ] ✅ Crear profesional
- [ ] ✅ Crear cliente
- [ ] ✅ Crear cita desde dashboard
- [ ] ✅ Ver citas de hoy
- [ ] ✅ Confirmar/Cancelar/Completar cita
- [ ] ✅ Ver negocio público (sin auth)
- [ ] ✅ Crear cita desde portal público (sin auth)
- [ ] ✅ Verificar aislamiento multi-tenant (crear 2do negocio y verificar que no ve datos del primero)

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Backend API completo
2. 🔄 **Siguiente:** Frontend React con AuthContext
3. 📱 Dashboard de citas
4. 🌐 Portal público de reservas
5. 📧 Notificaciones por email
