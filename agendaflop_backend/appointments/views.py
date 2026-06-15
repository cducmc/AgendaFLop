"""
Views y ViewSets para la app appointments
"""

from rest_framework import viewsets, status, filters, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, timedelta, date
from core.permissions import AppointmentAccessPermission

from .models import Appointment, Notification
from .serializers import (
    AppointmentSerializer,
    AppointmentListSerializer,
    AppointmentCreateSerializer,
    AppointmentPublicCreateSerializer,
    AppointmentUpdateSerializer,
    AppointmentStatusUpdateSerializer,
    NotificationSerializer,
    NotificationCreateSerializer,
)
from business.models import Business


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de citas filtrado por negocio del usuario
    """
    permission_classes = [permissions.IsAuthenticated, AppointmentAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'appointment_date', 'service', 'professional', 'client']
    search_fields = ['client_name', 'client_phone', 'service_name']
    ordering_fields = ['appointment_date', 'appointment_time', 'created_at']
    ordering = ['-appointment_date', '-appointment_time']
    
    def check_business(self):
        """Verifica que el usuario tenga un negocio asignado"""
        if not self.request.user.business:
            return Response({
                'error': 'No tienes un negocio asignado. Contacta al administrador.'
            }, status=status.HTTP_400_BAD_REQUEST)
        return None
    
    def create(self, request, *args, **kwargs):
        """Override create para validar business"""
        error_response = self.check_business()
        if error_response:
            return error_response
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Override update para validar business"""
        error_response = self.check_business()
        if error_response:
            return error_response
        return super().update(request, *args, **kwargs)
    
    def get_queryset(self):
        """Solo citas del negocio del usuario"""
        try:
            # Verificar que el usuario tenga un negocio asignado
            if not self.request.user.business:
                return Appointment.objects.none()
            
            queryset = Appointment.objects.filter(business=self.request.user.business)

            # Profesional: solo ve sus propias citas
            if self.request.user.role == 'professional':
                queryset = queryset.filter(professional__user=self.request.user)
            
            # Filtro por rango de fechas
            date_from = self.request.query_params.get('date_from', None)
            date_to = self.request.query_params.get('date_to', None)
            
            if date_from:
                queryset = queryset.filter(appointment_date__gte=date_from)
            if date_to:
                queryset = queryset.filter(appointment_date__lte=date_to)
            
            # Filtro: solo futuras
            if self.request.query_params.get('upcoming', None) == 'true':
                queryset = queryset.filter(appointment_date__gte=timezone.now().date())
            
            # Filtro: solo hoy
            if self.request.query_params.get('today', None) == 'true':
                queryset = queryset.filter(appointment_date=timezone.now().date())
            
            return queryset.select_related('client', 'service', 'professional', 'business')
        except Exception as e:
            return Appointment.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return AppointmentListSerializer
        elif self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentUpdateSerializer
        return AppointmentSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['business'] = self.request.user.business
        return context
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        GET /api/appointments/today/
        
        Citas de hoy
        """
        appointments = self.get_queryset().filter(
            appointment_date=timezone.now().date()
        ).order_by('appointment_time')
        
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        GET /api/appointments/upcoming/
        
        Próximas citas (futuras)
        """
        appointments = self.get_queryset().filter(
            appointment_date__gte=timezone.now().date()
        ).order_by('appointment_date', 'appointment_time')[:20]
        
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/appointments/stats/
        
        Estadísticas de citas
        """
        today = timezone.now().date()
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'today': queryset.filter(appointment_date=today).count(),
            'pending': queryset.filter(status='pending').count(),
            'confirmed': queryset.filter(status='confirmed').count(),
            'completed': queryset.filter(status='completed').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
            'this_week': queryset.filter(
                appointment_date__gte=today,
                appointment_date__lte=today + timedelta(days=7)
            ).count(),
            'this_month': queryset.filter(
                appointment_date__year=today.year,
                appointment_date__month=today.month
            ).count(),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        POST /api/appointments/{id}/confirm/
        
        Confirmar una cita
        """
        appointment = self.get_object()
        appointment.status = 'confirmed'
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response({
            'message': 'Cita confirmada',
            'appointment': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        POST /api/appointments/{id}/cancel/
        
        Cancelar una cita
        Body: { "cancellation_reason": "Motivo..." }
        """
        appointment = self.get_object()
        
        cancellation_reason = request.data.get('cancellation_reason', '')
        if not cancellation_reason:
            return Response({
                'error': 'Se requiere el motivo de cancelación'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        appointment.status = 'cancelled'
        appointment.cancellation_reason = cancellation_reason
        appointment.cancelled_at = timezone.now()
        appointment.cancelled_by = request.user.email
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response({
            'message': 'Cita cancelada',
            'appointment': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        POST /api/appointments/{id}/complete/
        
        Marcar una cita como completada
        """
        appointment = self.get_object()
        appointment.status = 'completed'
        appointment.completed_at = timezone.now()
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response({
            'message': 'Cita marcada como completada',
            'appointment': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def no_show(self, request, pk=None):
        """
        POST /api/appointments/{id}/no_show/
        
        Marcar que el cliente no asistió
        """
        appointment = self.get_object()
        appointment.status = 'no_show'
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response({
            'message': 'Cita marcada como no show',
            'appointment': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        GET /api/appointments/analytics/
        
        Obtener datos para gráficas de tendencias
        - Citas por día en los últimos 30 días
        - Citas por estado
        - Distribución semanal
        """
        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=30)
        queryset = self.get_queryset()
        
        # Citas por día (últimos 30 días)
        daily_appointments = []
        for i in range(30):
            day = today - timedelta(days=29-i)
            count = queryset.filter(appointment_date=day).count()
            daily_appointments.append({
                'date': day.strftime('%Y-%m-%d'),
                'day': day.strftime('%d/%m'),
                'count': count
            })
        
        # Distribución por estado
        status_distribution = {
            'pending': queryset.filter(status='pending').count(),
            'confirmed': queryset.filter(status='confirmed').count(),
            'completed': queryset.filter(status='completed').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
            'no_show': queryset.filter(status='no_show').count(),
        }
        
        # Citas por día de la semana (últimos 30 días)
        weekday_distribution = {
            'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 
            'Jueves': 0, 'Viernes': 0, 'Sábado': 0, 'Domingo': 0
        }
        weekday_names = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        appointments_last_30 = queryset.filter(appointment_date__gte=thirty_days_ago)
        for appointment in appointments_last_30:
            weekday = appointment.appointment_date.weekday()
            weekday_distribution[weekday_names[weekday]] += 1
        
        return Response({
            'daily_appointments': daily_appointments,
            'status_distribution': status_distribution,
            'weekday_distribution': weekday_distribution
        })
    
    @action(detail=False, methods=['get'])
    def revenue(self, request):
        """
        GET /api/appointments/revenue/
        
        Estadísticas de ingresos
        - Ingresos totales
        - Ingresos del mes
        - Ingresos de hoy
        - Ingresos por mes (últimos 6 meses)
        """
        today = timezone.now().date()
        queryset = self.get_queryset().filter(status='completed')  # Solo citas completadas
        
        # Ingresos totales
        total_revenue = sum(float(a.service_price) for a in queryset if a.service_price)
        
        # Ingresos del mes actual
        month_revenue = sum(
            float(a.service_price) for a in queryset.filter(
                appointment_date__year=today.year,
                appointment_date__month=today.month
            ) if a.service_price
        )
        
        # Ingresos de hoy
        today_revenue = sum(
            float(a.service_price) for a in queryset.filter(
                appointment_date=today
            ) if a.service_price
        )
        
        # Ingresos por mes (últimos 6 meses)
        monthly_revenue = []
        for i in range(6):
            # Calcular el mes
            month_date = today.replace(day=1) - timedelta(days=i*30)
            month_start = month_date.replace(day=1)
            
            # Calcular último día del mes
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)
            
            revenue = sum(
                float(a.service_price) for a in queryset.filter(
                    appointment_date__gte=month_start,
                    appointment_date__lte=month_end
                ) if a.service_price
            )
            
            monthly_revenue.insert(0, {
                'month': month_start.strftime('%b %Y'),
                'month_short': month_start.strftime('%b'),
                'revenue': revenue
            })
        
        # Comparación con mes anterior
        last_month = today.replace(day=1) - timedelta(days=1)
        last_month_start = last_month.replace(day=1)
        
        last_month_revenue = sum(
            float(a.service_price) for a in queryset.filter(
                appointment_date__gte=last_month_start,
                appointment_date__lte=last_month
            ) if a.service_price
        )
        
        revenue_change = 0
        if last_month_revenue > 0:
            revenue_change = ((month_revenue - last_month_revenue) / last_month_revenue) * 100
        
        return Response({
            'total_revenue': total_revenue,
            'month_revenue': month_revenue,
            'today_revenue': today_revenue,
            'monthly_revenue': monthly_revenue,
            'last_month_revenue': last_month_revenue,
            'revenue_change_percent': round(revenue_change, 2)
        })
    
    @action(detail=False, methods=['get'])
    def popular_services(self, request):
        """
        GET /api/appointments/popular_services/
        
        Servicios más populares
        """
        queryset = self.get_queryset()
        
        # Agrupar por servicio y contar
        services = queryset.values('service', 'service_name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Calcular ingresos por servicio (solo completadas)
        completed = queryset.filter(status='completed')
        service_revenue = {}
        for service in services:
            service_id = service['service']
            if service_id:
                revenue = sum(
                    float(a.service_price) for a in completed.filter(service=service_id)
                    if a.service_price
                )
                service_revenue[service_id] = revenue
        
        # Agregar revenue a cada servicio
        popular_services = []
        for service in services:
            service_data = {
                'service_id': service['service'],
                'service_name': service['service_name'] or 'Sin nombre',
                'count': service['count'],
                'revenue': service_revenue.get(service['service'], 0)
            }
            popular_services.append(service_data)
        
        return Response(popular_services)
    
    @action(detail=False, methods=['get'])
    def popular_times(self, request):
        """
        GET /api/appointments/popular_times/
        
        Horarios más populares del día
        """
        queryset = self.get_queryset()
        
        # Agrupar por hora
        hour_distribution = {}
        for hour in range(8, 21):  # 8 AM a 8 PM
            hour_str = f"{hour:02d}:00"
            count = queryset.filter(
                appointment_time__gte=hour_str,
                appointment_time__lt=f"{hour+1:02d}:00"
            ).count()
            hour_distribution[hour_str] = count
        
        # Convertir a lista ordenada
        popular_times = [
            {
                'time': time,
                'time_label': f"{time} - {int(time.split(':')[0])+1:02d}:00",
                'count': count
            }
            for time, count in sorted(hour_distribution.items())
        ]
        
        return Response(popular_times)
    
    @action(detail=False, methods=['get'])
    def professional_stats(self, request):
        """
        GET /api/appointments/professional_stats/
        
        Estadísticas por profesional
        """
        queryset = self.get_queryset()
        
        # Agrupar por profesional
        professionals = queryset.values('professional', 'professional_name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Calcular ingresos y tasa de completado por profesional
        professional_stats = []
        for prof in professionals:
            prof_id = prof['professional']
            prof_appointments = queryset.filter(professional=prof_id)
            
            completed_count = prof_appointments.filter(status='completed').count()
            cancelled_count = prof_appointments.filter(status='cancelled').count()
            total_count = prof_appointments.count()
            
            # Tasa de cumplimiento
            completion_rate = 0
            if total_count > 0:
                completion_rate = (completed_count / total_count) * 100
            
            # Ingresos
            revenue = sum(
                float(a.service_price) for a in prof_appointments.filter(status='completed')
                if a.service_price
            )
            
            professional_stats.append({
                'professional_id': prof_id,
                'professional_name': prof['professional_name'] or 'Sin asignar',
                'total_appointments': total_count,
                'completed': completed_count,
                'cancelled': cancelled_count,
                'completion_rate': round(completion_rate, 2),
                'revenue': revenue
            })
        
        return Response(professional_stats)
    
    @action(detail=False, methods=['get'])
    def calendar_range(self, request):
        """
        GET /api/appointments/calendar_range/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
        
        Obtener citas en un rango de fechas para mostrar en el calendario.
        Optimizado para vistas de mes, semana, día.
        """
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if not start_date_str or not end_date_str:
            return Response({
                'error': 'Se requieren los parámetros start_date y end_date'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que el rango no sea muy grande (máximo 60 días)
        if (end_date - start_date).days > 60:
            return Response({
                'error': 'El rango de fechas no puede ser mayor a 60 días'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener citas en el rango
        queryset = self.get_queryset().filter(
            appointment_date__gte=start_date,
            appointment_date__lte=end_date
        ).order_by('appointment_date', 'appointment_time')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """
        POST /api/appointments/{id}/reschedule/
        
        Reprogramar una cita (para drag & drop en calendario).
        Body: {
            "new_date": "YYYY-MM-DD",
            "new_time": "HH:MM"
        }
        """
        appointment = self.get_object()
        
        new_date_str = request.data.get('new_date')
        new_time = request.data.get('new_time')
        
        if not new_date_str or not new_time:
            return Response({
                'error': 'Se requieren new_date y new_time'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que la nueva fecha no sea en el pasado
        if new_date < timezone.now().date():
            return Response({
                'error': 'No se pueden programar citas en fechas pasadas'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar formato de hora
        try:
            datetime.strptime(new_time, '%H:%M')
        except ValueError:
            return Response({
                'error': 'Formato de hora inválido. Use HH:MM'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar conflictos con otras citas del mismo profesional
        if appointment.professional:
            conflicts = self.get_queryset().filter(
                professional=appointment.professional,
                appointment_date=new_date,
                appointment_time=new_time
            ).exclude(id=appointment.id)
            
            if conflicts.exists():
                return Response({
                    'error': 'El profesional ya tiene una cita en ese horario'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Guardar fecha y hora antiguas para el historial
        old_date = appointment.appointment_date
        old_time = appointment.appointment_time
        
        # Actualizar la cita
        appointment.appointment_date = new_date
        appointment.appointment_time = new_time
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response({
            'message': 'Cita reprogramada exitosamente',
            'appointment': serializer.data,
            'old_date': old_date.strftime('%Y-%m-%d'),
            'old_time': str(old_time)
        })


# =============================================================================
# PUBLIC APPOINTMENT VIEW (Para portal de reservas)
# =============================================================================

class PublicAppointmentCreateView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    POST /api/public/businesses/{slug}/appointments/
    
    Crear cita desde el portal público
    """
    serializer_class = AppointmentPublicCreateSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Obtener negocio del slug en la URL
        slug = self.kwargs.get('slug')
        try:
            business = Business.objects.get(slug=slug, is_active=True)
            context['business'] = business
        except Business.DoesNotExist:
            context['business'] = None
        return context
    
    def create(self, request, *args, **kwargs):
        """Crear cita pública"""
        context = self.get_serializer_context()
        
        if not context['business']:
            return Response({
                'error': 'Negocio no encontrado o inactivo'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if not context['business'].allow_online_booking:
            return Response({
                'error': 'Este negocio no acepta reservas en línea'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        
        return Response({
            'message': '¡Reserva creada exitosamente! Recibirás una confirmación pronto.',
            'appointment': AppointmentSerializer(appointment).data
        }, status=status.HTTP_201_CREATED)


# =============================================================================
# PUBLIC AVAILABILITY VIEW (Horarios disponibles para reservas)
# =============================================================================

class PublicAvailabilityView(APIView):
    """
    GET /api/public/businesses/{slug}/availability/
    
    Obtener horarios disponibles para un servicio y profesional en una fecha específica.
    
    Query Parameters:
    - date (required): Fecha en formato YYYY-MM-DD
    - service_id (required): ID del servicio
    - professional_id (optional): ID del profesional específico
    
    Returns:
    - Lista de horarios disponibles en formato HH:MM
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, slug):
        """
        Genera horarios disponibles basados en:
        1. Horarios del negocio
        2. Citas ya agendadas
        3. Duración del servicio
        4. Buffer time del negocio
        """
        from business.models import (
            Service,
            Professional,
            AvailabilityRule,
            AvailabilityException,
        )
        
        try:
            # Validar negocio
            business = Business.objects.get(slug=slug, is_active=True)
            
            # Obtener parámetros requeridos
            date_str = request.query_params.get('date')
            service_id = request.query_params.get('service_id')
            professional_id = request.query_params.get('professional_id')
            
            if not date_str:
                return Response({
                    'error': 'El parámetro date es requerido (formato: YYYY-MM-DD)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not service_id:
                return Response({
                    'error': 'El parámetro service_id es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar y parsear fecha
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'error': 'Formato de fecha inválido. Use: YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar ventana de reserva configurable
            if target_date < date.today():
                return Response({
                    'error': 'No se pueden hacer reservas para fechas pasadas'
                }, status=status.HTTP_400_BAD_REQUEST)

            max_days_ahead = business.booking_max_days_ahead if business.booking_max_days_ahead is not None else 60
            max_target_date = date.today() + timedelta(days=max_days_ahead)
            if target_date > max_target_date:
                return Response({
                    'error': f'No se puede reservar con más de {max_days_ahead} días de anticipación'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar servicio
            try:
                service = Service.objects.get(
                    id=service_id,
                    business=business,
                    is_active=True,
                    allow_online_booking=True
                )
            except Service.DoesNotExist:
                return Response({
                    'error': 'Servicio no encontrado o no disponible para reservas'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Validar profesional (opcional)
            professional = None
            if professional_id:
                try:
                    professional = Professional.objects.get(
                        id=professional_id,
                        business=business,
                        is_active=True,
                        accepts_online_bookings=True
                    )
                except Professional.DoesNotExist:
                    return Response({
                        'error': 'Profesional no encontrado o no disponible'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Generar horarios disponibles (con reglas y excepciones)
            if professional:
                available_slots = self._generate_available_slots(
                    business=business,
                    service=service,
                    professional=professional,
                    target_date=target_date,
                    min_notice_hours=business.booking_min_notice_hours or 0,
                )
            else:
                eligible_professionals = Professional.objects.filter(
                    business=business,
                    is_active=True,
                    accepts_online_bookings=True,
                    services=service,
                ).distinct()

                # Si no hay relación explícita de servicios, usar todos los profesionales activos
                if not eligible_professionals.exists():
                    eligible_professionals = Professional.objects.filter(
                        business=business,
                        is_active=True,
                        accepts_online_bookings=True,
                    )

                merged_slots = set()
                for prof in eligible_professionals:
                    prof_slots = self._generate_available_slots(
                        business=business,
                        service=service,
                        professional=prof,
                        target_date=target_date,
                        min_notice_hours=business.booking_min_notice_hours or 0,
                    )
                    merged_slots.update(prof_slots)

                available_slots = sorted(merged_slots)
            
            return Response({
                'date': date_str,
                'service': {
                    'id': str(service.id),
                    'name': service.name,
                    'duration': service.duration
                },
                'professional': {
                    'id': str(professional.id) if professional else None,
                    'name': professional.name if professional else 'Cualquiera'
                } if professional_id else None,
                'available_slots': available_slots,
                'total_slots': len(available_slots)
            })
            
        except Business.DoesNotExist:
            return Response({
                'error': 'Negocio no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def _get_daily_ranges(self, business, professional, target_date):
        """
        Retorna rangos de disponibilidad [(start_datetime, end_datetime)] para una fecha.
        Prioriza reglas específicas del profesional y combina con reglas generales.
        """
        from business.models import AvailabilityRule, AvailabilityException

        weekday = target_date.weekday()

        rules = AvailabilityRule.objects.filter(
            business=business,
            weekday=weekday,
            is_active=True,
            is_online_bookable=True,
        ).filter(Q(professional=professional) | Q(professional__isnull=True)).order_by('-priority', 'start_time')

        # Fallback compatible con configuración legacy
        if not rules.exists():
            fallback_start, fallback_end = self._legacy_hours_for_day(business, professional, weekday)
            if not fallback_start or not fallback_end:
                return []
            ranges = [
                (
                    datetime.combine(target_date, fallback_start),
                    datetime.combine(target_date, fallback_end),
                )
            ]
        else:
            ranges = [
                (
                    datetime.combine(target_date, rule.start_time),
                    datetime.combine(target_date, rule.end_time),
                )
                for rule in rules
            ]

        # Aplicar excepciones de fecha: bloqueos y disponibilidades extras
        exceptions = AvailabilityException.objects.filter(
            business=business,
            date=target_date,
            is_active=True,
        ).filter(Q(professional=professional) | Q(professional__isnull=True))

        for ex in exceptions:
            if ex.start_time and ex.end_time:
                ex_start = datetime.combine(target_date, ex.start_time)
                ex_end = datetime.combine(target_date, ex.end_time)
            else:
                ex_start = datetime.combine(target_date, datetime.min.time())
                ex_end = datetime.combine(target_date, datetime.max.time())

            if ex.exception_type == 'available':
                ranges.append((ex_start, ex_end))
            else:  # blocked
                updated = []
                for start, end in ranges:
                    # Sin solape
                    if ex_end <= start or ex_start >= end:
                        updated.append((start, end))
                        continue

                    # Recorte izquierda
                    if ex_start > start:
                        updated.append((start, ex_start))

                    # Recorte derecha
                    if ex_end < end:
                        updated.append((ex_end, end))

                ranges = updated

        return [(start, end) for start, end in ranges if start < end]

    def _legacy_hours_for_day(self, business, professional, weekday):
        """Fallback de horarios legacy en JSON (business_hours/working_hours)."""
        import re

        weekday_keys = {
            0: ['lun', 'lunes', 'monday', 'mon'],
            1: ['mar', 'martes', 'tuesday', 'tue'],
            2: ['mie', 'miércoles', 'miercoles', 'wednesday', 'wed'],
            3: ['jue', 'jueves', 'thursday', 'thu'],
            4: ['vie', 'viernes', 'friday', 'fri'],
            5: ['sab', 'sábado', 'sabado', 'saturday', 'sat'],
            6: ['dom', 'domingo', 'sunday', 'sun'],
        }

        def parse_range(value):
            if not value or not isinstance(value, str):
                return (None, None)
            value = value.strip().lower().replace(' ', '')
            match = re.match(r'^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$', value)
            if not match:
                return (None, None)
            try:
                start = datetime.strptime(match.group(1), '%H:%M').time()
                end = datetime.strptime(match.group(2), '%H:%M').time()
                return (start, end)
            except ValueError:
                return (None, None)

        sources = []
        if professional and isinstance(professional.working_hours, dict):
            sources.append(professional.working_hours)
        if isinstance(business.business_hours, dict):
            sources.append(business.business_hours)

        for source in sources:
            for key in weekday_keys.get(weekday, []):
                if key in source:
                    start, end = parse_range(source.get(key))
                    if start and end and start < end:
                        return (start, end)

        return (None, None)

    def _generate_available_slots(self, business, service, professional, target_date, min_notice_hours=0):
        """
        Genera lista de horarios disponibles aplicando reglas, excepciones y conflictos.
        """
        slot_interval = 30
        service_duration = service.duration
        buffer_time = business.buffer_time if business.buffer_time else 0
        total_duration = service_duration + buffer_time

        ranges = self._get_daily_ranges(business, professional, target_date)
        if not ranges:
            return []

        # Citas activas del profesional para bloquear solapes
        appointments_query = Appointment.objects.filter(
            business=business,
            appointment_date=target_date,
            status__in=['pending', 'confirmed'],
            professional=professional,
        ).values('appointment_time', 'service__duration', 'service_duration')

        blocked_intervals = []
        for apt in appointments_query:
            apt_start = datetime.combine(target_date, apt['appointment_time'])
            apt_duration = apt['service__duration'] or apt['service_duration'] or 0
            apt_end = apt_start + timedelta(minutes=apt_duration + buffer_time)
            blocked_intervals.append((apt_start, apt_end))

        # Keep comparisons in local naive datetime to match slot/range datetimes
        # built with datetime.combine(...), which are naive.
        now_local_naive = timezone.localtime(timezone.now()).replace(tzinfo=None)
        min_allowed_start = now_local_naive + timedelta(hours=min_notice_hours)

        slots = []
        for range_start, range_end in ranges:
            current = range_start
            while current + timedelta(minutes=total_duration) <= range_end:
                slot_start = current
                slot_end = slot_start + timedelta(minutes=total_duration)

                # Anticipación mínima
                if slot_start < min_allowed_start:
                    current += timedelta(minutes=slot_interval)
                    continue

                # Solapes con citas existentes
                has_conflict = any(not (slot_end <= b_start or slot_start >= b_end) for b_start, b_end in blocked_intervals)
                if not has_conflict:
                    slots.append(slot_start.strftime('%H:%M'))

                current += timedelta(minutes=slot_interval)

        return sorted(set(slots))


# =============================================================================
# NOTIFICATION VIEWSET (Bloque 4)
# =============================================================================

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para notificaciones.
    
    Endpoints:
    - GET /api/notifications/ - Listar notificaciones del usuario
    - GET /api/notifications/{id}/ - Detalle de una notificación
    - POST /api/notifications/{id}/mark_read/ - Marcar como leída
    - POST /api/notifications/mark_all_read/ - Marcar todas como leídas
    - GET /api/notifications/unread_count/ - Contador de no leídas
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    filterset_fields = ['is_read', 'notification_type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Retorna notificaciones del negocio del usuario actual.
        Si el usuario tiene rol específico, solo sus notificaciones.
        """
        user = self.request.user
        business = user.business
        
        # Notificaciones dirigidas al usuario o notificaciones generales del negocio
        return Notification.objects.filter(
            Q(business=business, user=user) | Q(business=business, user__isnull=True)
        ).select_related('business', 'user', 'appointment')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        POST /api/notifications/{id}/mark_read/
        
        Marcar una notificación como leída.
        """
        notification = self.get_object()
        notification.mark_as_read()
        
        serializer = self.get_serializer(notification)
        return Response({
            'message': 'Notificación marcada como leída',
            'notification': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        POST /api/notifications/mark_all_read/
        
        Marcar todas las notificaciones no leídas como leídas.
        """
        user = request.user
        business = user.business
        
        # Marcar todas las notificaciones no leídas del usuario
        unread_notifications = Notification.objects.filter(
            Q(business=business, user=user, is_read=False) |
            Q(business=business, user__isnull=True, is_read=False)
        )
        
        count = 0
        for notification in unread_notifications:
            notification.mark_as_read()
            count += 1
        
        return Response({
            'message': f'{count} notificación(es) marcada(s) como leídas',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        GET /api/notifications/unread_count/
        
        Obtener el contador de notificaciones no leídas.
        """
        user = request.user
        business = user.business
        
        count = Notification.objects.filter(
            Q(business=business, user=user, is_read=False) |
            Q(business=business, user__isnull=True, is_read=False)
        ).count()
        
        return Response({
            'unread_count': count
        })
