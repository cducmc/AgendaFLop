from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from business.models import Business, Professional, Service, SubscriptionPlan


User = get_user_model()


class PublicPortalApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.plan = SubscriptionPlan.objects.create(
            name='Free',
            slug='free',
            plan_type='free',
        )

        self.business = Business.objects.create(
            name='Portal Test',
            slug='portal-test',
            email='portal@test.com',
            phone='5551112222',
            current_plan=self.plan,
            allow_online_booking=True,
        )

        self.service = Service.objects.create(
            business=self.business,
            name='Corte',
            price=200,
            duration=30,
            is_active=True,
            allow_online_booking=True,
        )

        self.professional = Professional.objects.create(
            business=self.business,
            name='Profesional 1',
            is_active=True,
            accepts_online_bookings=True,
        )
        self.professional.services.add(self.service)

    def test_public_business_detail(self):
        response = self.client.get('/api/public/businesses/portal-test/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'portal-test')

    def test_public_services_only_online(self):
        Service.objects.create(
            business=self.business,
            name='No Online',
            price=150,
            duration=20,
            is_active=True,
            allow_online_booking=False,
        )

        response = self.client.get('/api/public/businesses/portal-test/services/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Corte')

    def test_public_professionals_only_online(self):
        Professional.objects.create(
            business=self.business,
            name='No Online Pro',
            is_active=True,
            accepts_online_bookings=False,
        )

        response = self.client.get('/api/public/businesses/portal-test/professionals/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Profesional 1')

    def test_public_availability_requires_params(self):
        response = self.client.get('/api/public/businesses/portal-test/availability/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_public_create_appointment_success(self):
        response = self.client.post(
            '/api/public/businesses/portal-test/appointments/',
            {
                'service': str(self.service.id),
                'professional': str(self.professional.id),
                'appointment_date': (date.today() + timedelta(days=1)).isoformat(),
                'appointment_time': '10:00',
                'client_name': 'Cliente Demo',
                'client_phone': '5558889999',
                'client_email': 'cliente@demo.com',
                'notes': 'Primera cita',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('appointment', response.data)
        self.assertEqual(response.data['appointment']['client_name'], 'Cliente Demo')

    def test_public_create_appointment_rejects_foreign_service(self):
        other_business = Business.objects.create(
            name='Other Biz',
            slug='other-biz',
            email='other@test.com',
            phone='5556667777',
            current_plan=self.plan,
            allow_online_booking=True,
        )
        foreign_service = Service.objects.create(
            business=other_business,
            name='Foreign Service',
            price=120,
            duration=25,
            is_active=True,
            allow_online_booking=True,
        )

        response = self.client.post(
            '/api/public/businesses/portal-test/appointments/',
            {
                'service': str(foreign_service.id),
                'appointment_date': (date.today() + timedelta(days=2)).isoformat(),
                'appointment_time': '11:00',
                'client_name': 'Cliente Demo',
                'client_phone': '5551230000',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('service', response.data)
