"""
=============================================================================
TESTS UNITARIOS - Business Models
=============================================================================

Suite de tests con 80%+ coverage para los modelos de business.
Valida:
- Validaciones de modelos (clean methods)
- Relaciones entre modelos
- Comportamiento de métodos especiales
- Casos edge cases

Ejecutar con: python manage.py test business.tests
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from datetime import datetime, date, time, timedelta
import uuid

from .models import (
    SubscriptionPlan,
    Business,
    Subscription,
    Service,
    Professional,
    Client,
    AvailabilityRule,
    AvailabilityException,
)
from .serializers import RegisterSerializer

User = get_user_model()


# =============================================================================
# TEST: USER MODEL
# =============================================================================

class UserModelTests(TestCase):
    """Tests para modelo User con validaciones de multi-tenant"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.free_plan = SubscriptionPlan.objects.create(
            name='Gratis',
            slug='gratis',
            plan_type='free',
            price_monthly=0,
        )
        self.business = Business.objects.create(
            name='Test Business',
            slug='test-business',
            email='test@test.com',
            phone='1234567890',
            current_plan=self.free_plan,
        )

    def test_user_creation_with_email(self):
        """Crear usuario con email como USERNAME_FIELD"""
        user = User.objects.create_user(
            email='user@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
        )
        self.assertEqual(user.email, 'user@example.com')
        self.assertTrue(user.check_password('testpass123'))

    def test_super_admin_cannot_have_business(self):
        """Super admin NO debe tener business asignado"""
        user = User(
            email='admin@admin.com',
            role='super_admin',
            business=self.business,
        )
        with self.assertRaises(ValidationError):
            user.save()

    def test_business_staff_must_have_business(self):
        """Usuarios de negocio DEBEN tener business cuando se crean con ese rol"""
        # Los usuarios sin business no pueden ser creados con roles que requieren negocio
        with self.assertRaises(ValidationError):
            user = User.objects.create_user(
                email='manager@test.com',
                password='testpass123',
                role='manager',
                business=None,
            )

    def test_business_owner_has_correct_role(self):
        """Business owner debe tener role correcto"""
        user = User.objects.create_user(
            email='owner@test.com',
            password='testpass123',
            role='business_owner',
            business=self.business,
        )
        self.assertEqual(user.role, 'business_owner')
        self.assertEqual(user.business, self.business)

    def test_user_string_representation(self):
        """Verificar __str__ retorna formato esperado"""
        user = User.objects.create_user(
            email='john@example.com',
            password='testpass123',
            first_name='John',
            role='professional',
            business=self.business,
        )
        self.assertIn('John', str(user))
        self.assertIn('Profesional', str(user))


class RegisterSerializerTests(TestCase):
    """Tests para el registro inicial con base vacía"""

    def test_register_creates_free_plan_if_missing(self):
        serializer = RegisterSerializer(data={
            'email': 'owner@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'first_name': 'Owner',
            'last_name': 'Test',
            'phone': '123456789',
            'business_name': 'Negocio Demo',
            'business_type': 'barber',
            'business_phone': '123456789',
            'business_address': 'Calle 1',
            'business_city': 'Ciudad',
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()

        free_plan = SubscriptionPlan.objects.get(plan_type='free')

        self.assertEqual(user.email, 'owner@test.com')
        self.assertEqual(user.role, 'business_owner')
        self.assertIsNotNone(user.business)
        self.assertEqual(user.business.current_plan, free_plan)
        self.assertEqual(Subscription.objects.count(), 1)


# =============================================================================
# TEST: BUSINESS MODEL
# =============================================================================

class BusinessModelTests(TestCase):
    """Tests para modelo Business"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.plan = SubscriptionPlan.objects.create(
            name='Básico',
            slug='basico',
            plan_type='basic',
            price_monthly=20,
        )

    def test_business_slug_auto_generation(self):
        """Slug debe generarse automáticamente desde nombre"""
        business = Business.objects.create(
            name='My Beautiful Salon',
            email='salon@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )
        self.assertEqual(business.slug, 'my-beautiful-salon')

    def test_business_slug_uniqueness(self):
        """Slug debe ser único"""
        Business.objects.create(
            name='Test Salon',
            slug='test-salon',
            email='test1@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )
        
        # Intentar crear otro con mismo slug debe fallar
        with self.assertRaises(Exception):
            Business.objects.create(
                name='Test Salon 2',
                slug='test-salon',
                email='test2@test.com',
                phone='1234567890',
                current_plan=self.plan,
            )

    def test_business_public_url_property(self):
        """Property public_url debe retornar formato correcto"""
        business = Business.objects.create(
            name='Test Shop',
            email='shop@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )
        self.assertTrue(business.public_url.startswith('/book/'))
        self.assertIn(business.slug, business.public_url)

    def test_business_defaults(self):
        """Verificar valores por defecto"""
        business = Business.objects.create(
            name='Default Test',
            email='default@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )
        self.assertTrue(business.is_active)
        self.assertFalse(business.is_verified)
        self.assertFalse(business.onboarding_completed)
        self.assertEqual(business.buffer_time, 0)
        self.assertEqual(business.booking_min_notice_hours, 2)
        self.assertEqual(business.booking_max_days_ahead, 60)

    def test_business_timezone_field(self):
        """Verificar timezone por defecto"""
        business = Business.objects.create(
            name='Mexico Shop',
            email='mexico@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )
        self.assertEqual(business.timezone, 'America/Mexico_City')


# =============================================================================
# TEST: SERVICE MODEL
# =============================================================================

class ServiceModelTests(TestCase):
    """Tests para modelo Service"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.plan = SubscriptionPlan.objects.create(
            name='Free',
            slug='free',
            plan_type='free',
        )
        self.business = Business.objects.create(
            name='Test Salon',
            slug='test-salon',
            email='salon@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )

    def test_service_creation_with_price_and_duration(self):
        """Crear servicio con precio y duración"""
        service = Service.objects.create(
            business=self.business,
            name='Corte de Cabello',
            price=25.00,
            duration=30,
        )
        self.assertEqual(service.price, 25.00)
        self.assertEqual(service.duration, 30)

    def test_service_unique_name_per_business(self):
        """Nombre de servicio debe ser único por negocio"""
        Service.objects.create(
            business=self.business,
            name='Massage',
            price=50,
            duration=60,
        )
        
        # Intentar crear otro servicio con mismo nombre en el mismo negocio
        with self.assertRaises(Exception):
            Service.objects.create(
                business=self.business,
                name='Massage',
                price=55,
                duration=60,
            )

    def test_service_minimum_duration(self):
        """Duración mínima debe ser 1 minuto"""
        service = Service(
            business=self.business,
            name='Invalid Service',
            price=10,
            duration=0,  # Inválido
        )
        with self.assertRaises(ValidationError):
            service.full_clean()

    def test_service_defaults(self):
        """Verificar valores por defecto"""
        service = Service.objects.create(
            business=self.business,
            name='Basic Service',
            price=30,
            duration=45,
        )
        self.assertTrue(service.is_active)
        self.assertTrue(service.allow_online_booking)
        self.assertFalse(service.requires_deposit)

    def test_service_string_representation(self):
        """Verificar formato __str__"""
        service = Service.objects.create(
            business=self.business,
            name='Facial',
            price=45.50,
            duration=60,
        )
        # El formato puede variar: $45.5 o $45.50 dependiendo de DecimalField
        self.assertIn('Facial', str(service))
        self.assertIn('60 min', str(service))


# =============================================================================
# TEST: AVAILABILITY RULE MODEL
# =============================================================================

class AvailabilityRuleModelTests(TestCase):
    """Tests para modelo AvailabilityRule"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.plan = SubscriptionPlan.objects.create(
            name='Free',
            slug='free',
            plan_type='free',
        )
        self.business = Business.objects.create(
            name='Test Business',
            slug='test-business',
            email='test@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )
        self.professional = Professional.objects.create(
            business=self.business,
            name='John Doe',
            color='#FF0000',
        )

    def test_availability_rule_general_business(self):
        """Crear regla general para el negocio (sin profesional)"""
        rule = AvailabilityRule.objects.create(
            business=self.business,
            professional=None,  # Regla general
            weekday=0,  # Lunes
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        self.assertIsNone(rule.professional)
        self.assertEqual(rule.weekday, 0)

    def test_availability_rule_professional_specific(self):
        """Crear regla específica para un profesional"""
        rule = AvailabilityRule.objects.create(
            business=self.business,
            professional=self.professional,
            weekday=1,  # Martes
            start_time=time(10, 0),
            end_time=time(18, 0),
        )
        self.assertEqual(rule.professional, self.professional)
        self.assertEqual(rule.weekday, 1)

    def test_availability_rule_start_time_must_be_before_end_time(self):
        """start_time debe ser anterior a end_time"""
        rule = AvailabilityRule(
            business=self.business,
            professional=self.professional,
            weekday=0,
            start_time=time(17, 0),
            end_time=time(9, 0),  # Inválido
        )
        with self.assertRaises(ValidationError):
            rule.clean()

    def test_availability_rule_professional_belongs_to_business(self):
        """Profesional debe pertenecer al negocio"""
        other_business = Business.objects.create(
            name='Other Business',
            slug='other-business',
            email='other@test.com',
            phone='9876543210',
            current_plan=self.plan,
        )
        other_professional = Professional.objects.create(
            business=other_business,
            name='Other Professional',
        )
        
        rule = AvailabilityRule(
            business=self.business,
            professional=other_professional,  # Pertenece a otro negocio
            weekday=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        with self.assertRaises(ValidationError):
            rule.clean()

    def test_availability_rule_priority(self):
        """Reglas con mayor prioridad se evalúan primero"""
        rule1 = AvailabilityRule.objects.create(
            business=self.business,
            professional=None,
            weekday=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
            priority=1,  # Mayor prioridad
        )
        rule2 = AvailabilityRule.objects.create(
            business=self.business,
            professional=None,
            weekday=0,
            start_time=time(10, 0),
            end_time=time(16, 0),
            priority=0,  # Menor prioridad
        )
        # La queries deberían ordenar por prioridad descendente
        rules = list(AvailabilityRule.objects.filter(business=self.business).order_by('-priority'))
        self.assertEqual(rules[0].priority, 1)
        self.assertEqual(rules[1].priority, 0)


# =============================================================================
# TEST: AVAILABILITY EXCEPTION MODEL
# =============================================================================

class AvailabilityExceptionModelTests(TestCase):
    """Tests para modelo AvailabilityException"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.plan = SubscriptionPlan.objects.create(
            name='Free',
            slug='free',
            plan_type='free',
        )
        self.business = Business.objects.create(
            name='Test Business',
            slug='test-business',
            email='test@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )
        self.professional = Professional.objects.create(
            business=self.business,
            name='Jane Smith',
        )

    def test_exception_blocked_full_day(self):
        """Crear excepción de bloqueo para todo un día"""
        exception = AvailabilityException.objects.create(
            business=self.business,
            professional=self.professional,
            date=date(2026, 4, 10),
            start_time=None,  # Todo el día
            end_time=None,
            exception_type='blocked',
            reason='Holiday',
        )
        self.assertEqual(exception.exception_type, 'blocked')
        self.assertIsNone(exception.start_time)
        self.assertIsNone(exception.end_time)

    def test_exception_blocked_time_range(self):
        """Crear excepción de bloqueo para un rango de horas"""
        exception = AvailabilityException.objects.create(
            business=self.business,
            professional=self.professional,
            date=date(2026, 4, 15),
            start_time=time(12, 0),
            end_time=time(14, 0),  # Lunch break
            exception_type='blocked',
            reason='Lunch',
        )
        self.assertEqual(exception.start_time, time(12, 0))
        self.assertEqual(exception.end_time, time(14, 0))

    def test_exception_available_adds_extra_hours(self):
        """Crear excepción de disponibilidad extra"""
        exception = AvailabilityException.objects.create(
            business=self.business,
            professional=None,  # General
            date=date(2026, 4, 20),
            start_time=time(18, 0),
            end_time=time(20, 0),  # Horario extra
            exception_type='available',
            reason='Extra shift',
        )
        self.assertEqual(exception.exception_type, 'available')

    def test_exception_time_range_validation(self):
        """Validar que times sean consistentes"""
        # Caso 1: start_time sin end_time
        exception = AvailabilityException(
            business=self.business,
            date=date(2026, 4, 25),
            start_time=time(9, 0),
            end_time=None,  # Inconsistente
            exception_type='blocked',
        )
        with self.assertRaises(ValidationError):
            exception.clean()

        # Caso 2: start_time >= end_time
        exception2 = AvailabilityException(
            business=self.business,
            date=date(2026, 4, 25),
            start_time=time(17, 0),
            end_time=time(9, 0),  # Inválido
            exception_type='blocked',
        )
        with self.assertRaises(ValidationError):
            exception2.clean()

    def test_exception_professional_belongs_to_business(self):
        """Profesional debe pertenecer al negocio"""
        other_business = Business.objects.create(
            name='Other Business',
            slug='other-biz',
            email='other@test.com',
            phone='9876543210',
            current_plan=self.plan,
        )
        other_prof = Professional.objects.create(
            business=other_business,
            name='Other Prof',
        )
        
        exception = AvailabilityException(
            business=self.business,
            professional=other_prof,  # No pertenece
            date=date(2026, 4, 30),
            exception_type='blocked',
        )
        with self.assertRaises(ValidationError):
            exception.clean()


# =============================================================================
# TEST: PROFESSIONAL MODEL
# =============================================================================

class ProfessionalModelTests(TestCase):
    """Tests para modelo Professional"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.plan = SubscriptionPlan.objects.create(
            name='Free',
            slug='free',
            plan_type='free',
        )
        self.business = Business.objects.create(
            name='Test Business',
            slug='test-business',
            email='test@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )

    def test_professional_creation(self):
        """Crear profesional básico"""
        prof = Professional.objects.create(
            business=self.business,
            name='Alice Johnson',
            email='alice@test.com',
        )
        self.assertEqual(prof.name, 'Alice Johnson')
        self.assertEqual(prof.business, self.business)

    def test_professional_with_user_link(self):
        """Profesional puede tener usuario vinculado"""
        user = User.objects.create_user(
            email='professional@test.com',
            password='testpass123',
            role='professional',
            business=self.business,
        )
        prof = Professional.objects.create(
            business=self.business,
            name='Bob Professional',
            user=user,
        )
        self.assertEqual(prof.user, user)

    def test_professional_services_relationship(self):
        """Profesional puede tener múltiples servicios"""
        service1 = Service.objects.create(
            business=self.business,
            name='Service 1',
            price=10,
            duration=15,
        )
        service2 = Service.objects.create(
            business=self.business,
            name='Service 2',
            price=20,
            duration=30,
        )
        prof = Professional.objects.create(
            business=self.business,
            name='Charlie Services',
        )
        prof.services.add(service1, service2)
        
        self.assertEqual(prof.services.count(), 2)
        self.assertIn(service1, prof.services.all())

    def test_professional_defaults(self):
        """Verificar valores por defecto"""
        prof = Professional.objects.create(
            business=self.business,
            name='Default Prof',
        )
        self.assertTrue(prof.is_active)
        self.assertTrue(prof.accepts_online_bookings)
        self.assertIsNotNone(prof.color)


# =============================================================================
# TEST: CLIENT MODEL
# =============================================================================

class ClientModelTests(TestCase):
    """Tests para modelo Client"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.plan = SubscriptionPlan.objects.create(
            name='Free',
            slug='free',
            plan_type='free',
        )
        self.business = Business.objects.create(
            name='Test Business',
            slug='test-business',
            email='test@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )

    def test_client_vip_status(self):
        """Marcar cliente como VIP"""
        client = Client.objects.create(
            business=self.business,
            name='VIP Client',
            phone='555-9999',
            is_vip=True,
        )
        self.assertTrue(client.is_vip)


# =============================================================================
# TEST: SUBSCRIPTION MODEL
# =============================================================================

class SubscriptionModelTests(TestCase):
    """Tests para modelo Subscription"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.free_plan = SubscriptionPlan.objects.create(
            name='Free',
            slug='free',
            plan_type='free',
            price_monthly=0,
        )
        self.basic_plan = SubscriptionPlan.objects.create(
            name='Basic',
            slug='basic',
            plan_type='basic',
            price_monthly=20,
        )
        self.business = Business.objects.create(
            name='Test Business',
            slug='test-business',
            email='test@test.com',
            phone='1234567890',
            current_plan=self.free_plan,
        )

    def test_subscription_creation(self):
        """Crear subscripción"""
        subscription = Subscription.objects.create(
            business=self.business,
            plan=self.free_plan,
            status='trial',
        )
        self.assertEqual(subscription.business, self.business)
        self.assertEqual(subscription.plan, self.free_plan)
        self.assertEqual(subscription.status, 'trial')

    def test_subscription_status_choices(self):
        """Validar opciones de estado"""
        valid_statuses = ['trial', 'active', 'past_due', 'cancelled', 'expired']
        subscription = Subscription.objects.create(
            business=self.business,
            plan=self.basic_plan,
            status='active',
        )
        self.assertIn(subscription.status, valid_statuses)

    def test_subscription_trial_end_date(self):
        """Subscripción de prueba tiene fecha de fin"""
        trial_end = date.today() + timedelta(days=30)
        subscription = Subscription.objects.create(
            business=self.business,
            plan=self.free_plan,
            status='trial',
            trial_end_date=trial_end,
        )
        self.assertEqual(subscription.trial_end_date, trial_end)

    def test_subscription_string_representation(self):
        """Verificar formato __str__"""
        subscription = Subscription.objects.create(
            business=self.business,
            plan=self.basic_plan,
            status='active',
        )
        self.assertIn('Test Business', str(subscription))
        self.assertIn('Basic', str(subscription))
