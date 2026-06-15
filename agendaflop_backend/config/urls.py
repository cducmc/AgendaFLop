"""
URLs principales del proyecto AgendaFlop

Estructura de URLs:
- /admin/                            → Panel de administración de Django
- /api/auth/                         → Autenticación (register, login, logout)
- /api/businesses/                   → CRUD de negocios
- /api/services/                     → CRUD de servicios
- /api/professionals/                → CRUD de profesionales
- /api/clients/                      → CRUD de clientes
- /api/appointments/                 → CRUD de citas
- /api/public/businesses/{slug}/     → Portal público de reservas
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.conf.urls.static import static


# Personalización del admin de Django
admin.site.site_header = "AgendaFlop Administración"
admin.site.site_title = "AgendaFlop Admin"
admin.site.index_title = "Gestión Multi-Tenant del Sistema de Citas"


@require_http_methods(["GET"])
def api_root(request):
    """
    Endpoint raíz de la API.
    Proporciona información básica y enlaces a recursos disponibles.
    """
    return JsonResponse({
        'message': 'Bienvenido a AgendaFlop API',
        'version': '1.0.0',
        'description': 'Sistema Multi-Tenant de Gestión de Citas',
        'authentication': 'JWT',
        'endpoints': {
            'admin': '/admin/',
            'auth': {
                'register': '/api/auth/register/',
                'login': '/api/auth/login/',
                'refresh': '/api/auth/refresh/',
                'logout': '/api/auth/logout/',
                'me': '/api/auth/me/',
            },
            'business': {
                'my_business': '/api/businesses/me/',
                'plans': '/api/plans/',
            },
            'dashboard': {
                'services': '/api/services/',
                'professionals': '/api/professionals/',
                'clients': '/api/clients/',
                'appointments': '/api/appointments/',
            },
            'public': {
                'business_detail': '/api/public/businesses/{slug}/',
                'services': '/api/public/businesses/{slug}/services/',
                'professionals': '/api/public/businesses/{slug}/professionals/',
                'create_appointment': '/api/public/businesses/{slug}/appointments/',
            }
        },
        'status': 'operational'
    })


urlpatterns = [
    # =========================================================================
    # ADMIN
    # =========================================================================
    path('admin/', admin.site.urls),
    
    # =========================================================================
    # API ROOT
    # =========================================================================
    path('api/', api_root, name='api-root'),
    
    # =========================================================================
    # BUSINESS APP (Auth, Negocios, Servicios, Profesionales, Clientes)
    # =========================================================================
    path('api/', include('business.urls')),
    
    # =========================================================================
    # APPOINTMENTS APP (Citas)
    # =========================================================================
    path('api/', include('appointments.urls')),
    
    # =========================================================================
    # REPORTS APP (Reportes y Analytics)
    # =========================================================================
    path('api/reports/', include('reports.urls')),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


