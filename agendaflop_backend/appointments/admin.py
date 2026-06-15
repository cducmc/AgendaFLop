"""
=============================================================================
APPOINTMENTS - CONFIGURACIÓN DEL ADMIN
=============================================================================
Este archivo configura el panel de administración de Django para gestionar
citas de manera profesional e intuitiva.

¿Por qué existe este archivo?
- Permite gestionar citas sin necesidad de código
- Proporciona una interfaz visual para el personal administrativo
- Facilita el testing y debugging durante el desarrollo

¿Qué problema resuelve?
- Gestión rápida de citas sin construir un frontend completo
- Herramienta lista para usar mientras se desarrolla la API/frontend
- Interface profesional para clientes y personal administrativo
=============================================================================
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Appointment, Notification


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """
    Configuración profesional del Admin para el modelo Appointment.
    
    Características:
    - Lista optimizada con los datos más relevantes
    - Filtros inteligentes por estado y fecha
    - Búsqueda por nombre y teléfono del cliente
    - Acciones masivas para confirmar/cancelar citas
    - Organización clara de campos en el formulario
    - Indicadores visuales de estado con colores
    """
    
    # =========================================================================
    # VISTA DE LISTA (List View)
    # =========================================================================
    
    list_display = [
        'id',
        'appointment_datetime_display',
        'client_name',
        'client_phone',
        'service_name',
        'service_price',
        'status_badge',
        'created_at_display',
    ]
    
    list_display_links = ['id', 'client_name']  # Campos clicables para editar
    
    # Filtros en la barra lateral derecha
    list_filter = [
        'status',                    # Filtrar por estado
        'appointment_date',          # Filtrar por fecha
        'created_at',                # Filtrar por fecha de creación
        'service_name',              # Filtrar por tipo de servicio
    ]
    
    # Búsqueda por múltiples campos
    search_fields = [
        'client_name',               # Buscar por nombre del cliente
        'client_phone',              # Buscar por teléfono
        'client_email',              # Buscar por email
        'service_name',              # Buscar por servicio
        'notes',                     # Buscar en notas
    ]
    
    # Ordenamiento por defecto: citas más próximas primero
    ordering = ['appointment_date', 'appointment_time']
    
    # Paginación: 25 citas por página
    list_per_page = 25
    
    # =========================================================================
    # FORMULARIO DE EDICIÓN/CREACIÓN
    # =========================================================================
    
    # Organización de campos en secciones (fieldsets)
    fieldsets = (
        ('📋 Información del Cliente', {
            'fields': (
                'client_name',
                'client_phone',
                'client_email',
            ),
            'description': 'Datos de contacto del cliente'
        }),
        
        ('💼 Información del Servicio', {
            'fields': (
                'service_name',
                'service_duration',
                'service_price',
            ),
            'description': 'Detalles del servicio a realizar'
        }),
        
        ('📅 Fecha y Hora', {
            'fields': (
                'appointment_date',
                'appointment_time',
            ),
            'description': 'Cuándo se realizará la cita'
        }),
        
        ('📊 Estado y Seguimiento', {
            'fields': (
                'status',
                'notes',
                'cancellation_reason',
            ),
            'description': 'Estado actual y notas adicionales'
        }),
        
        ('🕐 Auditoría', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),  # Sección colapsada por defecto
            'description': 'Información de creación y modificación (automático)'
        }),
    )
    
    # Campos de solo lectura (no editables)
    readonly_fields = [
        'created_at',
        'updated_at',
    ]
    
    # =========================================================================
    # ACCIONES MASIVAS (Bulk Actions)
    # =========================================================================
    
    actions = [
        'confirm_appointments',
        'cancel_appointments',
        'mark_as_completed',
        'mark_as_no_show',
    ]
    
    @admin.action(description='✅ Confirmar citas seleccionadas')
    def confirm_appointments(self, request, queryset):
        """Acción para confirmar múltiples citas a la vez."""
        updated = queryset.filter(
            status=Appointment.Status.PENDING
        ).update(status=Appointment.Status.CONFIRMED)
        
        self.message_user(
            request,
            f'{updated} cita(s) confirmada(s) exitosamente.',
            level='success'
        )
    
    @admin.action(description='❌ Cancelar citas seleccionadas')
    def cancel_appointments(self, request, queryset):
        """Acción para cancelar múltiples citas a la vez."""
        updated = queryset.filter(
            status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED]
        ).update(
            status=Appointment.Status.CANCELLED,
            cancellation_reason='Cancelado manualmente desde el admin'
        )
        
        self.message_user(
            request,
            f'{updated} cita(s) cancelada(s) exitosamente.',
            level='warning'
        )
    
    @admin.action(description='✔️ Marcar como completadas')
    def mark_as_completed(self, request, queryset):
        """Acción para marcar citas como completadas."""
        updated = queryset.filter(
            status=Appointment.Status.CONFIRMED
        ).update(status=Appointment.Status.COMPLETED)
        
        self.message_user(
            request,
            f'{updated} cita(s) marcada(s) como completadas.',
            level='success'
        )
    
    @admin.action(description='👻 Marcar como "No asistió"')
    def mark_as_no_show(self, request, queryset):
        """Acción para marcar que los clientes no se presentaron."""
        updated = queryset.filter(
            status=Appointment.Status.CONFIRMED
        ).update(status=Appointment.Status.NO_SHOW)
        
        self.message_user(
            request,
            f'{updated} cita(s) marcada(s) como "No asistió".',
            level='warning'
        )
    
    # =========================================================================
    # MÉTODOS PERSONALIZADOS PARA LA LISTA
    # =========================================================================
    
    @admin.display(description='📅 Fecha y Hora', ordering='appointment_date')
    def appointment_datetime_display(self, obj):
        """
        Muestra la fecha y hora en formato legible.
        Resalta en rojo si es hoy.
        """
        date_str = obj.appointment_date.strftime('%d/%m/%Y')
        time_str = obj.appointment_time.strftime('%H:%M')
        
        if obj.is_today:
            return format_html(
                '<strong style="color: #e74c3c;">🔴 {} - {}</strong>',
                date_str,
                time_str
            )
        
        return f'{date_str} - {time_str}'
    
    @admin.display(description='Estado', ordering='status')
    def status_badge(self, obj):
        """
        Muestra el estado con badge de color para identificación rápida.
        
        Colores:
        - Pendiente: Naranja
        - Confirmada: Azul
        - Completada: Verde
        - Cancelada: Rojo
        - No asistió: Gris
        """
        colors = {
            Appointment.Status.PENDING: '#f39c12',      # Naranja
            Appointment.Status.CONFIRMED: '#3498db',    # Azul
            Appointment.Status.COMPLETED: '#27ae60',    # Verde
            Appointment.Status.CANCELLED: '#e74c3c',    # Rojo
            Appointment.Status.NO_SHOW: '#95a5a6',      # Gris
        }
        
        icons = {
            Appointment.Status.PENDING: '⏳',
            Appointment.Status.CONFIRMED: '✅',
            Appointment.Status.COMPLETED: '✔️',
            Appointment.Status.CANCELLED: '❌',
            Appointment.Status.NO_SHOW: '👻',
        }
        
        color = colors.get(obj.status, '#000000')
        icon = icons.get(obj.status, '•')
        label = obj.get_status_display()
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold; font-size: 11px;">'
            '{} {}</span>',
            color,
            icon,
            label
        )
    
    @admin.display(description='Creado', ordering='created_at')
    def created_at_display(self, obj):
        """Muestra cuándo se creó la cita en formato relativo."""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days == 0:
            hours = diff.seconds // 3600
            if hours == 0:
                minutes = diff.seconds // 60
                return f'Hace {minutes} min'
            return f'Hace {hours}h'
        elif diff.days == 1:
            return 'Ayer'
        elif diff.days < 7:
            return f'Hace {diff.days} días'
        else:
            return obj.created_at.strftime('%d/%m/%Y')
    
    # =========================================================================
    # CONFIGURACIÓN ADICIONAL
    # =========================================================================
    
    # Mostrar cantidad total de objetos en la parte inferior
    show_full_result_count = True
    
    # Permitir guardar y continuar editando por defecto
    save_on_top = True
    
    def get_queryset(self, request):
        """
        Optimiza las consultas a la base de datos.
        En el futuro, cuando agreguen ForeignKeys, usar select_related y prefetch_related.
        """
        qs = super().get_queryset(request)
        # Para futuro: qs = qs.select_related('client', 'service', 'professional')
        return qs


# =============================================================================
# ADMIN DE NOTIFICACIONES (Bloque 4)
# =============================================================================

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """
    Configuración del Admin para el modelo Notification.
    
    Características:
    - Vista de lista con filtros por tipo y estado de lectura
    - Búsqueda por título y mensaje
    - Acciones masivas para marcar como leído/no leído
    - Indicadores visuales con colores y iconos
    """
    
    list_display = [
        'id',
        'notification_type_display',
        'title',
        'user_display',
        'is_read_badge',
        'created_at_display',
        'appointment_link',
    ]
    
    list_display_links = ['id', 'title']
    
    list_filter = [
        'notification_type',
        'is_read',
        'created_at',
        'business',
    ]
    
    search_fields = [
        'title',
        'message',
        'user__email',
        'user__username',
    ]
    
    ordering = ['-created_at']
    
    list_per_page = 25
    
    fieldsets = (
        ('📬 Información de la Notificación', {
            'fields': (
                'notification_type',
                'title',
                'message',
            )
        }),
        
        ('👤 Destinatario', {
            'fields': (
                'business',
                'user',
                'appointment',
            )
        }),
        
        ('📖 Estado de Lectura', {
            'fields': (
                'is_read',
                'read_at',
            )
        }),
        
        ('🕒 Información de Auditoría', {
            'fields': (
                'created_at',
            ),
            'classes': ('collapse',),  # Colapsado por defecto
        }),
    )
    
    readonly_fields = ['created_at', 'read_at']
    
    # Acciones masivas
    actions = ['mark_as_read', 'mark_as_unread']
    
    @admin.action(description='✅ Marcar como leídas')
    def mark_as_read(self, request, queryset):
        """Marca las notificaciones seleccionadas como leídas."""
        count = 0
        for notification in queryset:
            notification.mark_as_read()
            count += 1
        
        self.message_user(
            request,
            f'{count} notificación(es) marcada(s) como leídas.',
            level='success'
        )
    
    @admin.action(description='📭 Marcar como no leídas')
    def mark_as_unread(self, request, queryset):
        """Marca las notificaciones seleccionadas como no leídas."""
        count = 0
        for notification in queryset:
            notification.mark_as_unread()
            count += 1
        
        self.message_user(
            request,
            f'{count} notificación(es) marcada(s) como no leídas.',
            level='success'
        )
    
    # Métodos personalizados para la lista
    
    @admin.display(description='🔔 Tipo', ordering='notification_type')
    def notification_type_display(self, obj):
        """Muestra el tipo de notificación con icono."""
        icons = {
            'appointment_created': '📅',
            'appointment_confirmed': '✅',
            'appointment_cancelled': '❌',
            'appointment_rescheduled': '🔄',
            'appointment_reminder': '⏰',
            'appointment_completed': '✔️',
            'appointment_no_show': '👻',
            'system_update': '🔧',
            'payment_received': '💰',
            'client_registered': '👤',
        }
        
        icon = icons.get(obj.notification_type, '📬')
        return f'{icon} {obj.get_notification_type_display()}'
    
    @admin.display(description='👤 Usuario')
    def user_display(self, obj):
        """Muestra el usuario destinatario."""
        if obj.user:
            return format_html(
                '<strong>{}</strong>',
                obj.user.email if hasattr(obj.user, 'email') else str(obj.user)
            )
        return format_html(
            '<em style="color: #95a5a6;">Todos los usuarios</em>'
        )
    
    @admin.display(description='Estado', ordering='is_read')
    def is_read_badge(self, obj):
        """Muestra el estado de lectura con badge."""
        if obj.is_read:
            return format_html(
                '<span style="background-color: #27ae60; color: white; padding: 3px 10px; '
                'border-radius: 3px; font-weight: bold; font-size: 11px;">'
                '✓ Leída</span>'
            )
        return format_html(
            '<span style="background-color: #3498db; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold; font-size: 11px;">'
            '● Nueva</span>'
        )
    
    @admin.display(description='📅 Cita')
    def appointment_link(self, obj):
        """Muestra enlace a la cita relacionada."""
        if obj.appointment:
            return format_html(
                '<a href="/admin/appointments/appointment/{}/change/">Cita #{}</a>',
                obj.appointment.id,
                obj.appointment.id
            )
        return '-'
    
    @admin.display(description='⏰ Creada', ordering='created_at')
    def created_at_display(self, obj):
        """Muestra cuándo se creó la notificación en formato relativo."""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days == 0:
            hours = diff.seconds // 3600
            if hours == 0:
                minutes = diff.seconds // 60
                return f'Hace {minutes} min'
            return f'Hace {hours}h'
        elif diff.days == 1:
            return 'Ayer'
        elif diff.days < 7:
            return f'Hace {diff.days} días'
        else:
            return obj.created_at.strftime('%d/%m/%Y %H:%M')
    
    def get_queryset(self, request):
        """Optimiza las consultas."""
        qs = super().get_queryset(request)
        qs = qs.select_related('business', 'user', 'appointment')
        return qs
