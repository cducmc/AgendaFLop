"""
=============================================================================
AGENDAFLOP - CONFIGURACIÓN DE DESARROLLO
=============================================================================
Configuración para entorno de desarrollo local.

Características de desarrollo:
- DEBUG activado (muestra errores detallados)
- PostgreSQL
- CORS permisivo (permite todos los orígenes)
- Emails se muestran en consola
- Sin caché
=============================================================================
"""

from .base import *
from decouple import config

# =============================================================================
# DEBUG Y HOSTS
# =============================================================================

DEBUG = True

# En desarrollo, permitir localhost
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']


# =============================================================================
# BASE DE DATOS
# =============================================================================
# PostgreSQL en desarrollo con Docker.

DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': config('DB_NAME', default='agendaflop_dev'),
        'USER': config('DB_USER', default='agendaflop'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='db'),
        'PORT': config('DB_PORT', default='5432'),
    }
}


# =============================================================================
# CORS (Desarrollo)
# =============================================================================
# En desarrollo, permitir todos los orígenes

CORS_ALLOW_ALL_ORIGINS = True  # Permite cualquier origen en desarrollo
CORS_ALLOW_CREDENTIALS = True   # Permite enviar cookies/credenciales


# =============================================================================
# EMAIL (Desarrollo)
# =============================================================================
# Emails se muestran en consola en vez de enviarse

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# =============================================================================
# CACHÉ (Desarrollo)
# =============================================================================
# Sin caché en desarrollo para ver cambios inmediatamente

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}


# =============================================================================
# LOGGING (Desarrollo)
# =============================================================================
# En desarrollo, logs solo en consola con nivel DEBUG

LOGGING['root']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'INFO'
LOGGING['loggers']['appointments']['level'] = 'DEBUG'


# =============================================================================
# DEBUG TOOLBAR (Opcional)
# =============================================================================
# Descomentar cuando instales django-debug-toolbar:

# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
# INTERNAL_IPS = ['127.0.0.1']


# =============================================================================
# DJANGO REST FRAMEWORK (Desarrollo)
# =============================================================================
# En desarrollo, API navegable habilitada

REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',  # API navegable
]

# Sin límite de requests en desarrollo
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '1000/hour',
    'user': '10000/hour',
}


print("🚀 Entorno: DESARROLLO")
_db = DATABASES['default']
_db_label = _db.get('NAME')
print(f"📁 Base de datos: {_db['ENGINE']} — {_db_label}")
print(f"🔓 DEBUG: {DEBUG}")
