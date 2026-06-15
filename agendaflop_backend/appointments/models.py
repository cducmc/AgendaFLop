"""
=============================================================================
APPOINTMENTS - MODELOS DE DATOS
=============================================================================
Este archivo define el modelo principal 'Appointment' (Cita) para el sistema
de agendamiento.

¿Por qué existe este archivo?
- Define la estructura de la base de datos
- Establece las reglas de negocio a nivel de datos
- Facilita la validación y consistencia de información

¿Qué problema resuelve?
- Gestiona el ciclo de vida completo de una cita
- Controla los estados y transiciones válidas
- Prepara la base para multiusuario y escalabilidad
=============================================================================
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta


class Appointment(models.Model):
    """
    Modelo principal de Cita (Appointment).
    
    Representa una cita agendada en el sistema. Actualmente usa campos simples
    (CharField) para cliente y servicio, pero está diseñado para migrar a
    relaciones ForeignKey cuando implementemos:
    - Sistema de usuarios (User model)
    - Catálogo de servicios (Service model)
    - Sistema de profesionales/staff (Professional model)
    
    Esta arquitectura permite empezar simple y escalar sin reescribir todo.
    """
    
    # =========================================================================
    # ESTADOS DE LA CITA
    # =========================================================================
    # Usamos TextChoices para definir estados de manera profesional y type-safe
    # Esto previene typos y facilita el mantenimiento
    
    class Status(models.TextChoices):
        """
        Estados posibles de una cita durante su ciclo de vida.
        
        Flujo normal:
        PENDING → CONFIRMED → COMPLETED
        
        Flujos alternativos:
        PENDING → CANCELLED
        CONFIRMED → CANCELLED
        CONFIRMED → NO_SHOW
        """
        PENDING = 'pending', 'Pendiente'           # Recién creada, esperando confirmación
        CONFIRMED = 'confirmed', 'Confirmada'      # Cliente confirmó asistencia
        CANCELLED = 'cancelled', 'Cancelada'       # Cancelada por cliente o negocio
        COMPLETED = 'completed', 'Completada'      # Cita realizada exitosamente
        NO_SHOW = 'no_show', 'No asistió'         # Cliente no se presentó
    
    # =========================================================================
    # RELACIONES MULTI-TENANT (Nuevas - Opcionales por ahora)
    # =========================================================================
    
    # Relación con el negocio (multi-tenant)
    business = models.ForeignKey(
        'business.Business',
        on_delete=models.CASCADE,
        related_name='appointments',
        null=True,
        blank=True,
        help_text='Negocio al que pertenece esta cita'
    )
    
    # Relación con el cliente (CRM)
    client = models.ForeignKey(
        'business.Client',
        on_delete=models.SET_NULL,
        related_name='appointments',
        null=True,
        blank=True,
        help_text='Cliente del negocio (CRM)'
    )
    
    # Relación con el servicio configurado
    service = models.ForeignKey(
        'business.Service',
        on_delete=models.SET_NULL,
        related_name='appointments',
        null=True,
        blank=True,
        help_text='Servicio configurado del negocio'
    )
    
    # Relación con el profesional/recurso
    professional = models.ForeignKey(
        'business.Professional',
        on_delete=models.SET_NULL,
        related_name='appointments',
        null=True,
        blank=True,
        help_text='Profesional asignado a esta cita'
    )
    
    # =========================================================================
    # CAMPOS PRINCIPALES (Legacy - se mantienen para compatibilidad)
    # =========================================================================
    
    # --- Información del Cliente ---
    # TODO: Reemplazar con ForeignKey cuando implementemos User model
    # client = models.ForeignKey('users.Client', on_delete=models.CASCADE)
    client_name = models.CharField(
        'Nombre del cliente',
        max_length=150,
        help_text='Nombre completo del cliente'
    )
    
    client_phone = models.CharField(
        'Teléfono del cliente',
        max_length=20,
        help_text='Número de contacto para confirmaciones y recordatorios'
    )
    
    client_email = models.EmailField(
        'Email del cliente',
        blank=True,
        null=True,
        help_text='Email opcional para notificaciones'
    )
    
    # --- Información del Servicio ---
    # TODO: Reemplazar con ForeignKey cuando creemos el catálogo de servicios
    # service = models.ForeignKey('services.Service', on_delete=models.PROTECT)
    service_name = models.CharField(
        'Servicio',
        max_length=200,
        help_text='Nombre del servicio a realizar (ej: Corte de cabello, Manicure, etc.)'
    )
    
    service_duration = models.PositiveIntegerField(
        'Duración (minutos)',
        default=30,
        validators=[MinValueValidator(15)],
        help_text='Duración estimada del servicio en minutos'
    )
    
    service_price = models.DecimalField(
        'Precio',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Precio del servicio en moneda local'
    )
    
    # --- Fecha y Hora ---
    appointment_date = models.DateField(
        'Fecha de la cita',
        help_text='Día en que se realizará la cita'
    )
    
    appointment_time = models.TimeField(
        'Hora de la cita',
        help_text='Hora de inicio de la cita'
    )
    
    # --- Estado y Notas ---
    status = models.CharField(
        'Estado',
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        help_text='Estado actual de la cita'
    )
    
    notes = models.TextField(
        'Notas',
        blank=True,
        help_text='Notas adicionales, preferencias del cliente o instrucciones especiales'
    )
    
    cancellation_reason = models.TextField(
        'Motivo de cancelación',
        blank=True,
        help_text='Razón por la cual se canceló la cita (si aplica)'
    )
    
    # =========================================================================
    # TIMESTAMPS (Auditoría)
    # =========================================================================
    # Estos campos son cruciales para rastrear cambios y debugging
    
    created_at = models.DateTimeField(
        'Creado el',
        auto_now_add=True,
        help_text='Fecha y hora en que se creó la cita en el sistema'
    )
    
    updated_at = models.DateTimeField(
        'Actualizado el',
        auto_now=True,
        help_text='Fecha y hora de la última modificación'
    )
    
    # =========================================================================
    # METADATA
    # =========================================================================
    
    class Meta:
        # Nombre legible en singular y plural (para el admin de Django)
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'
        
        # Ordenamiento por defecto: próximas citas primero
        ordering = ['appointment_date', 'appointment_time']
        
        # Índices para mejorar performance en consultas comunes
        indexes = [
            models.Index(fields=['appointment_date', 'appointment_time']),
            models.Index(fields=['status']),
            models.Index(fields=['client_phone']),
        ]
        
        # Permisos personalizados (para futuro sistema de roles)
        permissions = [
            ('can_confirm_appointment', 'Puede confirmar citas'),
            ('can_cancel_appointment', 'Puede cancelar citas'),
            ('can_view_all_appointments', 'Puede ver todas las citas'),
        ]
    
    # =========================================================================
    # MÉTODOS
    # =========================================================================
    
    def __str__(self):
        """
        Representación en string del objeto.
        Útil en el admin de Django y en debugging.
        """
        return f"{self.client_name} - {self.service_name} - {self.appointment_date} {self.appointment_time}"
    
    def clean(self):
        """
        Validaciones personalizadas a nivel de modelo.
        Se ejecuta antes de guardar si se llama explícitamente o desde formularios.
        """
        super().clean()
        
        # Validar que la fecha de la cita no sea en el pasado
        if self.appointment_date and self.appointment_time:
            appointment_datetime = timezone.make_aware(
                timezone.datetime.combine(self.appointment_date, self.appointment_time)
            )
            
            if appointment_datetime < timezone.now() and not self.pk:
                # Solo validar para citas nuevas (sin pk)
                raise ValidationError({
                    'appointment_date': 'No se pueden crear citas en el pasado',
                    'appointment_time': 'No se pueden crear citas en el pasado'
                })
        
        # Validar que si está cancelada, debe tener razón de cancelación
        if self.status == self.Status.CANCELLED and not self.cancellation_reason:
            raise ValidationError({
                'cancellation_reason': 'Debe especificar un motivo de cancelación'
            })
    
    def save(self, *args, skip_validation=False, **kwargs):
        """
        Override del método save para ejecutar validaciones automáticamente.
        
        Args:
            skip_validation: Si es True, omite la validación (útil para datos de ejemplo)
        """
        # Ejecutar validaciones antes de guardar (excepto si se omite explícitamente)
        if not skip_validation:
            self.full_clean()
        super().save(*args, **kwargs)
    
    # --- Métodos de negocio ---
    
    def confirm(self):
        """Confirmar una cita pendiente."""
        if self.status == self.Status.PENDING:
            self.status = self.Status.CONFIRMED
            self.save()
            return True
        return False
    
    def cancel(self, reason):
        """Cancelar una cita."""
        if self.status not in [self.Status.COMPLETED, self.Status.CANCELLED]:
            self.status = self.Status.CANCELLED
            self.cancellation_reason = reason
            self.save()
            return True
        return False
    
    def complete(self):
        """Marcar una cita como completada."""
        if self.status == self.Status.CONFIRMED:
            self.status = self.Status.COMPLETED
            self.save()
            return True
        return False
    
    def mark_no_show(self):
        """Marcar que el cliente no se presentó."""
        if self.status == self.Status.CONFIRMED:
            self.status = self.Status.NO_SHOW
            self.save()
            return True
        return False
    
    @property
    def is_upcoming(self):
        """Verifica si la cita es futura."""
        appointment_datetime = timezone.make_aware(
            timezone.datetime.combine(self.appointment_date, self.appointment_time)
        )
        return appointment_datetime > timezone.now()
    
    @property
    def is_today(self):
        """Verifica si la cita es hoy."""
        return self.appointment_date == timezone.now().date()
    
    @property
    def can_be_modified(self):
        """Verifica si la cita puede ser modificada."""
        return self.status in [self.Status.PENDING, self.Status.CONFIRMED] and self.is_upcoming


# =============================================================================
# MODELO DE NOTIFICACIONES (Bloque 4)
# =============================================================================

class Notification(models.Model):
    """
    Modelo de Notificación para el sistema.
    
    Gestiona todas las notificaciones in-app que reciben los usuarios:
    - Nueva cita creada
    - Cita confirmada/cancelada
    - Recordatorios de citas próximas
    - Actualizaciones del sistema
    
    Arquitectura:
    - Cada notificación pertenece a un negocio y puede tener un usuario específico
    - Si user es None, es una notificación para todos los usuarios del negocio
    - Vinculación opcional con la cita que generó la notificación
    """
    
    class NotificationType(models.TextChoices):
        """Tipos de notificación disponibles."""
        APPOINTMENT_CREATED = 'appointment_created', 'Cita Creada'
        APPOINTMENT_CONFIRMED = 'appointment_confirmed', 'Cita Confirmada'
        APPOINTMENT_CANCELLED = 'appointment_cancelled', 'Cita Cancelada'
        APPOINTMENT_RESCHEDULED = 'appointment_rescheduled', 'Cita Reprogramada'
        APPOINTMENT_REMINDER = 'appointment_reminder', 'Recordatorio de Cita'
        APPOINTMENT_COMPLETED = 'appointment_completed', 'Cita Completada'
        APPOINTMENT_NO_SHOW = 'appointment_no_show', 'Cliente No Asistió'
        SYSTEM_UPDATE = 'system_update', 'Actualización del Sistema'
        PAYMENT_RECEIVED = 'payment_received', 'Pago Recibido'
        CLIENT_REGISTERED = 'client_registered', 'Nuevo Cliente Registrado'
    
    # =========================================================================
    # RELACIONES
    # =========================================================================
    
    business = models.ForeignKey(
        'business.Business',
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='Negocio al que pertenece esta notificación'
    )
    
    user = models.ForeignKey(
        'business.User',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
        help_text='Usuario destinatario (None = todos los usuarios del negocio)'
    )
    
    appointment = models.ForeignKey(
        'Appointment',
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
        help_text='Cita relacionada con esta notificación'
    )
    
    # =========================================================================
    # CAMPOS DE CONTENIDO
    # =========================================================================
    
    notification_type = models.CharField(
        'Tipo de Notificación',
        max_length=50,
        choices=NotificationType.choices,
        help_text='Categoría de la notificación'
    )
    
    title = models.CharField(
        'Título',
        max_length=200,
        help_text='Título breve de la notificación'
    )
    
    message = models.TextField(
        'Mensaje',
        help_text='Contenido completo de la notificación'
    )
    
    # =========================================================================
    # CAMPOS DE ESTADO
    # =========================================================================
    
    is_read = models.BooleanField(
        'Leída',
        default=False,
        help_text='Indica si el usuario ya leyó esta notificación'
    )
    
    read_at = models.DateTimeField(
        'Leída en',
        null=True,
        blank=True,
        help_text='Fecha y hora en que se marcó como leída'
    )
    
    # =========================================================================
    # CAMPOS DE AUDITORÍA
    # =========================================================================
    
    created_at = models.DateTimeField(
        'Creada el',
        auto_now_add=True,
        help_text='Fecha y hora de creación'
    )
    
    # =========================================================================
    # METADATA
    # =========================================================================
    
    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']  # Más recientes primero
        
        indexes = [
            models.Index(fields=['business', 'user', 'is_read']),
            models.Index(fields=['business', 'created_at']),
            models.Index(fields=['notification_type']),
        ]
    
    # =========================================================================
    # MÉTODOS
    # =========================================================================
    
    def __str__(self):
        """Representación en string del objeto."""
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def mark_as_read(self):
        """Marcar notificación como leída."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    def mark_as_unread(self):
        """Marcar notificación como no leída."""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save()
    
    @classmethod
    def create_appointment_notification(cls, appointment, notification_type, user=None):
        """
        Helper para crear notificaciones relacionadas con citas.
        
        Args:
            appointment: Instancia de Appointment
            notification_type: Tipo de notificación (usar NotificationType)
            user: Usuario específico (opcional)
        
        Returns:
            Instancia de Notification creada
        """
        # Mapeo de tipos a títulos y mensajes
        messages_map = {
            cls.NotificationType.APPOINTMENT_CREATED: (
                'Nueva Cita Creada',
                f'Nueva cita con {appointment.client_name} para {appointment.service_name} el {appointment.appointment_date} a las {appointment.appointment_time}'
            ),
            cls.NotificationType.APPOINTMENT_CONFIRMED: (
                'Cita Confirmada',
                f'La cita con {appointment.client_name} ha sido confirmada para {appointment.appointment_date} a las {appointment.appointment_time}'
            ),
            cls.NotificationType.APPOINTMENT_CANCELLED: (
                'Cita Cancelada',
                f'La cita con {appointment.client_name} programada para {appointment.appointment_date} a las {appointment.appointment_time} ha sido cancelada'
            ),
            cls.NotificationType.APPOINTMENT_RESCHEDULED: (
                'Cita Reprogramada',
                f'La cita con {appointment.client_name} ha sido reprogramada para {appointment.appointment_date} a las {appointment.appointment_time}'
            ),
            cls.NotificationType.APPOINTMENT_REMINDER: (
                'Recordatorio de Cita',
                f'Recordatorio: Cita con {appointment.client_name} para {appointment.service_name} mañana a las {appointment.appointment_time}'
            ),
            cls.NotificationType.APPOINTMENT_COMPLETED: (
                'Cita Completada',
                f'La cita con {appointment.client_name} ha sido marcada como completada'
            ),
            cls.NotificationType.APPOINTMENT_NO_SHOW: (
                'Cliente No Asistió',
                f'{appointment.client_name} no asistió a su cita programada para {appointment.appointment_date} a las {appointment.appointment_time}'
            ),
        }
        
        title, message = messages_map.get(
            notification_type,
            ('Notificación', 'Nueva notificación del sistema')
        )
        
        return cls.objects.create(
            business=appointment.business,
            user=user,
            appointment=appointment,
            notification_type=notification_type,
            title=title,
            message=message
        )
