"""
Serializers para la app business
"""

from rest_framework import serializers
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from .models import (
    SubscriptionPlan,
    Business,
    Subscription,
    Service,
    Professional,
    Client,
    OnboardingProgress,
    AvailabilityRule,
    AvailabilityException,
)

User = get_user_model()


# =============================================================================
# USER & AUTH SERIALIZERS
# =============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Serializer para el modelo User (sin password)"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'role', 'avatar', 'business', 'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_staff', 'is_superuser']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer para registro de nuevo usuario + negocio.
    Crea un usuario business_owner y su negocio en una transacción.
    
    ⚠️ IMPORTANTE - Arquitectura Multi-Tenant:
    Este serializer está diseñado EXCLUSIVAMENTE para registrar business_owners.
    NO debe usarse para crear otros roles:
    - super_admin: Se crea con manage.py createsuperuser (sin business)
    - manager/professional/receptionist: Se crean desde el admin del negocio
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    
    # Campos del negocio
    business_name = serializers.CharField(write_only=True, required=True, max_length=100)
    business_type = serializers.ChoiceField(
        write_only=True,
        required=True,
        choices=Business.BUSINESS_TYPE_CHOICES
    )
    business_phone = serializers.CharField(write_only=True, required=False, max_length=20)
    business_address = serializers.CharField(write_only=True, required=False, max_length=200)
    business_city = serializers.CharField(write_only=True, required=False, max_length=100)
    
    # Personalización (logo y colores)
    logo = serializers.ImageField(write_only=True, required=False, allow_null=True)
    primary_color = serializers.CharField(write_only=True, required=False, max_length=7, default='#6366f1')
    secondary_color = serializers.CharField(write_only=True, required=False, max_length=7, default='#8b5cf6')
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password2', 'first_name', 'last_name', 'phone',
            'business_name', 'business_type', 'business_phone', 
            'business_address', 'business_city',
            'logo', 'primary_color', 'secondary_color'
        ]
    
    def validate(self, attrs):
        """Validar que las contraseñas coincidan"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Las contraseñas no coinciden"
            })
        return attrs

    def _get_free_plan(self):
        return SubscriptionPlan.objects.get_or_create(
            plan_type='free',
            defaults={
                'name': 'Plan Gratuito',
                'slug': 'free',
                'price_monthly': Decimal('0.00'),
                'price_yearly': Decimal('0.00'),
                'max_appointments_per_month': 50,
                'max_professionals': 1,
                'max_services': 3,
                'max_clients': 50,
                'has_public_portal': True,
                'has_email_notifications': True,
                'has_sms_notifications': False,
                'has_whatsapp_notifications': False,
                'has_analytics': False,
                'has_ai_insights': False,
                'has_custom_domain': False,
                'has_api_access': False,
                'has_priority_support': False,
                'description': 'Plan gratuito creado automaticamente para el registro inicial.',
                'is_active': True,
            },
        )[0]
    
    @transaction.atomic
    def create(self, validated_data):
        """
        Crear usuario y negocio en una transacción atómica.
        
        Flujo:
        1. Crear Business con datos proporcionados
        2. Crear User con role='business_owner' y business=<el creado>
        3. Crear Subscription gratuita por 30 días
        
        ⚠️ Solo para business_owner. Otros roles se crean diferente.
        """
        # Extraer datos del negocio
        business_name = validated_data.pop('business_name')
        business_type = validated_data.pop('business_type')
        business_phone = validated_data.pop('business_phone', '')
        business_address = validated_data.pop('business_address', '')
        business_city = validated_data.pop('business_city', '')
        
        # Extraer personalización
        logo = validated_data.pop('logo', None)
        primary_color = validated_data.pop('primary_color', '#6366f1')
        secondary_color = validated_data.pop('secondary_color', '#8b5cf6')
        
        # Remover password2
        validated_data.pop('password2')
        
        # Crear el negocio primero
        from django.utils.text import slugify
        import uuid
        
        base_slug = slugify(business_name)
        slug = base_slug
        counter = 1
        while Business.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Obtener plan gratuito
        free_plan = self._get_free_plan()
        
        business = Business.objects.create(
            name=business_name,
            slug=slug,
            business_type=business_type,
            phone=business_phone,
            address=business_address,
            city=business_city,
            logo=logo,
            primary_color=primary_color,
            secondary_color=secondary_color,
            current_plan=free_plan,
            is_active=True
        )
        
        # Crear subscripción
        from datetime import date, timedelta
        Subscription.objects.create(
            business=business,
            plan=free_plan,
            status='trial',
            trial_end_date=date.today() + timedelta(days=30)
        )
        
        # Crear usuario
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role='business_owner',
            business=business
        )
        
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )


# =============================================================================
# SUBSCRIPTION PLAN SERIALIZERS
# =============================================================================

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer para planes de subscripción"""
    
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


# =============================================================================
# BUSINESS SERIALIZERS
# =============================================================================

class BusinessSerializer(serializers.ModelSerializer):
    """Serializer completo para Business"""
    current_plan_details = SubscriptionPlanSerializer(source='current_plan', read_only=True)
    users_count = serializers.SerializerMethodField()
    
    def get_users_count(self, obj):
        """Retorna la cantidad de usuarios del negocio"""
        return obj.users.count()
    
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'slug', 'business_type', 'description',
            'logo', 'email', 'phone', 'whatsapp',
            'address', 'city', 'state', 'country', 'postal_code',
            'website', 'instagram', 'facebook', 'tiktok',
            'primary_color', 'secondary_color',
            'business_hours', 'timezone', 'currency',
            'buffer_time', 'booking_min_notice_hours', 'booking_max_days_ahead',
            'allow_online_booking', 'require_payment_to_book',
            'cancellation_policy',
            'current_plan', 'current_plan_details', 'users_count',
            'is_active', 'is_verified', 'onboarding_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'is_verified', 'users_count']


class BusinessUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualización parcial del negocio"""
    
    class Meta:
        model = Business
        fields = [
            'name', 'description', 'logo', 'email', 'phone', 'whatsapp',
            'address', 'city', 'state', 'country', 'postal_code',
            'website', 'instagram', 'facebook', 'tiktok',
            'primary_color', 'secondary_color',
            'business_hours', 'timezone', 'currency',
            'buffer_time', 'booking_min_notice_hours', 'booking_max_days_ahead',
            'allow_online_booking', 'require_payment_to_book',
            'cancellation_policy',
            'onboarding_completed'
        ]
    
    def validate_logo(self, value):
        """
        Validar el archivo de logo antes de procesarlo.
        
        Validaciones:
        - Tamaño máximo: 5MB
        - Formatos permitidos: JPG, PNG, WebP, AVIF
        """
        if value:
            # Validar tamaño (5MB máximo)
            max_size = 5 * 1024 * 1024  # 5MB en bytes
            if value.size > max_size:
                raise serializers.ValidationError(
                    f'El archivo es demasiado grande. Tamaño máximo: 5MB. '
                    f'Tu archivo: {value.size / (1024*1024):.2f}MB'
                )
            
            # Validar formato de imagen
            valid_mime_types = [
                'image/jpeg',
                'image/jpg', 
                'image/png',
                'image/webp',
                'image/avif'
            ]
            
            if hasattr(value, 'content_type'):
                if value.content_type not in valid_mime_types:
                    raise serializers.ValidationError(
                        f'Formato de imagen no soportado: {value.content_type}. '
                        f'Formatos permitidos: JPG, PNG, WebP, AVIF'
                    )
            
            # Validar que sea una imagen válida usando Pillow
            try:
                from PIL import Image
                import io
                
                # Leer el contenido en memoria para validación sin cerrar el archivo original
                file_content = value.read()
                value.seek(0)  # Resetear el puntero para que Django pueda leer el archivo después
                
                # Validar usando una copia en memoria (BytesIO)
                # Esto evita cerrar el file handle original
                image = Image.open(io.BytesIO(file_content))
                
                # Verificar formato
                if image.format not in ['JPEG', 'PNG', 'WEBP', 'AVIF']:
                    raise serializers.ValidationError(
                        f'Formato de imagen no soportado: {image.format}. '
                        f'Formatos permitidos: JPEG, PNG, WEBP, AVIF'
                    )
                
                # No necesitamos cerrar porque BytesIO se limpia automáticamente
                # y no afecta al archivo original
                
            except serializers.ValidationError:
                # Re-lanzar errores de validación
                raise
            except Exception as e:
                # Resetear el puntero en caso de error
                value.seek(0)
                raise serializers.ValidationError(
                    f'Error al procesar la imagen: {str(e)}. '
                    f'Asegúrate de que el archivo sea una imagen válida.'
                )
        
        return value


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer para subscripciones"""
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'business', 'business_name', 'plan', 'plan_details',
            'status', 'start_date', 'end_date', 'trial_end_date',
            'stripe_subscription_id', 'mercadopago_subscription_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# =============================================================================
# SERVICE SERIALIZERS
# =============================================================================

class ServiceSerializer(serializers.ModelSerializer):
    """Serializer para servicios"""
    
    class Meta:
        model = Service
        fields = [
            'id', 'business', 'name', 'description',
            'price', 'duration', 'color', 'image',
            'is_active', 'allow_online_booking',
            'requires_deposit', 'deposit_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'business', 'created_at', 'updated_at']


# =============================================================================
# PROFESSIONAL SERIALIZERS
# =============================================================================

class ProfessionalSerializer(serializers.ModelSerializer):
    """
    Serializer para profesionales con creación de usuario.
    
    Al crear:
    - Si se proporciona 'user_data' (dict con email, password, etc.), crea el usuario
    - Asigna el rol 'professional' al usuario
    - Vincula el usuario al profesional
    
    Al actualizar:
    - Solo actualiza campos del profesional
    - No modifica el usuario asociado
    """
    user = UserSerializer(read_only=True)  # Para lectura
    
    # Campos para crear usuario (write_only)
    user_email = serializers.EmailField(write_only=True, required=False)
    user_password = serializers.CharField(write_only=True, required=False, min_length=8)
    user_first_name = serializers.CharField(write_only=True, required=False)
    user_last_name = serializers.CharField(write_only=True, required=False)
    user_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    services = ServiceSerializer(many=True, read_only=True)
    services_ids = serializers.PrimaryKeyRelatedField(
        source='services',
        many=True,
        queryset=Service.objects.all(),
        write_only=True,
        required=False
    )
    
    # Campo computed: specialty desde specialties
    specialty = serializers.CharField(source='specialties', required=False, allow_blank=True)
    
    # Hacer name opcional - se generará automáticamente si no se proporciona
    name = serializers.CharField(required=False, max_length=200)
    
    class Meta:
        model = Professional
        fields = [
            'id', 'user', 'business',
            'user_email', 'user_password', 'user_first_name', 'user_last_name', 'user_phone',
            'name', 'email', 'phone', 'avatar',
            'title', 'bio', 'specialties', 'specialty',
            'services', 'services_ids',
            'working_hours', 'color',
            'is_active', 'accepts_online_bookings',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'business', 'created_at', 'updated_at']
    
    @transaction.atomic
    def create(self, validated_data):
        """Crear profesional y opcionalmente su usuario"""
        # Extraer datos del usuario
        user_email = validated_data.pop('user_email', None)
        user_password = validated_data.pop('user_password', None)
        user_first_name = validated_data.pop('user_first_name', None)
        user_last_name = validated_data.pop('user_last_name', None)
        user_phone = validated_data.pop('user_phone', None)
        
        services = validated_data.pop('services', [])
        
        # El business DEBE venir del perform_create del ViewSet
        if 'business' not in validated_data:
            raise ValueError("Business no está en validated_data.")
        
        business = validated_data['business']
        
        # Crear usuario si se proporcionaron credenciales
        user = None
        if user_email and user_password:
            # Validar que el email no exista
            if User.objects.filter(email=user_email).exists():
                raise serializers.ValidationError({
                    'user_email': f'Ya existe un usuario con el email {user_email}'
                })
            
            # Generar username único desde el email (antes del @)
            username_base = user_email.split('@')[0]
            username = username_base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{username_base}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=user_email,
                password=user_password,
                first_name=user_first_name or '',
                last_name=user_last_name or '',
                phone=user_phone or '',
                role='professional',
                business=business
            )
            
            # Si no se especificó name/email/phone en professional, usar del usuario
            if not validated_data.get('name'):
                validated_data['name'] = f"{user.first_name} {user.last_name}".strip()
            if not validated_data.get('email'):
                validated_data['email'] = user.email
            if not validated_data.get('phone'):
                validated_data['phone'] = user.phone
        
        # Asegurar que al menos haya un 'name' (requerido por el modelo)
        if not validated_data.get('name'):
            validated_data['name'] = 'Profesional sin nombre'
        
        # Crear profesional
        professional = Professional.objects.create(user=user, **validated_data)
        
        # Asignar servicios
        if services:
            professional.services.set(services)
        
        return professional


# =============================================================================
# AVAILABILITY SERIALIZERS (Bloque 8)
# =============================================================================

class AvailabilityRuleSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source='professional.name', read_only=True)

    class Meta:
        model = AvailabilityRule
        fields = [
            'id', 'business', 'professional', 'professional_name',
            'weekday', 'start_time', 'end_time',
            'is_active', 'is_online_bookable', 'priority',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'business', 'created_at', 'updated_at', 'professional_name']

    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        professional = attrs.get('professional')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError('La hora final debe ser mayor que la hora inicial.')

        business = self.context['request'].user.business if self.context.get('request') else None
        if professional and business and professional.business_id != business.id:
            raise serializers.ValidationError('El profesional no pertenece a tu negocio.')

        return attrs


class AvailabilityExceptionSerializer(serializers.ModelSerializer):
    professional_name = serializers.CharField(source='professional.name', read_only=True)

    class Meta:
        model = AvailabilityException
        fields = [
            'id', 'business', 'professional', 'professional_name',
            'date', 'start_time', 'end_time',
            'exception_type', 'reason', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'business', 'created_at', 'updated_at', 'professional_name']

    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        professional = attrs.get('professional')

        if bool(start_time) != bool(end_time):
            raise serializers.ValidationError('Debes indicar start_time y end_time juntos o dejar ambos vacíos.')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError('La hora final debe ser mayor que la hora inicial.')

        business = self.context['request'].user.business if self.context.get('request') else None
        if professional and business and professional.business_id != business.id:
            raise serializers.ValidationError('El profesional no pertenece a tu negocio.')

        return attrs
    
    def update(self, instance, validated_data):
        """Actualizar profesional (sin modificar usuario asociado)"""
        # Remover campos de usuario si vienen (no se pueden actualizar)
        validated_data.pop('user_email', None)
        validated_data.pop('user_password', None)
        validated_data.pop('user_first_name', None)
        validated_data.pop('user_last_name', None)
        validated_data.pop('user_phone', None)
        
        services = validated_data.pop('services', None)
        
        # Actualizar campos del profesional
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar servicios si se proporcionaron
        if services is not None:
            instance.services.set(services)
        
        return instance


# =============================================================================
# CLIENT SERIALIZERS
# =============================================================================

class ClientSerializer(serializers.ModelSerializer):
    """Serializer para clientes"""
    
    class Meta:
        model = Client
        fields = [
            'id', 'business', 'name', 'email', 'phone',
            'birth_date', 'address', 'notes',
            'accepts_marketing', 'referral_source',
            'total_appointments', 'total_spent', 'last_visit',
            'is_active', 'is_vip',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'business', 'total_appointments', 'total_spent', 
            'last_visit', 'created_at', 'updated_at'
        ]


class ClientCreateSerializer(serializers.ModelSerializer):
    """Serializer simplificado para crear clientes rápidamente"""
    
    class Meta:
        model = Client
        fields = ['name', 'email', 'phone', 'notes']


# =============================================================================
# PLATFORM ADMIN SERIALIZERS (Super Admin Only)
# =============================================================================

class BusinessStatsSerializer(serializers.ModelSerializer):
    """
    Serializer con estadísticas completas del negocio para el Platform Admin.
    Solo accesible por super_admin.
    """
    # Estadísticas calculadas
    total_users = serializers.SerializerMethodField()
    total_services = serializers.SerializerMethodField()
    total_professionals = serializers.SerializerMethodField()
    total_clients = serializers.SerializerMethodField()
    current_plan_name = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'slug', 'business_type', 'email', 'phone',
            'primary_color', 'secondary_color', 'logo',
            'is_active', 'is_verified', 'created_at', 'updated_at',
            'address', 'city', 'country', 'timezone',
            'current_plan_name', 'subscription_status',
            'total_users', 'total_services', 'total_professionals', 'total_clients'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_total_users(self, obj):
        """Número total de usuarios del negocio"""
        return User.objects.filter(business=obj).count()
    
    def get_total_services(self, obj):
        """Número total de servicios"""
        return obj.services.count()
    
    def get_total_professionals(self, obj):
        """Número total de profesionales"""
        return obj.professionals.count()
    
    def get_total_clients(self, obj):
        """Número total de clientes"""
        return obj.clients.count()
    
    def get_current_plan_name(self, obj):
        """Nombre del plan actual"""
        try:
            subscription = Subscription.objects.get(business=obj, is_active=True)
            return subscription.plan.name
        except Subscription.DoesNotExist:
            return "Sin plan"
    
    def get_subscription_status(self, obj):
        """Estado de la subscripción"""
        try:
            subscription = Subscription.objects.get(business=obj, is_active=True)
            if subscription.is_trial:
                days_left = (subscription.end_date - timezone.now().date()).days
                return f"Prueba ({days_left} días restantes)"
            elif subscription.is_active:
                return "Activa"
            else:
                return "Expirada"
        except Subscription.DoesNotExist:
            return "Sin suscripción"


# =============================================================================
# ONBOARDING PROGRESS SERIALIZERS (Bloque 5)
# =============================================================================

class OnboardingProgressSerializer(serializers.ModelSerializer):
    """
    Serializer para el progreso de onboarding.
    
    Incluye:
    - Todos los pasos del onboarding
    - Porcentaje de completitud calculado
    - Listas de pasos pendientes y completados
    """
    
    completion_percentage = serializers.ReadOnlyField()
    pending_steps = serializers.ReadOnlyField()
    completed_steps = serializers.ReadOnlyField()
    business_name = serializers.CharField(source='business.name', read_only=True)
    
    class Meta:
        model = OnboardingProgress
        fields = [
            'id',
            'business',
            'business_name',
            'has_created_service',
            'has_configured_hours',
            'has_created_professional',
            'has_customized_branding',
            'has_created_first_appointment',
            'has_invited_team_member',
            'has_tested_public_booking',
            'is_completed',
            'is_dismissed',
            'completed_at',
            'completion_percentage',
            'pending_steps',
            'completed_steps',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'business',
            'is_completed',
            'completed_at',
            'created_at',
            'updated_at',
        ]


class OnboardingStepUpdateSerializer(serializers.Serializer):
    """
    Serializer para actualizar un paso específico del onboarding.
    """
    step_key = serializers.ChoiceField(choices=[
        'has_created_service',
        'has_configured_hours',
        'has_created_professional',
        'has_customized_branding',
        'has_created_first_appointment',
        'has_invited_team_member',
        'has_tested_public_booking',
    ])
    completed = serializers.BooleanField(default=True)
