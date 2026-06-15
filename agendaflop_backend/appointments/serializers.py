"""
Serializers para la app appointments
"""

from rest_framework import serializers
from django.utils import timezone
from datetime import datetime
from .models import Appointment, Notification
from business.models import Business, Client, Service, Professional


class AppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer completo para el modelo Appointment con soporte multi-tenant.
    """
    
    # Campos de solo lectura con detalles
    client_details = serializers.SerializerMethodField()
    service_details = serializers.SerializerMethodField()
    professional_details = serializers.SerializerMethodField()
    business_name = serializers.CharField(source='business.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'business', 'business_name',
            'client', 'client_details', 'client_name', 'client_phone', 'client_email',
            'service', 'service_details', 'service_name', 'service_duration', 'service_price',
            'professional', 'professional_details',
            'appointment_date', 'appointment_time',
            'status', 'status_display', 'notes',
            'cancellation_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'business', 'created_at', 'updated_at'
        ]
    
    def get_client_details(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'name': obj.client.name,
                'email': obj.client.email,
                'phone': obj.client.phone,
                'is_vip': obj.client.is_vip
            }
        return None
    
    def get_service_details(self, obj):
        if obj.service:
            return {
                'id': obj.service.id,
                'name': obj.service.name,
                'price': obj.service.price,
                'duration': obj.service.duration,
                'color': obj.service.color
            }
        return None
    
    def get_professional_details(self, obj):
        if obj.professional:
            return {
                'id': obj.professional.id,
                'name': obj.professional.name,
                'title': obj.professional.title,
                'color': obj.professional.color
            }
        return None


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear citas desde el dashboard.
    Auto-completa client_name, service_name, etc. basado en las FKs.
    """
    
    class Meta:
        model = Appointment
        fields = [
            'client', 'service', 'professional',
            'appointment_date', 'appointment_time',
            'notes', 'status'
        ]
    
    def validate(self, attrs):
        """Validaciones personalizadas"""
        business = self.context['business']
        
        if attrs.get('service') and attrs['service'].business != business:
            raise serializers.ValidationError({
                'service': 'El servicio no pertenece a este negocio'
            })
        
        if attrs.get('professional') and attrs['professional'].business != business:
            raise serializers.ValidationError({
                'professional': 'El profesional no pertenece a este negocio'
            })
        
        if attrs.get('client') and attrs['client'].business != business:
            raise serializers.ValidationError({
                'client': 'El cliente no pertenece a este negocio'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Auto-completar campos al crear"""
        business = self.context['business']
        
        # Auto-completar datos del cliente
        if validated_data.get('client'):
            client = validated_data['client']
            validated_data['client_name'] = client.name
            validated_data['client_phone'] = client.phone
            validated_data['client_email'] = client.email or ''
        
        # Auto-completar datos del servicio
        if validated_data.get('service'):
            service = validated_data['service']
            validated_data['service_name'] = service.name
            validated_data['service_duration'] = service.duration
            validated_data['service_price'] = service.price
        
        # Asignar negocio
        validated_data['business'] = business
        
        return super().create(validated_data)


class AppointmentPublicCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear citas desde el portal público.
    Permite crear cliente al vuelo si no existe.
    """
    # Campos para crear/buscar cliente
    client_name = serializers.CharField(required=True, max_length=100)
    client_phone = serializers.CharField(required=True, max_length=20)
    client_email = serializers.EmailField(required=False, allow_blank=True)
    
    class Meta:
        model = Appointment
        fields = [
            'service', 'professional',
            'appointment_date', 'appointment_time',
            'client_name', 'client_phone', 'client_email',
            'notes'
        ]
    
    def validate(self, attrs):
        """Validaciones del portal público"""
        business = self.context['business']
        
        # Validar que el negocio permita reservas online
        if not business.allow_online_booking:
            raise serializers.ValidationError(
                'Este negocio no acepta reservas en línea'
            )
        
        # Validar que el servicio permita reservas online
        if attrs.get('service') and not attrs['service'].allow_online_booking:
            raise serializers.ValidationError({
                'service': 'Este servicio no está disponible para reserva en línea'
            })

        if attrs.get('service') and attrs['service'].business_id != business.id:
            raise serializers.ValidationError({
                'service': 'El servicio no pertenece a este negocio'
            })
        
        # Validar que el profesional acepte reservas online
        if attrs.get('professional') and not attrs['professional'].accepts_online_bookings:
            raise serializers.ValidationError({
                'professional': 'Este profesional no acepta reservas en línea'
            })

        if attrs.get('professional') and attrs['professional'].business_id != business.id:
            raise serializers.ValidationError({
                'professional': 'El profesional no pertenece a este negocio'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Crear cliente si no existe y luego crear la cita"""
        business = self.context['business']
        
        # Buscar o crear cliente
        client, created = Client.objects.get_or_create(
            business=business,
            phone=validated_data['client_phone'],
            defaults={
                'name': validated_data['client_name'],
                'email': validated_data.get('client_email', ''),
                'referral_source': 'Portal web'
            }
        )
        
        # Si el cliente ya existe pero tiene diferente nombre/email, actualizarlo
        if not created:
            if client.name != validated_data['client_name']:
                client.name = validated_data['client_name']
            if validated_data.get('client_email') and client.email != validated_data['client_email']:
                client.email = validated_data['client_email']
            client.save()
        
        # Auto-completar datos del servicio
        if validated_data.get('service'):
            service = validated_data['service']
            validated_data['service_name'] = service.name
            validated_data['service_duration'] = service.duration
            validated_data['service_price'] = service.price
        
        # Crear la cita
        validated_data['business'] = business
        validated_data['client'] = client
        validated_data['status'] = 'pending'  # Las reservas públicas inician como pending
        
        return super().create(validated_data)


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar citas"""
    
    class Meta:
        model = Appointment
        fields = [
            'appointment_date', 'appointment_time',
            'status', 'notes', 'cancellation_reason'
        ]
    
    def validate_status(self, value):
        """Validar cambios de estado"""
        instance = self.instance
        
        # Si se cancela, debe tener razón
        if value == 'cancelled' and not self.initial_data.get('cancellation_reason'):
            raise serializers.ValidationError(
                'Debe proporcionar una razón de cancelación'
            )
        
        # No se puede cambiar de completada a otro estado
        if instance and instance.status == 'completed' and value != 'completed':
            raise serializers.ValidationError(
                'No se puede modificar una cita completada'
            )
        
        return value


class AppointmentListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listar citas"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    client_name = serializers.CharField(read_only=True)
    service_name = serializers.CharField(read_only=True)
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'client_name', 'client_phone',
            'service_name', 'service_price',
            'professional_name',
            'appointment_date', 'appointment_time',
            'status', 'status_display',
            'created_at'
        ]
        read_only_fields = fields


class AppointmentStatusUpdateSerializer(serializers.Serializer):
    """Serializer para cambio rápido de estado"""
    status = serializers.ChoiceField(choices=Appointment.Status.choices)
    cancellation_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        if attrs['status'] == 'cancelled' and not attrs.get('cancellation_reason'):
            raise serializers.ValidationError({
                'cancellation_reason': 'Debe proporcionar una razón de cancelación'
            })
        return attrs


# =============================================================================
# SERIALIZERS DE NOTIFICACIONES (Bloque 4)
# =============================================================================

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Notification.
    
    Incluye:
    - Detalles del tipo de notificación
    - Información del usuario destinatario
    - Detalles de la cita relacionada (si existe)
    - Formato de fecha legible
    """
    
    notification_type_display = serializers.CharField(
        source='get_notification_type_display',
        read_only=True
    )
    
    user_email = serializers.EmailField(
        source='user.email',
        read_only=True
    )
    
    appointment_details = serializers.SerializerMethodField()
    
    created_at_formatted = serializers.SerializerMethodField()
    read_at_formatted = serializers.SerializerMethodField()
    
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'business',
            'user',
            'user_email',
            'appointment',
            'appointment_details',
            'notification_type',
            'notification_type_display',
            'title',
            'message',
            'is_read',
            'read_at',
            'read_at_formatted',
            'created_at',
            'created_at_formatted',
            'time_ago',
        ]
        read_only_fields = [
            'id',
            'business',
            'created_at',
            'read_at',
        ]
    
    def get_appointment_details(self, obj):
        """Retorna detalles básicos de la cita relacionada."""
        if obj.appointment:
            return {
                'id': obj.appointment.id,
                'client_name': obj.appointment.client_name,
                'service_name': obj.appointment.service_name,
                'appointment_date': obj.appointment.appointment_date,
                'appointment_time': str(obj.appointment.appointment_time),
                'status': obj.appointment.status,
            }
        return None
    
    def get_created_at_formatted(self, obj):
        """Retorna fecha de creación formateada."""
        return obj.created_at.strftime('%d/%m/%Y %H:%M')
    
    def get_read_at_formatted(self, obj):
        """Retorna fecha de lectura formateada."""
        if obj.read_at:
            return obj.read_at.strftime('%d/%m/%Y %H:%M')
        return None
    
    def get_time_ago(self, obj):
        """Retorna cuánto tiempo hace que se creó la notificación."""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days == 0:
            hours = diff.seconds // 3600
            if hours == 0:
                minutes = diff.seconds // 60
                if minutes == 0:
                    return 'Ahora mismo'
                return f'Hace {minutes} min'
            return f'Hace {hours}h'
        elif diff.days == 1:
            return 'Ayer'
        elif diff.days < 7:
            return f'Hace {diff.days} días'
        elif diff.days < 30:
            weeks = diff.days // 7
            return f'Hace {weeks} semana' + ('s' if weeks > 1 else '')
        else:
            months = diff.days // 30
            return f'Hace {months} mes' + ('es' if months > 1 else '')


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer simplificado para crear notificaciones."""
    
    class Meta:
        model = Notification
        fields = [
            'user',
            'appointment',
            'notification_type',
            'title',
            'message',
        ]
    
    def create(self, validated_data):
        """Crear notificación asociada al negocio del request."""
        request = self.context.get('request')
        if request and hasattr(request.user, 'business'):
            validated_data['business'] = request.user.business
        return super().create(validated_data)

