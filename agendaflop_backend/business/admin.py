"""
=============================================================================
BUSINESS ADMIN - Administración de Modelos en Django Admin
=============================================================================
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, 
    SubscriptionPlan, 
    Business, 
    Subscription, 
    Service, 
    Professional, 
    Client
)


# =============================================================================
# USER ADMIN
# =============================================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Administración personalizada de usuarios"""
    
    list_display = ['username', 'email', 'get_full_name', 'role', 'business', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff', 'business']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información Adicional', {
            'fields': ('role', 'phone', 'avatar', 'business')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Información Adicional', {
            'fields': ('role', 'phone', 'business')
        }),
    )


# =============================================================================
# SUBSCRIPTION PLAN ADMIN
# =============================================================================

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    """Administración de planes de subscripción"""
    
    list_display = ['name', 'plan_type', 'price_monthly', 'price_yearly', 'is_active']
    list_filter = ['plan_type', 'is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'slug', 'plan_type', 'description', 'is_active')
        }),
        ('Precios', {
            'fields': ('price_monthly', 'price_yearly')
        }),
        ('Límites', {
            'fields': (
                'max_appointments_per_month',
                'max_professionals',
                'max_services',
                'max_clients'
            )
        }),
        ('Features', {
            'fields': (
                'has_public_portal',
                'has_email_notifications',
                'has_sms_notifications',
                'has_whatsapp_notifications',
                'has_analytics',
                'has_ai_insights',
                'has_custom_domain',
                'has_api_access',
                'has_priority_support'
            )
        }),
    )


# =============================================================================
# BUSINESS ADMIN
# =============================================================================

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    """Administración de negocios"""
    
    list_display = ['name', 'slug', 'business_type', 'email', 'phone', 'current_plan', 'is_active', 'created_at']
    list_filter = ['business_type', 'is_active', 'is_verified', 'onboarding_completed', 'current_plan']
    search_fields = ['name', 'slug', 'email', 'phone', 'city']
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'slug', 'business_type', 'description')
        }),
        ('Contacto', {
            'fields': ('email', 'phone', 'whatsapp', 'website')
        }),
        ('Dirección', {
            'fields': ('address', 'city', 'state', 'country', 'postal_code')
        }),
        ('Branding', {
            'fields': ('logo', 'primary_color', 'secondary_color')
        }),
        ('Redes Sociales', {
            'fields': ('instagram', 'facebook', 'tiktok')
        }),
        ('Configuración', {
            'fields': (
                'business_hours',
                'timezone',
                'currency',
                'buffer_time',
                'allow_online_booking',
                'require_payment_to_book',
                'cancellation_policy'
            )
        }),
        ('Subscripción', {
            'fields': ('current_plan',)
        }),
        ('Estado', {
            'fields': ('is_active', 'is_verified', 'onboarding_completed')
        }),
    )


# =============================================================================
# SUBSCRIPTION ADMIN
# =============================================================================

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """Administración de subscripciones activas"""
    
    list_display = ['business', 'plan', 'status', 'start_date', 'end_date', 'trial_end_date']
    list_filter = ['status', 'plan']
    search_fields = ['business__name']
    
    fieldsets = (
        ('Subscripción', {
            'fields': ('business', 'plan', 'status')
        }),
        ('Fechas', {
            'fields': ('start_date', 'end_date', 'trial_end_date')
        }),
        ('Información de Pago', {
            'fields': ('stripe_subscription_id', 'mercadopago_subscription_id')
        }),
    )


# =============================================================================
# SERVICE ADMIN
# =============================================================================

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Administración de servicios"""
    
    list_display = ['name', 'business', 'price', 'duration', 'is_active', 'allow_online_booking']
    list_filter = ['is_active', 'allow_online_booking', 'requires_deposit', 'business']
    search_fields = ['name', 'description', 'business__name']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('business', 'name', 'description')
        }),
        ('Precio y Duración', {
            'fields': ('price', 'duration')
        }),
        ('Visual', {
            'fields': ('color', 'image')
        }),
        ('Configuración', {
            'fields': ('is_active', 'allow_online_booking', 'requires_deposit', 'deposit_amount')
        }),
    )


# =============================================================================
# PROFESSIONAL ADMIN
# =============================================================================

@admin.register(Professional)
class ProfessionalAdmin(admin.ModelAdmin):
    """Administración de profesionales"""
    
    list_display = ['name', 'business', 'title', 'email', 'is_active', 'accepts_online_bookings']
    list_filter = ['is_active', 'accepts_online_bookings', 'business']
    search_fields = ['name', 'email', 'title', 'business__name']
    filter_horizontal = ['services']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('business', 'user', 'name', 'email', 'phone', 'avatar')
        }),
        ('Información Profesional', {
            'fields': ('title', 'bio', 'specialties', 'services')
        }),
        ('Horarios', {
            'fields': ('working_hours',)
        }),
        ('Visual', {
            'fields': ('color',)
        }),
        ('Configuración', {
            'fields': ('is_active', 'accepts_online_bookings')
        }),
    )


# =============================================================================
# CLIENT ADMIN
# =============================================================================

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Administración de clientes"""
    
    list_display = ['name', 'phone', 'email', 'business', 'total_appointments', 'total_spent', 'is_vip', 'last_visit']
    list_filter = ['is_active', 'is_vip', 'accepts_marketing', 'business']
    search_fields = ['name', 'email', 'phone', 'business__name']
    readonly_fields = ['total_appointments', 'total_spent', 'last_visit']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('business', 'name', 'email', 'phone')
        }),
        ('Información Adicional', {
            'fields': ('birth_date', 'address', 'notes')
        }),
        ('Marketing', {
            'fields': ('accepts_marketing', 'referral_source')
        }),
        ('Estadísticas', {
            'fields': ('total_appointments', 'total_spent', 'last_visit')
        }),
        ('Estado', {
            'fields': ('is_active', 'is_vip')
        }),
    )

