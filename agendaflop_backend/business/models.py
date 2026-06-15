"""
=============================================================================
BUSINESS MODELS - Modelos Multi-Tenant y Sistema de Planes
=============================================================================

Sistema completo para gestión de negocios con:
- Multi-tenant (múltiples negocios en una app)
- Sistema de planes/subscripciones (Free → Basic → Pro → Premium)
- Usuarios con roles
- Servicios configurables
- Profesionales/recursos
- Clientes (CRM básico)

=============================================================================
"""

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils.text import slugify
import uuid


# =============================================================================
# CUSTOM USER MANAGER - Manager personalizado para autenticación con email
# =============================================================================

class CustomUserManager(BaseUserManager):
    """
    Manager personalizado para el modelo User.
    Permite crear usuarios con email en lugar de username.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Crear y guardar un usuario regular con email y password.
        """
        if not email:
            raise ValueError('El email es obligatorio')
        
        email = self.normalize_email(email)
        
        # Si no se proporciona username, usar el email
        if 'username' not in extra_fields:
            extra_fields['username'] = email
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crear y guardar un superusuario con email y password.
        
        IMPORTANTE: Los super_admin NO deben tener business asignado.
        Son administradores de la plataforma, no de un negocio específico.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'super_admin')
        
        # CRÍTICO: super_admin NUNCA debe tener business
        extra_fields['business'] = None
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


# =============================================================================
# USER MODEL - Usuario Extendido
# =============================================================================

class User(AbstractUser):
    """
    Usuario extendido con roles y relación a negocio.
    
    Roles:
    - super_admin: Admin de la plataforma (tú)
    - business_owner: Dueño del negocio
    - manager: Gerente/administrador del negocio
    - professional: Profesional que da servicios
    - receptionist: Recepcionista (solo agenda, no configura)
    """
    
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrador'),
        ('business_owner', 'Dueño del Negocio'),
        ('manager', 'Gerente'),
        ('professional', 'Profesional'),
        ('receptionist', 'Recepcionista'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='business_owner')
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    business = models.ForeignKey('Business', on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    
    # Configuración de autenticación
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)  # Hacer username opcional
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']  # Removido 'username' de aquí
    
    # Usar el manager personalizado
    objects = CustomUserManager()
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['business', 'role']),
            models.Index(fields=['is_active']),
        ]
    
    def clean(self):
        """
        Validar coherencia entre rol y business según arquitectura multi-tenant.
        
        Reglas:
        - super_admin: NO debe tener business (admin de la plataforma)
        - business_owner: Crea su propio business en el registro
        - manager, professional, receptionist: DEBEN pertenecer a un business
        """
        super().clean()
        
        # Validación 1: super_admin NO puede tener business
        if self.role == 'super_admin' and self.business is not None:
            raise ValidationError({
                'business': 'Los super_admin no pueden tener un negocio asignado. '
                           'Son administradores de la plataforma, no de un negocio específico.'
            })
        
        # Validación 2: Roles de negocio DEBEN tener business (excepto en creación)
        if self.role in ['manager', 'professional', 'receptionist']:
            if self.pk and self.business is None:  # Solo validar si el usuario ya existe
                raise ValidationError({
                    'business': f'Los usuarios con rol {self.get_role_display()} '
                               f'deben tener un negocio asignado.'
                })
    
    def save(self, *args, **kwargs):
        """
        Guardar usuario después de validar coherencia rol-business.
        """
        # Forzar business=None para super_admin antes de validar
        if self.role == 'super_admin':
            self.business = None
        
        # Validar antes de guardar
        self.full_clean()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.get_full_name() or self.email} ({self.get_role_display()})"


# =============================================================================
# SUBSCRIPTION PLAN MODEL - Planes de Subscripción
# =============================================================================

class SubscriptionPlan(models.Model):
    """
    Planes de subscripción para monetización.
    
    FREE: Funcionalidad básica, ideal para empezar
    BASIC: Portal público + emails ($15-20/mes)
    PRO: + SMS/WhatsApp + Analytics ($30-40/mes)
    PREMIUM: + IA + Integraciones + White-label ($60-80/mes)
    """
    
    PLAN_CHOICES = [
        ('free', 'Gratis'),
        ('basic', 'Básico'),
        ('pro', 'Profesional'),
        ('premium', 'Premium'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    plan_type = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    
    # Pricing
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Features limits
    max_appointments_per_month = models.IntegerField(default=100, help_text="0 = ilimitado")
    max_professionals = models.IntegerField(default=1)
    max_services = models.IntegerField(default=5)
    max_clients = models.IntegerField(default=100, help_text="0 = ilimitado")
    
    # Feature flags
    has_public_portal = models.BooleanField(default=True)
    has_email_notifications = models.BooleanField(default=True)
    has_sms_notifications = models.BooleanField(default=False)
    has_whatsapp_notifications = models.BooleanField(default=False)
    has_analytics = models.BooleanField(default=False)
    has_ai_insights = models.BooleanField(default=False)
    has_custom_domain = models.BooleanField(default=False)
    has_api_access = models.BooleanField(default=False)
    has_priority_support = models.BooleanField(default=False)
    
    # Metadata
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscription_plans'
        verbose_name = 'Plan de Subscripción'
        verbose_name_plural = 'Planes de Subscripción'
        ordering = ['price_monthly']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} (${self.price_monthly}/mes)"


# =============================================================================
# BUSINESS MODEL - Negocio (Multi-Tenant)
# =============================================================================

class Business(models.Model):
    """
    Negocio/Empresa - Unidad central del multi-tenant.
    Cada negocio es independiente con su configuración.
    """
    
    BUSINESS_TYPE_CHOICES = [
        ('salon', 'Salón de Belleza'),
        ('barber', 'Barbería'),
        ('spa', 'Spa'),
        ('clinic', 'Clínica'),
        ('gym', 'Gimnasio'),
        ('consulting', 'Consultoría'),
        ('other', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic info
    name = models.CharField(max_length=200, help_text="Nombre del negocio")
    slug = models.SlugField(max_length=200, unique=True, help_text="URL amigable: tuapp.com/slug")
    business_type = models.CharField(max_length=20, choices=BUSINESS_TYPE_CHOICES, default='other')
    description = models.TextField(blank=True, help_text="Descripción breve del negocio")
    
    # Contact
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Address
    address = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='México')
    postal_code = models.CharField(max_length=10, blank=True)
    
    # Branding
    logo = models.ImageField(upload_to='business_logos/', blank=True, null=True)
    primary_color = models.CharField(max_length=7, default='#6366f1', help_text="Color primario (hex)")
    secondary_color = models.CharField(max_length=7, default='#8b5cf6', help_text="Color secundario (hex)")
    
    # Social media
    instagram = models.CharField(max_length=100, blank=True)
    facebook = models.CharField(max_length=100, blank=True)
    tiktok = models.CharField(max_length=100, blank=True)
    
    # Business hours (JSON simple por ahora, puedes crear modelo separado después)
    business_hours = models.JSONField(default=dict, blank=True, help_text="{lun: '9:00-18:00', mar: ...}")
    
    # Settings
    timezone = models.CharField(max_length=50, default='America/Mexico_City')
    currency = models.CharField(max_length=3, default='MXN')
    buffer_time = models.IntegerField(default=0, help_text="Minutos entre citas")
    booking_min_notice_hours = models.IntegerField(default=2, help_text="Anticipación mínima para reservar")
    booking_max_days_ahead = models.IntegerField(default=60, help_text="Días máximos a futuro para reservar")
    allow_online_booking = models.BooleanField(default=True)
    require_payment_to_book = models.BooleanField(default=False)
    cancellation_policy = models.TextField(blank=True, help_text="Política de cancelación")
    
    # Subscription
    current_plan = models.ForeignKey(
        SubscriptionPlan, 
        on_delete=models.PROTECT, 
        related_name='businesses',
        null=True,
        blank=True
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False, help_text="Negocio verificado por admin")
    onboarding_completed = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'businesses'
        verbose_name = 'Negocio'
        verbose_name_plural = 'Negocios'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'created_at']),
            models.Index(fields=['current_plan']),
            models.Index(fields=['business_type']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    @property
    def public_url(self):
        """URL pública del portal de agendamiento"""
        return f"/book/{self.slug}"


# =============================================================================
# SUBSCRIPTION MODEL - Subscripción Activa
# =============================================================================

class Subscription(models.Model):
    """
    Subscripción activa de un negocio a un plan.
    """
    
    STATUS_CHOICES = [
        ('trial', 'Prueba'),
        ('active', 'Activa'),
        ('past_due', 'Pago Vencido'),
        ('cancelled', 'Cancelada'),
        ('expired', 'Expirada'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField(Business, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    
    # Dates
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    trial_end_date = models.DateField(null=True, blank=True)
    
    # Payment (para cuando integres Stripe/MercadoPago)
    stripe_subscription_id = models.CharField(max_length=200, blank=True, null=True)
    mercadopago_subscription_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
        verbose_name = 'Subscripción'
        verbose_name_plural = 'Subscripciones'
    
    def __str__(self):
        return f"{self.business.name} - {self.plan.name} ({self.get_status_display()})"


# =============================================================================
# SERVICE MODEL - Servicios del Negocio
# =============================================================================

class Service(models.Model):
    """
    Servicios que ofrece el negocio (corte, masaje, consulta, etc.)
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='services')
    
    # Basic info
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Pricing & Duration
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    duration = models.IntegerField(help_text="Duración en minutos", validators=[MinValueValidator(1)])
    
    # Visual
    color = models.CharField(max_length=7, default='#6366f1', help_text="Color para calendario (hex)")
    image = models.ImageField(upload_to='service_images/', blank=True, null=True)
    
    # Settings
    is_active = models.BooleanField(default=True)
    allow_online_booking = models.BooleanField(default=True)
    requires_deposit = models.BooleanField(default=False)
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'services'
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'
        ordering = ['business', 'name']
        unique_together = ['business', 'name']
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - ${self.price} ({self.duration} min)"


# =============================================================================
# PROFESSIONAL MODEL - Profesionales/Recursos
# =============================================================================

class Professional(models.Model):
    """
    Profesionales/empleados que dan servicios en el negocio.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='professionals')
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='professional_profile')
    
    # Basic info
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='professional_avatars/', blank=True, null=True)
    
    # Professional info
    title = models.CharField(max_length=100, blank=True, help_text="Ej: Estilista Senior")
    bio = models.TextField(blank=True)
    specialties = models.TextField(blank=True, help_text="Especialidades separadas por comas")
    
    # Services que ofrece (relación many-to-many)
    services = models.ManyToManyField(Service, related_name='professionals', blank=True)
    
    # Schedule (JSON simple por ahora)
    working_hours = models.JSONField(default=dict, blank=True, help_text="{lun: '9:00-18:00', ...}")
    
    # Visual
    color = models.CharField(max_length=7, default='#10b981', help_text="Color para calendario (hex)")
    
    # Settings
    is_active = models.BooleanField(default=True)
    accepts_online_bookings = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'professionals'
        indexes = [
            models.Index(fields=['business', 'is_active']),
            models.Index(fields=['user']),
        ]
        verbose_name = 'Profesional'
        verbose_name_plural = 'Profesionales'
        ordering = ['business', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.business.name})"


# =============================================================================
# AVAILABILITY MODELS - Reglas y excepciones de disponibilidad (Bloque 8)
# =============================================================================

class AvailabilityRule(models.Model):
    """
    Regla de disponibilidad por día de la semana.

    - Si professional es null: regla general del negocio.
    - Si professional tiene valor: regla específica del profesional.
    """

    WEEKDAY_CHOICES = [
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='availability_rules')
    professional = models.ForeignKey(
        Professional,
        on_delete=models.CASCADE,
        related_name='availability_rules',
        null=True,
        blank=True,
    )

    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    is_active = models.BooleanField(default=True)
    is_online_bookable = models.BooleanField(default=True)
    priority = models.IntegerField(default=0, help_text='Mayor prioridad se evalúa primero')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['business', 'weekday']),
            models.Index(fields=['professional', 'weekday']),
            models.Index(fields=['business', 'is_active']),
        ]
        db_table = 'availability_rules'
        verbose_name = 'Regla de Disponibilidad'
        verbose_name_plural = 'Reglas de Disponibilidad'
        ordering = ['business', 'professional', 'weekday', 'start_time']

    def clean(self):
        super().clean()
        if self.start_time >= self.end_time:
            raise ValidationError({'end_time': 'La hora final debe ser mayor que la hora inicial'})

        if self.professional and self.professional.business_id != self.business_id:
            raise ValidationError({'professional': 'El profesional no pertenece al negocio'})

    def __str__(self):
        scope = self.professional.name if self.professional else 'General'
        return f"{self.business.name} - {scope} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class AvailabilityException(models.Model):
    """
    Excepciones de disponibilidad para una fecha concreta.

    - blocked: bloquea rango/fecha.
    - available: habilita rango extra para esa fecha.
    """

    EXCEPTION_TYPE_CHOICES = [
        ('blocked', 'Bloqueado'),
        ('available', 'Disponible'),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='availability_exceptions')
    professional = models.ForeignKey(
        Professional,
        on_delete=models.CASCADE,
        related_name='availability_exceptions',
        null=True,
        blank=True,
    )

    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    exception_type = models.CharField(max_length=20, choices=EXCEPTION_TYPE_CHOICES, default='blocked')
    reason = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'availability_exceptions'
        verbose_name = 'Excepción de Disponibilidad'
        verbose_name_plural = 'Excepciones de Disponibilidad'
        ordering = ['-date', 'start_time']
        indexes = [
            models.Index(fields=['business', 'date']),
            models.Index(fields=['professional', 'date']),
        ]

    def clean(self):
        super().clean()
        if bool(self.start_time) != bool(self.end_time):
            raise ValidationError('Debes indicar start_time y end_time juntos o dejar ambos vacíos.')

        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({'end_time': 'La hora final debe ser mayor que la hora inicial'})

        if self.professional and self.professional.business_id != self.business_id:
            raise ValidationError({'professional': 'El profesional no pertenece al negocio'})

    def __str__(self):
        scope = self.professional.name if self.professional else 'General'
        return f"{self.business.name} - {scope} - {self.date} ({self.get_exception_type_display()})"


# =============================================================================
# CLIENT MODEL - Clientes del Negocio (CRM Básico)
# =============================================================================

class Client(models.Model):
    """
    Clientes del negocio - CRM básico para seguimiento.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='clients')
    
    # Basic info
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    
    # Additional info
    birth_date = models.DateField(blank=True, null=True)
    address = models.CharField(max_length=300, blank=True)
    notes = models.TextField(blank=True, help_text="Notas internas (preferencias, alergias, etc.)")
    
    # Marketing
    accepts_marketing = models.BooleanField(default=True)
    referral_source = models.CharField(max_length=100, blank=True, help_text="¿Cómo nos conoció?")
    
    # Stats (se calculan automáticamente)
    total_appointments = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_visit = models.DateField(blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_vip = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'clients'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['business', 'name']
        unique_together = ['business', 'phone']  # Evitar duplicados por teléfono
    
    def __str__(self):
        return f"{self.name} ({self.phone})"


# =============================================================================
# ONBOARDING PROGRESS MODEL - Seguimiento de Configuración Inicial (Bloque 5)
# =============================================================================

class OnboardingProgress(models.Model):
    """
    Modelo para trackear el progreso de onboarding de un negocio.
    
    Cada negocio tiene una instancia de este modelo que se crea automáticamente
    al registrarse. Se usa para mostrar un checklist de tareas pendientes
    y guiar al usuario en la configuración inicial.
    
    Pasos del onboarding:
    1. Crear al menos un servicio
    2. Configurar horarios de atención
    3. Agregar al menos un profesional
    4. Personalizar branding (logo, colores)
    5. Crear primera cita de prueba
    6. Invitar a un miembro del equipo (opcional)
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField(
        Business,
        on_delete=models.CASCADE,
        related_name='onboarding_progress',
        help_text='Negocio asociado a este progreso'
    )
    
    # =========================================================================
    # PASOS COMPLETADOS
    # =========================================================================
    
    has_created_service = models.BooleanField(
        'Servicio Creado',
        default=False,
        help_text='Ha creado al menos un servicio'
    )
    
    has_configured_hours = models.BooleanField(
        'Horarios Configurados',
        default=False,
        help_text='Ha configurado los horarios de atención'
    )
    
    has_created_professional = models.BooleanField(
        'Profesional Agregado',
        default=False,
        help_text='Ha agregado al menos un profesional'
    )
    
    has_customized_branding = models.BooleanField(
        'Branding Personalizado',
        default=False,
        help_text='Ha personalizado logo o colores'
    )
    
    has_created_first_appointment = models.BooleanField(
        'Primera Cita Creada',
        default=False,
        help_text='Ha creado su primera cita'
    )
    
    has_invited_team_member = models.BooleanField(
        'Miembro Invitado',
        default=False,
        help_text='Ha invitado a un miembro del equipo (opcional)'
    )
    
    has_tested_public_booking = models.BooleanField(
        'Portal Probado',
        default=False,
        help_text='Ha probado el portal de reservas público'
    )
    
    # =========================================================================
    # ESTADO DEL ONBOARDING
    # =========================================================================
    
    is_completed = models.BooleanField(
        'Onboarding Completado',
        default=False,
        help_text='Indica si el onboarding está completo'
    )
    
    is_dismissed = models.BooleanField(
        'Onboarding Omitido',
        default=False,
        help_text='Usuario decidió omitir el onboarding'
    )
    
    completed_at = models.DateTimeField(
        'Completado en',
        null=True,
        blank=True,
        help_text='Fecha y hora en que se completó el onboarding'
    )
    
    # =========================================================================
    # METADATA
    # =========================================================================
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'onboarding_progress'
        verbose_name = 'Progreso de Onboarding'
        verbose_name_plural = 'Progresos de Onboarding'
    
    def __str__(self):
        return f"{self.business.name} - {self.completion_percentage}% completado"
    
    # =========================================================================
    # MÉTODOS
    # =========================================================================
    
    @property
    def completion_percentage(self):
        """
        Calcula el porcentaje de completitud del onboarding.
        
        Pasos obligatorios (peso 1 cada uno):
        - Servicio creado
        - Horarios configurados
        - Profesional agregado
        - Primera cita creada
        
        Pasos opcionales (peso 0.5 cada uno):
        - Branding personalizado
        - Miembro invitado
        - Portal probado
        
        Returns:
            int: Porcentaje de 0 a 100
        """
        # Pasos obligatorios (4 pasos × 1 punto = 4 puntos)
        obligatory_steps = [
            self.has_created_service,
            self.has_configured_hours,
            self.has_created_professional,
            self.has_created_first_appointment,
        ]
        obligatory_score = sum(obligatory_steps)
        
        # Pasos opcionales (3 pasos × 0.5 puntos = 1.5 puntos)
        optional_steps = [
            self.has_customized_branding,
            self.has_invited_team_member,
            self.has_tested_public_booking,
        ]
        optional_score = sum(optional_steps) * 0.5
        
        # Total: 4 + 1.5 = 5.5 puntos máximos
        total_score = obligatory_score + optional_score
        max_score = 5.5
        
        percentage = int((total_score / max_score) * 100)
        return percentage
    
    @property
    def pending_steps(self):
        """
        Retorna lista de pasos pendientes con sus etiquetas.
        
        Returns:
            list: Lista de diccionarios con 'key', 'label', 'is_optional'
        """
        steps = [
            {
                'key': 'has_created_service',
                'label': 'Crear tu primer servicio',
                'is_optional': False,
                'completed': self.has_created_service
            },
            {
                'key': 'has_configured_hours',
                'label': 'Configurar horarios de atención',
                'is_optional': False,
                'completed': self.has_configured_hours
            },
            {
                'key': 'has_created_professional',
                'label': 'Agregar un profesional',
                'is_optional': False,
                'completed': self.has_created_professional
            },
            {
                'key': 'has_created_first_appointment',
                'label': 'Crear tu primera cita',
                'is_optional': False,
                'completed': self.has_created_first_appointment
            },
            {
                'key': 'has_customized_branding',
                'label': 'Personalizar tu marca (logo, colores)',
                'is_optional': True,
                'completed': self.has_customized_branding
            },
            {
                'key': 'has_invited_team_member',
                'label': 'Invitar a un miembro del equipo',
                'is_optional': True,
                'completed': self.has_invited_team_member
            },
            {
                'key': 'has_tested_public_booking',
                'label': 'Probar el portal de reservas público',
                'is_optional': True,
                'completed': self.has_tested_public_booking
            },
        ]
        
        return [step for step in steps if not step['completed']]
    
    @property
    def completed_steps(self):
        """
        Retorna lista de pasos completados.
        
        Returns:
            list: Lista de diccionarios con 'key', 'label'
        """
        steps = [
            {'key': 'has_created_service', 'label': 'Servicio creado', 'completed': self.has_created_service},
            {'key': 'has_configured_hours', 'label': 'Horarios configurados', 'completed': self.has_configured_hours},
            {'key': 'has_created_professional', 'label': 'Profesional agregado', 'completed': self.has_created_professional},
            {'key': 'has_created_first_appointment', 'label': 'Primera cita creada', 'completed': self.has_created_first_appointment},
            {'key': 'has_customized_branding', 'label': 'Branding personalizado', 'completed': self.has_customized_branding},
            {'key': 'has_invited_team_member', 'label': 'Miembro invitado', 'completed': self.has_invited_team_member},
            {'key': 'has_tested_public_booking', 'label': 'Portal probado', 'completed': self.has_tested_public_booking},
        ]
        
        return [step for step in steps if step['completed']]
    
    def mark_step_completed(self, step_key):
        """
        Marca un paso como completado y actualiza el estado general.
        
        Args:
            step_key (str): Nombre del campo a marcar como True
        
        Returns:
            bool: True si se actualizó correctamente
        """
        if hasattr(self, step_key):
            setattr(self, step_key, True)
            
            # Si todos los pasos obligatorios están completos, marcar como completado
            if self.completion_percentage == 100:
                from django.utils import timezone
                self.is_completed = True
                self.completed_at = timezone.now()
            
            self.save()
            return True
        return False
    
    def dismiss_onboarding(self):
        """
        Permite al usuario omitir el onboarding.
        """
        self.is_dismissed = True
        self.save()

