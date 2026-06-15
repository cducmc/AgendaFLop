"""
Management command para popular la base de datos con datos de ejemplo
Ejecutar: python manage.py populate_data
"""

from django.core.management.base import BaseCommand
from business.models import (
    User, 
    SubscriptionPlan, 
    Business, 
    Subscription, 
    Service, 
    Professional, 
    Client
)
from appointments.models import Appointment
from datetime import date, time, timedelta
from decimal import Decimal


class Command(BaseCommand):
    help = 'Popula la base de datos con datos de ejemplo'

    def handle(self, *args, **kwargs):
        self.stdout.write("🚀 Iniciando población de base de datos...")

        # =============================================================================
        # 1. PLANES DE SUBSCRIPCIÓN
        # =============================================================================

        self.stdout.write("\n📋 Creando planes de subscripción...")

        plans_data = [
            {
                'name': 'Plan Gratuito',
                'slug': 'free',
                'plan_type': 'free',
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
                'description': '✨ Perfecto para empezar. Gestiona hasta 50 citas mensuales con portal público y notificaciones por email.',
            },
            {
                'name': 'Plan Básico',
                'slug': 'basic',
                'plan_type': 'basic',
                'price_monthly': Decimal('19.99'),
                'price_yearly': Decimal('199.99'),
                'max_appointments_per_month': 200,
                'max_professionals': 3,
                'max_services': 10,
                'max_clients': 200,
                'has_public_portal': True,
                'has_email_notifications': True,
                'has_sms_notifications': True,
                'has_whatsapp_notifications': False,
                'has_analytics': True,
                'has_ai_insights': False,
                'has_custom_domain': False,
                'has_api_access': False,
                'has_priority_support': False,
                'description': '🚀 Para negocios en crecimiento. Incluye SMS, analytics básicos y hasta 3 profesionales.',
            },
            {
                'name': 'Plan Profesional',
                'slug': 'pro',
                'plan_type': 'pro',
                'price_monthly': Decimal('39.99'),
                'price_yearly': Decimal('399.99'),
                'max_appointments_per_month': 0,  # Ilimitado
                'max_professionals': 10,
                'max_services': 50,
                'max_clients': 0,  # Ilimitado
                'has_public_portal': True,
                'has_email_notifications': True,
                'has_sms_notifications': True,
                'has_whatsapp_notifications': True,
                'has_analytics': True,
                'has_ai_insights': False,
                'has_custom_domain': True,
                'has_api_access': True,
                'has_priority_support': True,
                'description': '💼 Para negocios consolidados. WhatsApp, dominio personalizado, API y analytics avanzados.',
            },
            {
                'name': 'Plan Premium',
                'slug': 'premium',
                'plan_type': 'premium',
                'price_monthly': Decimal('79.99'),
                'price_yearly': Decimal('799.99'),
                'max_appointments_per_month': 0,  # Ilimitado
                'max_professionals': 0,  # Ilimitado
                'max_services': 0,  # Ilimitado
                'max_clients': 0,  # Ilimitado
                'has_public_portal': True,
                'has_email_notifications': True,
                'has_sms_notifications': True,
                'has_whatsapp_notifications': True,
                'has_analytics': True,
                'has_ai_insights': True,
                'has_custom_domain': True,
                'has_api_access': True,
                'has_priority_support': True,
                'description': '🌟 Todo incluido. IA predictiva, insights automáticos, todo ilimitado y soporte prioritario 24/7.',
            }
        ]

        for plan_data in plans_data:
            plan, created = SubscriptionPlan.objects.get_or_create(
                plan_type=plan_data['plan_type'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✅ Creado: {plan.name}"))
            else:
                self.stdout.write(f"  ℹ️  Ya existe: {plan.name}")

        # =============================================================================
        # 2. NEGOCIO DE EJEMPLO
        # =============================================================================

        self.stdout.write("\n🏢 Creando negocio de ejemplo...")

        business_data = {
            'name': 'Salón Elegance',
            'slug': 'salon-elegance',
            'business_type': 'salon',
            'description': 'Tu salón de belleza de confianza. Más de 10 años embelleciendo a nuestros clientes.',
            'email': 'contacto@salonelegance.com',
            'phone': '+52 55 1234 5678',
            'whatsapp': '+52 55 1234 5678',
            'address': 'Av. Reforma 123, Col. Centro',
            'city': 'Ciudad de México',
            'state': 'CDMX',
            'country': 'México',
            'postal_code': '06000',
            'primary_color': '#8b5cf6',
            'secondary_color': '#ec4899',
            'instagram': '@salonelegance',
            'facebook': 'SalonEleganceMX',
            'business_hours': {
                'lunes': '9:00-19:00',
                'martes': '9:00-19:00',
                'miercoles': '9:00-19:00',
                'jueves': '9:00-19:00',
                'viernes': '9:00-20:00',
                'sabado': '10:00-18:00',
                'domingo': 'Cerrado',
            },
            'timezone': 'America/Mexico_City',
            'currency': 'MXN',
            'buffer_time': 10,
            'allow_online_booking': True,
            'cancellation_policy': 'Cancelaciones con al menos 24 horas de anticipación sin cargo. Cancelaciones tardías: 50% del servicio.',
            'is_active': True,
            'is_verified': True,
            'onboarding_completed': True,
        }

        free_plan = SubscriptionPlan.objects.get(plan_type='free')
        business, created = Business.objects.get_or_create(
            slug=business_data['slug'],
            defaults={**business_data, 'current_plan': free_plan}
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"  ✅ Negocio creado: {business.name}"))
            
            # Crear subscripción
            Subscription.objects.create(
                business=business,
                plan=free_plan,
                status='active',
                trial_end_date=date.today() + timedelta(days=30)
            )
            self.stdout.write(self.style.SUCCESS("  ✅ Subscripción activa (30 días de prueba)"))
        else:
            self.stdout.write(f"  ℹ️  Negocio ya existe: {business.name}")

        # =============================================================================
        # 3. SERVICIOS
        # =============================================================================

        self.stdout.write("\n💇 Creando servicios...")

        services_data = [
            {
                'name': 'Corte de Cabello',
                'description': 'Corte profesional con lavado y secado incluido',
                'price': Decimal('250.00'),
                'duration': 45,
                'color': '#6366f1',
                'is_active': True,
                'allow_online_booking': True,
            },
            {
                'name': 'Tinte Completo',
                'description': 'Aplicación de tinte con tratamiento de hidratación',
                'price': Decimal('800.00'),
                'duration': 120,
                'color': '#ec4899',
                'is_active': True,
                'allow_online_booking': True,
            },
            {
                'name': 'Manicure Spa',
                'description': 'Manicure completo con exfoliación y masaje',
                'price': Decimal('350.00'),
                'duration': 60,
                'color': '#10b981',
                'is_active': True,
                'allow_online_booking': True,
            },
        ]

        services = []
        for service_data in services_data:
            service, created = Service.objects.get_or_create(
                business=business,
                name=service_data['name'],
                defaults=service_data
            )
            services.append(service)
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✅ Servicio: {service.name} - ${service.price}"))
            else:
                self.stdout.write(f"  ℹ️  Ya existe: {service.name}")

        # =============================================================================
        # 4. PROFESIONALES
        # =============================================================================

        self.stdout.write("\n👨‍💼 Creando profesionales...")

        professionals_data = [
            {
                'name': 'María Fernández',
                'email': 'maria@salonelegance.com',
                'phone': '+52 55 1111 2222',
                'title': 'Estilista Senior',
                'bio': 'Más de 15 años de experiencia en corte y color. Especialista en balayage.',
                'specialties': 'Corte, Color, Tratamientos',
                'working_hours': {
                    'lunes': '9:00-18:00',
                    'martes': '9:00-18:00',
                    'miercoles': '9:00-18:00',
                    'jueves': '9:00-18:00',
                    'viernes': '9:00-19:00',
                    'sabado': '10:00-17:00',
                },
                'color': '#8b5cf6',
                'is_active': True,
                'accepts_online_bookings': True,
            },
            {
                'name': 'Carlos Mendoza',
                'email': 'carlos@salonelegance.com',
                'phone': '+52 55 3333 4444',
                'title': 'Especialista en Uñas',
                'bio': 'Certificado en nail art y técnicas avanzadas de manicure.',
                'specialties': 'Manicure, Pedicure, Nail Art',
                'working_hours': {
                    'lunes': '10:00-18:00',
                    'martes': 'Descanso',
                    'miercoles': '10:00-18:00',
                    'jueves': '10:00-18:00',
                    'viernes': '10:00-19:00',
                    'sabado': '10:00-18:00',
                },
                'color': '#10b981',
                'is_active': True,
                'accepts_online_bookings': True,
            }
        ]

        professionals = []
        for prof_data in professionals_data:
            prof, created = Professional.objects.get_or_create(
                business=business,
                name=prof_data['name'],
                defaults=prof_data
            )
            professionals.append(prof)
            
            # Asignar servicios a profesionales
            if prof.name == 'María Fernández':
                prof.services.add(services[0], services[1])  # Corte y Tinte
            else:
                prof.services.add(services[2])  # Manicure
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✅ Profesional: {prof.name} - {prof.title}"))
            else:
                self.stdout.write(f"  ℹ️  Ya existe: {prof.name}")

        # =============================================================================
        # 5. CLIENTES
        # =============================================================================

        self.stdout.write("\n👥 Creando clientes...")

        clients_data = [
            {
                'name': 'Ana García',
                'email': 'ana.garcia@email.com',
                'phone': '+52 55 9876 5432',
                'notes': 'Prefiere citas por la tarde. Alérgica a ciertos químicos.',
                'accepts_marketing': True,
                'referral_source': 'Instagram',
                'is_vip': True,
            },
            {
                'name': 'Luis Ramírez',
                'email': 'luis.ramirez@email.com',
                'phone': '+52 55 8765 4321',
                'notes': 'Cliente frecuente, viene cada 3 semanas.',
                'accepts_marketing': True,
                'referral_source': 'Recomendación',
                'is_vip': False,
            },
            {
                'name': 'Carmen López',
                'email': 'carmen.lopez@email.com',
                'phone': '+52 55 7654 3210',
                'notes': 'Prefiere a María para servicios de color.',
                'accepts_marketing': True,
                'referral_source': 'Google',
                'is_vip': False,
            },
            {
                'name': 'Pedro Sánchez',
                'email': 'pedro.sanchez@email.com',
                'phone': '+52 55 6543 2109',
                'accepts_marketing': False,
                'referral_source': 'Facebook',
                'is_vip': False,
            },
            {
                'name': 'Isabel Morales',
                'email': 'isabel.morales@email.com',
                'phone': '+52 55 5432 1098',
                'notes': 'Primera vez en el salón.',
                'accepts_marketing': True,
                'referral_source': 'Portal web',
                'is_vip': False,
            },
        ]

        clients = []
        for client_data in clients_data:
            client, created = Client.objects.get_or_create(
                business=business,
                phone=client_data['phone'],
                defaults=client_data
            )
            clients.append(client)
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✅ Cliente: {client.name}"))
            else:
                self.stdout.write(f"  ℹ️  Ya existe: {client.name}")

        # =============================================================================
        # 6. CITAS DE EJEMPLO
        # =============================================================================

        self.stdout.write("\n📅 Creando citas de ejemplo...")

        today = date.today()

        appointments_data = [
            # Citas pasadas (completadas) - Para demostración
            {
                'business': business,
                'client': clients[0],
                'service': services[0],
                'professional': professionals[0],
                'client_name': clients[0].name,
                'client_phone': clients[0].phone,
                'client_email': clients[0].email,
                'service_name': services[0].name,
                'service_duration': services[0].duration,
                'service_price': services[0].price,
                'appointment_date': today - timedelta(days=7),
                'appointment_time': time(10, 0),
                'status': 'completed',
                'notes': 'Cliente muy satisfecha con el resultado.',
            },
            {
                'business': business,
                'client': clients[1],
                'service': services[2],
                'professional': professionals[1],
                'client_name': clients[1].name,
                'client_phone': clients[1].phone,
                'service_name': services[2].name,
                'service_duration': services[2].duration,
                'service_price': services[2].price,
                'appointment_date': today - timedelta(days=5),
                'appointment_time': time(14, 0),
                'status': 'completed',
            },
            # Citas de hoy
            {
                'business': business,
                'client': clients[2],
                'service': services[1],
                'professional': professionals[0],
                'client_name': clients[2].name,
                'client_phone': clients[2].phone,
                'client_email': clients[2].email,
                'service_name': services[1].name,
                'service_duration': services[1].duration,
                'service_price': services[1].price,
                'appointment_date': today,
                'appointment_time': time(11, 0),
                'status': 'confirmed',
                'notes': 'Quiere tonos cálidos.',
            },
            {
                'business': business,
                'client': clients[3],
                'service': services[0],
                'professional': professionals[0],
                'client_name': clients[3].name,
                'client_phone': clients[3].phone,
                'service_name': services[0].name,
                'service_duration': services[0].duration,
                'service_price': services[0].price,
                'appointment_date': today,
                'appointment_time': time(15, 30),
                'status': 'pending',
            },
            # Citas futuras
            {
                'business': business,
                'client': clients[4],
                'service': services[2],
                'professional': professionals[1],
                'client_name': clients[4].name,
                'client_phone': clients[4].phone,
                'client_email': clients[4].email,
                'service_name': services[2].name,
                'service_duration': services[2].duration,
                'service_price': services[2].price,
                'appointment_date': today + timedelta(days=1),
                'appointment_time': time(10, 0),
                'status': 'confirmed',
                'notes': 'Primera cita, ser puntual.',
            },
            {
                'business': business,
                'client': clients[0],
                'service': services[0],
                'professional': professionals[0],
                'client_name': clients[0].name,
                'client_phone': clients[0].phone,
                'service_name': services[0].name,
                'service_duration': services[0].duration,
                'service_price': services[0].price,
                'appointment_date': today + timedelta(days=3),
                'appointment_time': time(12, 0),
                'status': 'confirmed',
            },
            {
                'business': business,
                'client': clients[1],
                'service': services[0],
                'professional': professionals[0],
                'client_name': clients[1].name,
                'client_phone': clients[1].phone,
                'service_name': services[0].name,
                'service_duration': services[0].duration,
                'service_price': services[0].price,
                'appointment_date': today + timedelta(days=5),
                'appointment_time': time(16, 0),
                'status': 'pending',
            },
        ]

        for apt_data in appointments_data:
            # Verificar si la cita ya existe
            try:
                apt = Appointment.objects.get(
                    business=apt_data['business'],
                    appointment_date=apt_data['appointment_date'],
                    appointment_time=apt_data['appointment_time'],
                    client_phone=apt_data['client_phone']
                )
                self.stdout.write(f"  ℹ️  Ya existe: Cita")
            except Appointment.DoesNotExist:
                # Crear nueva cita omitiendo validación de fechas pasadas
                apt = Appointment(**apt_data)
                apt.save(skip_validation=True)
                self.stdout.write(self.style.SUCCESS(
                    f"  ✅ Cita: {apt.client_name} - {apt.service_name} ({apt.get_status_display()})"
                ))


        # =============================================================================
        # RESUMEN
        # =============================================================================

        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS("✨ BASE DE DATOS POBLADA EXITOSAMENTE"))
        self.stdout.write("="*80)
        self.stdout.write(f"""
📊 RESUMEN:
   • {SubscriptionPlan.objects.count()} planes de subscripción
   • {Business.objects.count()} negocio(s)
   • {Service.objects.count()} servicio(s)
   • {Professional.objects.count()} profesional(es)
   • {Client.objects.count()} cliente(s)
   • {Appointment.objects.count()} cita(s)

🔑 CREDENCIALES ADMIN:
   URL: http://localhost:8000/admin/
   Usuario: admin
   Password: (la que estableciste)

🏢 NEGOCIO DE PRUEBA:
   Nombre: {business.name}
   Slug: {business.slug}
   Email: {business.email}
   Plan: {business.current_plan.name}
   
📱 PORTAL PÚBLICO (futuro):
   URL: http://localhost:5173/book/{business.slug}

🚀 PRÓXIMO PASO:
   Crear serializers y endpoints de API con JWT
""")
        self.stdout.write("="*80)
