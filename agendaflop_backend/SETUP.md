# 🚀 Guía de Configuración Rápida - AgendaFlop

## 📋 Pasos de configuración inicial

### 1. Activar entorno virtual
```bash
venv\Scripts\activate
```

### 2. Verificar instalación de dependencias
```bash
pip list
```

Deberías ver:
- Django (6.0.2)
- djangorestframework (3.16.1)
- mysqlclient (2.2.8)
- python-decouple (3.8)

### 3. Crear superusuario para acceder al admin
```bash
python manage.py createsuperuser
```

**Datos sugeridos:**
- **Username:** admin
- **Email:** admin@agendaflop.com
- **Password:** (elige una contraseña segura)

### 4. Ejecutar el servidor de desarrollo
```bash
python manage.py runserver
```

### 5. Acceder al panel de administración
- Abre tu navegador en: `http://localhost:8000/admin`
- Ingresa con las credenciales que creaste
- ¡Ya puedes gestionar citas! 🎉

---

## 🎨 Características del Admin

### Vista de Lista
- ✅ Lista de todas las citas ordenadas por fecha/hora
- 🔍 Buscador por nombre, teléfono, email, servicio, notas
- 🏷️ Filtros por estado, fecha, servicio
- 🎨 Badges de colores según el estado
- 🔴 Resalta en rojo las citas del día actual

### Estados de Citas
- **⏳ Pendiente** (naranja) - Recién creada
- **✅ Confirmada** (azul) - Cliente confirmó
- **✔️ Completada** (verde) - Servicio realizado
- **❌ Cancelada** (rojo) - Cita cancelada
- **👻 No asistió** (gris) - Cliente no se presentó

### Acciones Masivas
Selecciona múltiples citas y ejecuta:
- ✅ Confirmar citas seleccionadas
- ❌ Cancelar citas seleccionadas
- ✔️ Marcar como completadas
- 👻 Marcar como "No asistió"

### Formulario de Cita
Organizado en secciones:
1. **📋 Información del Cliente** - Nombre, teléfono, email
2. **💼 Información del Servicio** - Servicio, duración, precio
3. **📅 Fecha y Hora** - Cuándo se realizará
4. **📊 Estado y Seguimiento** - Estado, notas, razón de cancelación
5. **🕐 Auditoría** - Fechas de creación/modificación (automático)

---

## 🧪 Probar el Sistema

### Crear una cita de prueba:
1. En el admin, click en "Citas" → "Agregar Cita"
2. Completa los datos:
   - **Cliente:** Juan Pérez
   - **Teléfono:** 5512345678
   - **Email:** juan@example.com
   - **Servicio:** Corte de cabello
   - **Duración:** 30 minutos
   - **Precio:** 150.00
   - **Fecha:** Mañana
   - **Hora:** 10:00 AM
   - **Estado:** Pendiente
3. Click en "Guardar"

### Probar acciones:
1. Selecciona la cita recién creada
2. En el dropdown de acciones, elige "Confirmar citas seleccionadas"
3. Click en "Go"
4. ¡La cita cambia a estado Confirmada! ✅

---

## 🔧 Comandos Útiles

```bash
# Crear migraciones después de cambiar modelos
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Abrir shell de Django (para probar models)
python manage.py shell

# Crear datos de prueba desde el shell
from appointments.models import Appointment
from datetime import date, time
from decimal import Decimal

cita = Appointment.objects.create(
    client_name="María García",
    client_phone="5598765432",
    service_name="Manicure",
    service_duration=45,
    service_price=Decimal("200.00"),
    appointment_date=date(2026, 2, 15),
    appointment_time=time(14, 30),
    notes="Cliente prefiere esmalte rojo"
)
```

---

## 📊 Verificar la Base de Datos

```bash
python manage.py dbshell
```

```sql
-- Ver todas las citas
SELECT * FROM appointments_appointment;

-- Contar citas por estado
SELECT status, COUNT(*) FROM appointments_appointment GROUP BY status;
```

---

## ✅ Checklist de Verificación

- [ ] Entorno virtual activado
- [ ] Dependencias instaladas
- [ ] Migraciones aplicadas
- [ ] Superusuario creado
- [ ] Servidor corriendo
- [ ] Admin accesible en http://localhost:8000/admin
- [ ] Cita de prueba creada exitosamente

---

## 🆘 Solución de Problemas

### Error: "No module named 'django'"
**Solución:** Asegúrate de activar el entorno virtual
```bash
venv\Scripts\activate
```

### Error al conectar con MySQL
**Solución:** Por ahora usamos SQLite (base de datos de desarrollo). 
Para producción configuraremos MySQL en el archivo `.env`

### No aparece el modelo en el admin
**Solución:** Verifica que `appointments` esté en INSTALLED_APPS en `config/settings/base.py`

---

## 🎯 Próximos Pasos

Una vez que todo funcione:
1. ✅ Crear algunas citas de prueba
2. ✅ Probar filtros y búsquedas
3. ✅ Probar acciones masivas
4. ➡️ Continuar con la configuración de API REST
5. ➡️ Configurar MySQL para producción
6. ➡️ Agregar autenticación JWT
