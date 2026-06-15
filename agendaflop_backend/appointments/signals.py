"""
=============================================================================
SIGNALS - Sistema Automático de Notificaciones (Bloque 4)
=============================================================================

Este archivo define signals para crear notificaciones automáticamente
cuando ocurren eventos importantes en el sistema.

Eventos que generan notificaciones:
- Nueva cita creada
- Cita confirmada
- Cita cancelada
- Cita reprogramada
- Cita completada
- Cliente no asistió (no-show)

=============================================================================
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Appointment, Notification


@receiver(post_save, sender=Appointment)
def create_appointment_notification(sender, instance, created, **kwargs):
    """
    Signal que se ejecuta después de guardar una cita.
    
    Crea notificaciones según el evento:
    - created=True → Nueva cita creada
    - created=False → Cita actualizada (puede ser confirmada, cancelada, etc.)
    """
    
    # Solo crear notificaciones si el appointment tiene negocio asociado
    if not instance.business:
        return
    
    # Si es una nueva cita
    if created:
        Notification.create_appointment_notification(
            appointment=instance,
            notification_type=Notification.NotificationType.APPOINTMENT_CREATED,
            user=None  # Notificar a todos los usuarios del negocio
        )
    else:
        # Si se actualizó una cita existente, detectar qué cambió
        # Necesitamos comparar el estado anterior con el actual
        pass  # Implementaremos detección de cambios más adelante


@receiver(pre_save, sender=Appointment)
def detect_appointment_changes(sender, instance, **kwargs):
    """
    Signal que se ejecuta ANTES de guardar una cita.
    
    Guarda el estado anterior en memoria para poder compararlo
    después del guardado y generar notificaciones apropiadas.
    """
    if not instance.pk:
        # Es una nueva cita, no hay estado anterior
        instance._previous_status = None
        return
    
    try:
        # Obtener el estado actual de la BD (antes de guardar)
        previous = Appointment.objects.get(pk=instance.pk)
        instance._previous_status = previous.status
        instance._previous_date = previous.appointment_date
        instance._previous_time = previous.appointment_time
    except Appointment.DoesNotExist:
        instance._previous_status = None


@receiver(post_save, sender=Appointment)
def handle_appointment_status_change(sender, instance, created, **kwargs):
    """
    Detecta cambios de estado y crea notificaciones apropiadas.
    """
    
    # Si es nueva cita, ya la manejamos en create_appointment_notification
    if created:
        return
    
    # No crear notificaciones si no tiene negocio
    if not instance.business:
        return
    
    # Verificar si hubo cambio de estado
    previous_status = getattr(instance, '_previous_status', None)
    
    if previous_status and previous_status != instance.status:
        # El estado cambió, crear notificación apropiada
        
        if instance.status == Appointment.Status.CONFIRMED:
            Notification.create_appointment_notification(
                appointment=instance,
                notification_type=Notification.NotificationType.APPOINTMENT_CONFIRMED,
                user=None
            )
        
        elif instance.status == Appointment.Status.CANCELLED:
            Notification.create_appointment_notification(
                appointment=instance,
                notification_type=Notification.NotificationType.APPOINTMENT_CANCELLED,
                user=None
            )
        
        elif instance.status == Appointment.Status.COMPLETED:
            Notification.create_appointment_notification(
                appointment=instance,
                notification_type=Notification.NotificationType.APPOINTMENT_COMPLETED,
                user=None
            )
        
        elif instance.status == Appointment.Status.NO_SHOW:
            Notification.create_appointment_notification(
                appointment=instance,
                notification_type=Notification.NotificationType.APPOINTMENT_NO_SHOW,
                user=None
            )
    
    # Verificar si la cita was reprogramada (cambió fecha u hora)
    previous_date = getattr(instance, '_previous_date', None)
    previous_time = getattr(instance, '_previous_time', None)
    
    if previous_date and previous_time:
        if (previous_date != instance.appointment_date or 
            previous_time != instance.appointment_time):
            # La cita fue reprogramada
            Notification.create_appointment_notification(
                appointment=instance,
                notification_type=Notification.NotificationType.APPOINTMENT_RESCHEDULED,
                user=None
            )


# =============================================================================
# ONBOARDING PROGRESS SIGNALS (Bloque 5)
# =============================================================================

@receiver(post_save, sender=Appointment)
def mark_first_appointment_created(sender, instance, created, **kwargs):
    """
    Marca el paso 'has_created_first_appointment' en el onboarding
    cuando se crea la primera cita del negocio.
    """
    if created and instance.business:
        try:
            from business.models import OnboardingProgress
            progress, _ = OnboardingProgress.objects.get_or_create(business=instance.business)
            if not progress.has_created_first_appointment:
                progress.mark_step_completed('has_created_first_appointment')
        except Exception as e:
            # No fallar si hay error en onboarding
            print(f"Error actualizando onboarding: {e}")
