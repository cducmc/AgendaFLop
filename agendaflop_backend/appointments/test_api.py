"""
=============================================================================
TESTS API - Endpoints Principales
=============================================================================

Suite de tests de integración para endpoints API.
Valida:
- Autenticación y permisos (403, 401)
- Respuestas exitosas (200, 201)
- Validación de datos (400)
- CRUD operations completo

Ejecutar con: python manage.py test appointments.test_api
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, time, timedelta

from business.models import (
    SubscriptionPlan,
    Business,
    Service,
    Professional,
    Client,
    AvailabilityRule,
    AvailabilityException,
)
from appointments.models import Appointment

User = get_user_model()


# =============================================================================
# TEST: AVAILABILITY API
# =============================================================================

class AvailabilityRuleAPITests(TestCase):
    """Tests para endpoints de Availability Rules"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.client = APIClient()
        
        # Crear plan
        self.plan = SubscriptionPlan.objects.create(
            name='Free',
            slug='free',
            plan_type='free',
        )
        
        # Crear negocio
        self.business = Business.objects.create(
            name='Test Business',
            slug='test-business',
            email='test@test.com',
            phone='1234567890',
            current_plan=self.plan,
        )
        
        # Crear usuarios
        self.owner = User.objects.create_user(
            email='owner@test.com',
            password='testpass123',
            role='business_owner',
            business=self.business,
        )
        
        self.professional_user = User.objects.create_user(
            email='prof@test.com',
            password='testpass123',
            role='professional',
            business=self.business,
        )
        
        # Crear profesional
        self.professional = Professional.objects.create(
            business=self.business,
            name='John Professional',
            user=self.professional_user,
        )

    def test_create_availability_rule_authenticated(self):
        """Crear regla de disponibilidad como usuario autenticado"""
        self.client.force_authenticate(user=self.owner)
        
        data = {
            'weekday': 0,  # Lunes
            'start_time': '09:00',
            'end_time': '17:00',
            'is_active': True,
            'is_online_bookable': True,
        }
        
        response = self.client.post('/api/availability-rules/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AvailabilityRule.objects.count(), 1)

    def test_create_availability_rule_unauthenticated(self):
        """No se puede crear regla sin autenticación"""
        data = {
            'weekday': 0,
            'start_time': '09:00',
            'end_time': '17:00',
        }
        
        response = self.client.post('/api/availability-rules/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_availability_rules_owned_business(self):
        """Listar solo reglas del negocio propio"""
        # Crear regla
        AvailabilityRule.objects.create(
            business=self.business,
            professional=self.professional,
            weekday=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/availability-rules/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_availability_rules_filter_by_weekday(self):
        """Filtrar reglas por día de semana"""
        AvailabilityRule.objects.create(
            business=self.business,
            weekday=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        AvailabilityRule.objects.create(
            business=self.business,
            weekday=1,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/availability-rules/?weekday=0', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_update_availability_rule(self):
        """Actualizar una regla de disponibilidad"""
        rule = AvailabilityRule.objects.create(
            business=self.business,
            weekday=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        
        self.client.force_authenticate(user=self.owner)
        
        data = {
            'start_time': '10:00',
            'end_time': '18:00',
        }
        
        response = self.client.patch(f'/api/availability-rules/{rule.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        rule.refresh_from_db()
        self.assertEqual(rule.start_time, time(10, 0))

    def test_delete_availability_rule(self):
        """Eliminar una regla de disponibilidad"""
        rule = AvailabilityRule.objects.create(
            business=self.business,
            weekday=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f'/api/availability-rules/{rule.id}/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(AvailabilityRule.objects.count(), 0)

    def test_invalid_rule_validation_error(self):
        """Validar error cuando start_time >= end_time"""
        self.client.force_authenticate(user=self.owner)
        
        data = {
            'weekday': 0,
            'start_time': '17:00',
            'end_time': '09:00',  # Inválido
            'is_active': True,
        }
        
        response = self.client.post('/api/availability-rules/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AvailabilityExceptionAPITests(TestCase):
    """Tests para endpoints de Availability Exceptions"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.client = APIClient()
        
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
        
        self.owner = User.objects.create_user(
            email='owner@test.com',
            password='testpass123',
            role='business_owner',
            business=self.business,
        )
        
        self.professional = Professional.objects.create(
            business=self.business,
            name='Test Prof',
        )

    def test_create_exception_full_day_block(self):
        """Crear excepción de bloqueo para todo un día"""
        self.client.force_authenticate(user=self.owner)
        
        data = {
            'date': '2026-04-10',
            'exception_type': 'blocked',
            'reason': 'Holiday',
        }
        
        response = self.client.post('/api/availability-exceptions/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AvailabilityException.objects.count(), 1)

    def test_create_exception_time_range_block(self):
        """Crear excepción de bloqueo para rango de horas"""
        self.client.force_authenticate(user=self.owner)
        
        data = {
            'date': '2026-04-15',
            'start_time': '12:00',
            'end_time': '14:00',
            'exception_type': 'blocked',
            'reason': 'Lunch',
        }
        
        response = self.client.post('/api/availability-exceptions/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_exceptions_filter_by_date_range(self):
        """Listar excepciones filtrando por rango de fechas"""
        AvailabilityException.objects.create(
            business=self.business,
            date=date(2026, 4, 10),
            exception_type='blocked',
        )
        AvailabilityException.objects.create(
            business=self.business,
            date=date(2026, 4, 20),
            exception_type='blocked',
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(
            '/api/availability-exceptions/?date_from=2026-04-15&date_to=2026-04-25',
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_delete_exception(self):
        """Eliminar una excepción"""
        exception = AvailabilityException.objects.create(
            business=self.business,
            date=date(2026, 4, 10),
            exception_type='blocked',
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f'/api/availability-exceptions/{exception.id}/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(AvailabilityException.objects.count(), 0)


# =============================================================================
# TEST: SERVICES API
# =============================================================================

class ServiceAPITests(TestCase):
    """Tests para endpoints de Services"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.client = APIClient()
        
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
        
        self.owner = User.objects.create_user(
            email='owner@test.com',
            password='testpass123',
            role='business_owner',
            business=self.business,
        )

    def test_create_service(self):
        """Crear un servicio"""
        self.client.force_authenticate(user=self.owner)
        
        data = {
            'name': 'Haircut',
            'price': '25.00',
            'duration': 30,
        }
        
        response = self.client.post('/api/services/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Service.objects.count(), 1)

    def test_list_services_only_own_business(self):
        """Listar solo servicios del propio negocio"""
        Service.objects.create(
            business=self.business,
            name='Service 1',
            price=25,
            duration=30,
        )
        
        # Crear otro negocio y servicio
        other_business = Business.objects.create(
            name='Other Business',
            slug='other',
            email='other@test.com',
            phone='9876543210',
            current_plan=self.plan,
        )
        Service.objects.create(
            business=other_business,
            name='Service 2',
            price=50,
            duration=60,
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/services/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Service 1')

    def test_update_service(self):
        """Actualizar un servicio"""
        service = Service.objects.create(
            business=self.business,
            name='Original Name',
            price=25,
            duration=30,
        )
        
        self.client.force_authenticate(user=self.owner)
        
        data = {'name': 'Updated Name', 'price': '35.00'}
        response = self.client.patch(f'/api/services/{service.id}/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        service.refresh_from_db()
        self.assertEqual(service.name, 'Updated Name')

    def test_delete_service(self):
        """Eliminar un servicio"""
        service = Service.objects.create(
            business=self.business,
            name='To Delete',
            price=25,
            duration=30,
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f'/api/services/{service.id}/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Service.objects.count(), 0)


# =============================================================================
# TEST: PROFESSIONALS API
# =============================================================================

class ProfessionalAPITests(TestCase):
    """Tests para endpoints de Professionals"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.client = APIClient()
        
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
        
        self.owner = User.objects.create_user(
            email='owner@test.com',
            password='testpass123',
            role='business_owner',
            business=self.business,
        )

    def test_create_professional(self):
        """Crear un profesional"""
        self.client.force_authenticate(user=self.owner)
        
        data = {
            'name': 'John Stylist',
            'email': 'john@test.com',
            'title': 'Senior Stylist',
        }
        
        response = self.client.post('/api/professionals/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Professional.objects.count(), 1)

    def test_get_available_professionals(self):
        """Obtener solo profesionales que aceptan reservas online"""
        Professional.objects.create(
            business=self.business,
            name='Active Prof',
            is_active=True,
            accepts_online_bookings=True,
        )
        Professional.objects.create(
            business=self.business,
            name='Inactive Prof',
            is_active=False,
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/professionals/available/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Active Prof')

    def test_list_professionals_with_services(self):
        """Listar profesionales con sus servicios"""
        service = Service.objects.create(
            business=self.business,
            name='Haircut',
            price=25,
            duration=30,
        )
        
        prof = Professional.objects.create(
            business=self.business,
            name='Multi-service Prof',
        )
        prof.services.add(service)
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/professionals/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertGreater(len(response.data[0]['services']), 0)


# =============================================================================
# TEST: APPOINTMENTS API
# =============================================================================

class AppointmentAPITests(TestCase):
    """Tests para endpoints de Appointments"""

    def setUp(self):
        """Configurar datos de prueba"""
        self.client = APIClient()
        
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
        
        self.owner = User.objects.create_user(
            email='owner@test.com',
            password='testpass123',
            role='business_owner',
            business=self.business,
        )
        
        self.client_obj = Client.objects.create(
            business=self.business,
            name='John Client',
            phone='555-1234',
        )
        
        self.service = Service.objects.create(
            business=self.business,
            name='Haircut',
            price=25,
            duration=30,
        )
        
        self.professional = Professional.objects.create(
            business=self.business,
            name='John Stylist',
        )

    def test_create_appointment(self):
        """Crear una cita"""
        self.client.force_authenticate(user=self.owner)
        
        tomorrow = date.today() + timedelta(days=1)
        
        data = {
            'client': self.client_obj.id,
            'service': self.service.id,
            'professional': self.professional.id,
            'appointment_date': tomorrow.isoformat(),
            'appointment_time': '10:00',
        }
        
        response = self.client.post('/api/appointments/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_appointments_today(self):
        """Listar citas de hoy"""
        Appointment.objects.create(
            business=self.business,
            client=self.client_obj,
            service=self.service,
            professional=self.professional,
            appointment_date=date.today(),
            appointment_time=time(10, 0),
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/appointments/today/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_confirm_appointment(self):
        """Confirmar una cita"""
        appointment = Appointment.objects.create(
            business=self.business,
            client=self.client_obj,
            service=self.service,
            professional=self.professional,
            appointment_date=date.today() + timedelta(days=1),
            appointment_time=time(10, 0),
            status='pending',
        )
        
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f'/api/appointments/{appointment.id}/confirm/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'confirmed')

    def test_cancel_appointment(self):
        """Cancelar una cita con razón"""
        appointment = Appointment.objects.create(
            business=self.business,
            client=self.client_obj,
            service=self.service,
            professional=self.professional,
            appointment_date=date.today() + timedelta(days=1),
            appointment_time=time(10, 0),
        )
        
        self.client.force_authenticate(user=self.owner)
        
        data = {'cancellation_reason': 'Client requested'}
        response = self.client.post(
            f'/api/appointments/{appointment.id}/cancel/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'cancelled')
