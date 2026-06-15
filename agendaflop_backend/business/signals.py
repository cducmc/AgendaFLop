"""
=============================================================================
BUSINESS SIGNALS - Sistema Automático para Onboarding (Bloque 5)
=============================================================================

Signals para gestión automática de progreso de onboarding.

Eventos que disparan signals:
- Nuevo negocio creado → Crear OnboardingProgress
- Servicio creado → Marcar paso completado
- Profesional creado → Marcar paso completado
- Primera cita creada → Marcar paso completado
- Horarios configurados → Marcar paso completado

=============================================================================
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Business, Service, Professional, OnboardingProgress


@receiver(post_save, sender=Business)
def create_onboarding_progress(sender, instance, created, **kwargs):
    """
    Crea automáticamente OnboardingProgress cuando se crea un nuevo negocio.
    
    Esto asegura que cada negocio tenga su tracker de progreso desde el inicio.
    """
    if created:
        OnboardingProgress.objects.create(business=instance)


@receiver(post_save, sender=Service)
def mark_service_created(sender, instance, created, **kwargs):
    """
    Marca el paso 'has_created_service' como completado cuando se crea el primer servicio.
    """
    if created and instance.business:
        progress, _ = OnboardingProgress.objects.get_or_create(business=instance.business)
        if not progress.has_created_service:
            progress.mark_step_completed('has_created_service')


@receiver(post_save, sender=Professional)
def mark_professional_created(sender, instance, created, **kwargs):
    """
    Marca el paso 'has_created_professional' como completado cuando se crea el primer profesional.
    """
    if created and instance.business:
        progress, _ = OnboardingProgress.objects.get_or_create(business=instance.business)
        if not progress.has_created_professional:
            progress.mark_step_completed('has_created_professional')


# Signal para citas se manejará desde appointments/signals.py
# para evitar imports circulares
