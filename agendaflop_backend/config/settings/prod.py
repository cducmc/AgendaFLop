"""
=============================================================================
AGENDAFLOP - CONFIGURACIÓN DE PRODUCCIÓN
=============================================================================
Configuración para entorno de producción.

Características de producción:
- DEBUG desactivado (seguridad)
- PostgreSQL requerido
- HTTPS forzado
- Seguridad máxima
- Logging a archivos
- Caché con Redis
- Optimizaciones de performance

⚠️ IMPORTANTE:
- Crear archivo .env con todas las variables necesarias
- SECRET_KEY debe ser única y segura
- DB_PASSWORD debe ser fuerte
- Configurar ALLOWED_HOSTS correctamente
=============================================================================
"""

from .base import *
from decouple import config, Csv

# =============================================================================
# DEBUG Y HOSTS
# =============================================================================

DEBUG = False

# ALLOWED_HOSTS: Dominios permitidos (REQUERIDO en producción)
# Ejemplo: ALLOWED_HOSTS=agendaflop.com,www.agendaflop.com,api.agendaflop.com
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

if not ALLOWED_HOSTS:
    raise ValueError(
        "⚠️ ALLOWED_HOSTS no configurado. "
        "Define la variable ALLOWED_HOSTS en tu archivo .env"
    )


# =============================================================================
# BASE DE DATOS - PostgreSQL
# =============================================================================
# En producción, usar PostgreSQL

DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='db'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,  # Connection pooling (10 minutos)
    }
}


# =============================================================================
# SEGURIDAD
# =============================================================================

# HTTPS/SSL (toggleable por entorno)
ENABLE_HTTPS = config('ENABLE_HTTPS', default=False, cast=bool)
SECURE_SSL_REDIRECT = ENABLE_HTTPS
SESSION_COOKIE_SECURE = ENABLE_HTTPS
CSRF_COOKIE_SECURE = ENABLE_HTTPS

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000 if ENABLE_HTTPS else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = ENABLE_HTTPS
SECURE_HSTS_PRELOAD = ENABLE_HTTPS

# Otras protecciones de seguridad
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Proxy headers (si usas Nginx/Apache)
if ENABLE_HTTPS:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


# =============================================================================
# CORS (Producción)
# =============================================================================
# Solo los dominios especificados pueden acceder al API
# Descomentar cuando instales django-cors-headers:

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='', cast=Csv())
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# CSRF trusted origins para frontend en dominios separados
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='', cast=Csv())


# =============================================================================
# CACHÉ - Redis
# =============================================================================
# Usar Redis para mejorar performance
# Descomentar cuando tengas Redis configurado:

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://redis:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'agendaflop',
        'TIMEOUT': 300,  # 5 minutos
    }
}

# Session en Redis (opcional)
# SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
# SESSION_CACHE_ALIAS = 'default'


# =============================================================================
# ARCHIVOS ESTÁTICOS Y MEDIA
# =============================================================================
# En producción, servir con Nginx/Apache o subir a S3/CDN

STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_ROOT = BASE_DIR / 'media'

# Si usas AWS S3 (descomentar y configurar):
# USE_S3 = config('USE_S3', default=False, cast=bool)
# if USE_S3:
#     AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
#     AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
#     AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
#     AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
#     AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
#     STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
#     MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'


# =============================================================================
# EMAIL (Producción)
# =============================================================================
# Configurar SMTP real (Gmail, SendGrid, AWS SES, etc.)

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@agendaflop.com')


# =============================================================================
# LOGGING (Producción)
# =============================================================================
# Logs más detallados, guardados en archivos

# Crear directorio de logs si no existe
import os
log_dir = BASE_DIR / 'logs'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

LOGGING['handlers']['file']['filename'] = log_dir / 'production.log'
LOGGING['root']['handlers'] = ['console', 'file']
LOGGING['root']['level'] = 'INFO'


# =============================================================================
# SENTRY (Monitoreo de errores)
# =============================================================================
# Descomentar cuando tengas Sentry configurado:

# SENTRY_DSN = config('SENTRY_DSN', default=None)
# if SENTRY_DSN:
#     sentry_sdk.init(
#         dsn=SENTRY_DSN,
#         integrations=[DjangoIntegration()],
#         traces_sample_rate=0.1,
#         send_default_pii=True,
#         environment=config('ENVIRONMENT', default='production'),
#     )


# =============================================================================
# DJANGO REST FRAMEWORK (Producción)
# =============================================================================
# Solo JSON en producción (sin API navegable)

REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'rest_framework.renderers.JSONRenderer',
]

# Throttling más estricto
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '100/hour',
    'user': '1000/hour',
}


print("🚀 Entorno: PRODUCCIÓN")
print(f"📁 Base de datos: {DATABASES['default']['NAME']}")
print(f"🔒 DEBUG: {DEBUG}")
print(f"🌐 ALLOWED_HOSTS: {ALLOWED_HOSTS}")
