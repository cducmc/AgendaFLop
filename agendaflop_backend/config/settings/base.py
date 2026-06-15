"""
=============================================================================
AGENDAFLOP - CONFIGURACIÓN BASE
=============================================================================
Configuración base compartida por todos los entornos (desarrollo, producción).

Las configuraciones específicas de cada entorno están en:
- dev.py: Desarrollo local
- prod.py: Producción

Usa variables de entorno (.env) para valores sensibles.
=============================================================================
"""

from pathlib import Path
from decouple import config, Csv

# Import pillow-avif-plugin to enable AVIF image format support
try:
    import pillow_avif
except ImportError:
    pass  # Plugin no instalado, AVIF no estará disponible

# =============================================================================
# PATHS
# =============================================================================

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent


# =============================================================================
# SEGURIDAD
# =============================================================================
# ADVERTENCIA: Mantén esto en secreto en producción!
# Genera una nueva con: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

SECRET_KEY = config('SECRET_KEY', default='django-insecure-!8tc=9i2545v6&02jmd!n04j4h*6l-o6w*+h7fc_cm0+qvq9lu')

# DEBUG debe ser False en producción (se sobrescribe en dev.py y prod.py)
DEBUG = config('DEBUG', default=False, cast=bool)

# Hosts/dominios permitidos
# Ejemplo: ALLOWED_HOSTS=localhost,127.0.0.1,agendaflop.com
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=Csv())


# =============================================================================
# APLICACIONES
# =============================================================================

INSTALLED_APPS = [
    # Django Core Apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third Party Apps
    # Django REST Framework - Para construir APIs RESTful
    'rest_framework',
    
    # Django Filter - Filtros avanzados para APIs
    'django_filters',
    
    # CORS Headers - Permite requests desde frontend en otro dominio
    'corsheaders',
    
    # JWT Authentication
    'rest_framework_simplejwt',
    
    # Local Apps (nuestras aplicaciones)
    # business: Gestión de negocios, usuarios, planes (multi-tenant)
    'business.apps.BusinessConfig',
    
    # appointments: Gestión completa del sistema de citas
    'appointments.apps.AppointmentsConfig',
    
    # reports: Sistema de reportes y analytics avanzados
    'reports.apps.ReportsConfig',
]


# =============================================================================
# MIDDLEWARE
# =============================================================================

MIDDLEWARE = [
    # Seguridad
    'django.middleware.security.SecurityMiddleware',
    
    # CORS - Permite requests desde frontend
    'corsheaders.middleware.CorsMiddleware',
    
    # Sesiones y cookies
    'django.contrib.sessions.middleware.SessionMiddleware',
    
    # Common (URLs, ETags, User-Agent, etc.)
    'django.middleware.common.CommonMiddleware',
    
    # CSRF Protection
    'django.middleware.csrf.CsrfViewMiddleware',
    
    # Autenticación
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    
    # Mensajes
    'django.contrib.messages.middleware.MessageMiddleware',
    
    # Clickjacking protection
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# =============================================================================
# URLs Y APLICACIONES WSGI/ASGI
# =============================================================================

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'


# =============================================================================
# TEMPLATES
# =============================================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # Templates globales
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# =============================================================================
# BASE DE DATOS
# =============================================================================
# PostgreSQL en todos los entornos

DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': config('DB_NAME', default='agendaflop'),
        'USER': config('DB_USER', default='agendaflop'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='db'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Configuración para connection pooling y optimizaciones (para producción)
# Se habilita en prod.py


# =============================================================================
# VALIDACIÓN DE CONTRASEÑAS
# =============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,  # Mínimo 8 caracteres
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# =============================================================================
# INTERNACIONALIZACIÓN Y ZONA HORARIA
# =============================================================================

# Idioma: es-mx (México), es-ar (Argentina), es-co (Colombia), es-es (España)
LANGUAGE_CODE = 'es-mx'

# Zona horaria - CRÍTICO para el sistema de citas
# Mexico: America/Mexico_City
# Colombia: America/Bogota
# Argentina: America/Argentina/Buenos_Aires
# España: Europe/Madrid
TIME_ZONE = 'America/Mexico_City'

USE_I18N = True  # Internacionalización
USE_TZ = True    # Usar zonas horarias (IMPORTANTE para citas)


# =============================================================================
# ARCHIVOS ESTÁTICOS (CSS, JavaScript, Images)
# =============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Directorios adicionales de archivos estáticos
STATICFILES_DIRS = [
    # BASE_DIR / 'static',
]


# =============================================================================
# ARCHIVOS MEDIA (Subidos por usuarios)
# =============================================================================

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Límites de subida de archivos
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB máximo en memoria
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB máximo por archivo


# =============================================================================
# CONFIGURACIÓN DE MODELOS
# =============================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Modelo de usuario personalizado
AUTH_USER_MODEL = 'business.User'


# =============================================================================
# DJANGO REST FRAMEWORK
# Configuración para APIs REST - Preparado para futuro frontend/mobile
# =============================================================================

REST_FRAMEWORK = {
    # Paginación por defecto (evita cargar miles de citas a la vez)
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    
    # Autenticación JWT + Session
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    
    # Permisos por defecto
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    
    # Filtros
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    
    # Formato de fecha/hora consistente
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
    'DATE_FORMAT': '%Y-%m-%d',
    'TIME_FORMAT': '%H:%M:%S',
    
    # Rendering
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',  # API navegable (útil en dev)
    ],
    
    # Parsing
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    
    # Throttling (límite de requests)
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',      # Anónimos: 100 requests por hora
        'user': '1000/hour',     # Autenticados: 1000 requests por hora
    },
}


# =============================================================================
# SIMPLE JWT CONFIGURATION
# =============================================================================

from datetime import timedelta

SIMPLE_JWT = {
    # Access token dura 1 hora (suficiente para sesiones normales)
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    
    # Refresh token dura 7 días (refresca sin login)
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    
    # Rotar refresh token al usarlo (más seguro)
    'ROTATE_REFRESH_TOKENS': True,
    
    # Blacklist refresh tokens viejos
    'BLACKLIST_AFTER_ROTATION': True,
    
    # Algoritmo de firma
    'ALGORITHM': 'HS256',
    
    # Usar el SECRET_KEY de Django
    'SIGNING_KEY': SECRET_KEY,
    
    # Claims personalizados
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # Campos del token
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}


# =============================================================================
# CORS (Cross-Origin Resource Sharing)
# =============================================================================
# Permite que el frontend (React, Vue, Angular) acceda al backend desde otro dominio

# CORS_ALLOWED_ORIGINS: Lista de orígenes permitidos
# Se configura con la variable de entorno CORS_ALLOWED_ORIGINS
# Ejemplo: http://localhost:3000,http://localhost:5173,https://app.agendaflop.com

# En desarrollo, permitir todos los orígenes
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=True, cast=bool)

# CORS_ALLOWED_ORIGINS para producción (descomentar y desactivar ALLOW_ALL):
# CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='', cast=Csv())

# CORS_ALLOW_CREDENTIALS: Permitir cookies/credenciales
CORS_ALLOW_CREDENTIALS = True


# =============================================================================
# SEGURIDAD ADICIONAL
# =============================================================================
# Estas configuraciones se habilitan en producción (prod.py)

# HTTPS/SSL
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True

# HSTS (HTTP Strict Transport Security)
# SECURE_HSTS_SECONDS = 31536000  # 1 año
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True

# Otras seguridades
# SECURE_CONTENT_TYPE_NOSNIFF = True
# SECURE_BROWSER_XSS_FILTER = True
# X_FRAME_OPTIONS = 'DENY'


# =============================================================================
# LOGGING
# =============================================================================
# Sistema de logs para debugging y monitoreo

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 1024 * 1024 * 5,  # 5 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': config('LOG_LEVEL', default='INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': config('LOG_LEVEL', default='INFO'),
            'propagate': False,
        },
        'appointments': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}


# =============================================================================
# EMAIL
# =============================================================================
# Configuración para envío de emails (notificaciones, recordatorios, etc.)

EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@agendaflop.com')
