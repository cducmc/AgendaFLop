"""
URLs para la app appointments
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AppointmentViewSet, 
    PublicAppointmentCreateView,
    PublicAvailabilityView,
    NotificationViewSet,
)

# Router para ViewSets
router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # =========================================================================
    # PUBLIC ENDPOINTS (Portal de reservas)
    # =========================================================================
    
    # Crear cita pública
    path('public/businesses/<slug:slug>/appointments/', 
         PublicAppointmentCreateView.as_view({'post': 'create'}), 
         name='public_create_appointment'),
    
    # Consultar disponibilidad
    path('public/businesses/<slug:slug>/availability/', 
         PublicAvailabilityView.as_view(), 
         name='public_availability'),
    
    # =========================================================================
    # ROUTER URLS (ViewSets)
    # =========================================================================
    path('', include(router.urls)),
]
