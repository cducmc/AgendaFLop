# 📅 AgendaFlop Backend

Sistema profesional de agendamiento de citas para pequeños y medianos negocios (barberías, estéticas, consultorios, entrenadores, talleres, etc.).

---

## 🚀 Tecnologías

- **Python** 3.13+
- **Django** 6.0+
- **Django REST Framework** 3.16+
- **MySQL** 5.7+ / 8.0+
- **Git** para control de versiones

---

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd agendaflop_backend
```

### 2. Crear entorno virtual
```bash
python -m venv venv
```

### 3. Activar entorno virtual

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 4. Instalar dependencias

**Producción:**
```bash
pip install -r requirements.txt
```

**Desarrollo:**
```bash
pip install -r requirements-dev.txt
```

### 5. Configurar base de datos

Crear archivo `.env` en la raíz del proyecto:

```env
# Django
SECRET_KEY=tu-secret-key-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=agendaflop
DB_USER=root
DB_PASSWORD=tu-password
DB_HOST=localhost
DB_PORT=3306
```

### 6. Ejecutar migraciones
```bash
python manage.py migrate
```

### 7. Crear superusuario
```bash
python manage.py createsuperuser
```

### 8. Ejecutar servidor de desarrollo
```bash
python manage.py runserver
```

Acceder a: `http://localhost:8000`

---

## 🗂️ Estructura del Proyecto

```
agendaflop_backend/
│
├── config/                 # Configuración principal de Django
│   ├── settings/          # Settings por ambiente
│   │   ├── base.py       # Configuración base
│   │   ├── dev.py        # Desarrollo
│   │   └── prod.py       # Producción
│   ├── urls.py           # URLs principales
│   ├── wsgi.py           # WSGI para producción
│   └── asgi.py           # ASGI para async
│
├── appointments/          # App de gestión de citas
│   ├── models.py         # Modelos de datos
│   ├── views.py          # Views/Endpoints
│   ├── admin.py          # Admin de Django
│   └── migrations/       # Migraciones de BD
│
├── venv/                 # Entorno virtual (no en git)
├── .env                  # Variables de entorno (no en git)
├── .gitignore           # Archivos ignorados por git
├── manage.py            # Script de gestión de Django
├── requirements.txt     # Dependencias de producción
└── README.md           # Este archivo
```

---

## 🔧 Comandos Útiles

### Desarrollo
```bash
# Crear una nueva app
python manage.py startapp nombre_app

# Crear migraciones después de cambiar modelos
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Shell interactivo
python manage.py shell
```

### Testing
```bash
# Ejecutar tests
pytest

# Con cobertura
pytest --cov
```

---

## 📚 Aplicaciones del Proyecto

### `appointments`
Gestión completa del sistema de citas:
- Modelo `Appointment` con estados
- API REST para CRUD de citas
- Panel de administración configurado
- Validaciones de negocio

---

## 🛠️ Próximas Funcionalidades

- [ ] Autenticación JWT
- [ ] Sistema multiusuario (clientes, profesionales, admins)
- [ ] Notificaciones por email/SMS
- [ ] Pagos en línea
- [ ] Calendario interactivo
- [ ] Reportes y estadísticas
- [ ] App móvil (React Native)

---

## 👨‍💻 Desarrollo

Este proyecto sigue las mejores prácticas de Django:
- Código limpio y comentado
- Separación de configuraciones por ambiente
- Preparado para APIs REST
- Escalable y modular
- Listo para producción

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

---

## 📧 Contacto

Para dudas o consultas sobre el proyecto, contactar al desarrollador.
