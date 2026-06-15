"""
Views para el sistema de reportes y analytics avanzados
"""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta, datetime
from io import BytesIO
from core.permissions import IsOwnerOrManagerOrSuperAdmin

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from appointments.models import Appointment
from business.models import Service, Professional, Client
from .models import ExportHistory


class AppointmentsSummaryView(APIView):
    """
    GET /api/reports/appointments/summary/
    
    Resumen general de citas con métricas clave.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrSuperAdmin]
    
    def get_queryset(self):
        """Filtrar citas del negocio del usuario"""
        return Appointment.objects.filter(business=self.request.user.business)
    
    def get(self, request):
        """
        GET /api/reports/appointments/summary/
        
        Resumen general de citas con métricas clave.
        
        Query params:
        - start_date (opcional): Fecha inicio (YYYY-MM-DD)
        - end_date (opcional): Fecha fin (YYYY-MM-DD)
        - service_id (opcional): Filtrar por servicio
        - professional_id (opcional): Filtrar por profesional
        
        Returns:
            {
                "total": 150,
                "by_status": {
                    "pending": 20,
                    "confirmed": 50,
                    "completed": 70,
                    "cancelled": 8,
                    "no_show": 2
                },
                "completion_rate": 82.35,  # % completadas
                "cancellation_rate": 6.67,  # % canceladas + no_show
                "average_per_day": 5.0,
                "trend": "up"  # up, down, stable
            }
        """
        try:
            # Obtener parámetros de filtro
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            service_id = request.query_params.get('service_id')
            professional_id = request.query_params.get('professional_id')
            
            # Base queryset
            queryset = self.get_queryset()
            
            # Aplicar filtros de fecha
            if start_date:
                queryset = queryset.filter(date__gte=start_date)
            if end_date:
                queryset = queryset.filter(date__lte=end_date)
            
            # Si no se especificaron fechas, usar últimos 30 días por defecto
            if not start_date and not end_date:
                queryset = queryset.filter(
                    date__gte=timezone.now().date() - timedelta(days=30)
                )
            
            # Filtros adicionales
            if service_id:
                queryset = queryset.filter(service_id=service_id)
            if professional_id:
                queryset = queryset.filter(professional_id=professional_id)
            
            # Calcular métricas
            total = queryset.count()
            
            # Contar por estado
            by_status = queryset.values('status').annotate(count=Count('id'))
            status_dict = {item['status']: item['count'] for item in by_status}
            
            # Rellenar estados faltantes con 0
            all_statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']
            for st in all_statuses:
                if st not in status_dict:
                    status_dict[st] = 0
            
            # Calcular tasas
            completed = status_dict.get('completed', 0)
            cancelled = status_dict.get('cancelled', 0)
            no_show = status_dict.get('no_show', 0)
            
            completion_rate = (completed / total * 100) if total > 0 else 0
            cancellation_rate = ((cancelled + no_show) / total * 100) if total > 0 else 0
            
            # Calcular promedio por día
            if start_date and end_date:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                days = (end - start).days + 1
            else:
                days = 30
            
            average_per_day = total / days if days > 0 else 0
            
            # Calcular tendencia (comparar con periodo anterior)
            trend = "stable"
            if start_date and end_date:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                period_days = (end - start).days + 1
                
                # Periodo anterior
                previous_start = start - timedelta(days=period_days)
                previous_end = start - timedelta(days=1)
                
                previous_total = Appointment.objects.filter(
                    business=request.user.business,
                    date__gte=previous_start,
                    date__lte=previous_end
                ).count()
                
                if previous_total > 0:
                    change = ((total - previous_total) / previous_total) * 100
                    if change > 5:
                        trend = "up"
                    elif change < -5:
                        trend = "down"
            
            return Response({
                'success': True,
                'data': {
                    'total': total,
                    'by_status': status_dict,
                    'completion_rate': round(completion_rate, 2),
                    'cancellation_rate': round(cancellation_rate, 2),
                    'average_per_day': round(average_per_day, 2),
                    'trend': trend,
                    'period': {
                        'start': start_date or (timezone.now().date() - timedelta(days=30)).isoformat(),
                        'end': end_date or timezone.now().date().isoformat()
                    }
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RevenueSummaryView(APIView):
    """
    GET /api/reports/revenue/summary/
    
    Resumen de ingresos y revenue.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrSuperAdmin]
    
    def get_queryset(self):
        """Citas completadas del negocio (solo estas generan ingresos)"""
        return Appointment.objects.filter(
            business=self.request.user.business,
            status='completed'
        )
    
    def get(self, request):
        """
        GET /api/reports/revenue/summary/
        
        Resumen de ingresos totales.
        
        Query params:
        - start_date (opcional): Fecha inicio
        - end_date (opcional): Fecha fin
        
        Returns:
            {
                "total_revenue": 15000.00,
                "average_ticket": 50.00,
                "total_appointments": 300,
                "projected_monthly": 18000.00,
                "comparison": {
                    "previous_period": 12000.00,
                    "change_percent": 25.0
                }
            }
        """
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            queryset = self.get_queryset()
            
            # Filtros de fecha
            if start_date:
                queryset = queryset.filter(date__gte=start_date)
            if end_date:
                queryset = queryset.filter(date__lte=end_date)
            else:
                # Por defecto: mes actual
                today = timezone.now().date()
                first_day = today.replace(day=1)
                queryset = queryset.filter(date__gte=first_day)
            
            # Calcular ingresos
            # Nota: Asumiendo que tienes un campo 'price' en Service
            # Cada cita completada cuenta como ingreso
            appointments_with_price = queryset.select_related('service')
            
            total_revenue = sum(
                float(apt.service.price) if apt.service and apt.service.price else 0
                for apt in appointments_with_price
            )
            
            total_appointments = queryset.count()
            average_ticket = total_revenue / total_appointments if total_appointments > 0 else 0
            
            # Proyección mensual (si no es mes completo, proyectar)
            if start_date and end_date:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                days = (end - start).days + 1
                projected_monthly = (total_revenue / days) * 30 if days > 0 else 0
            else:
                projected_monthly = total_revenue  # Ya es mensual
            
            # Comparación con periodo anterior
            if start_date and end_date:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                period_days = (end - start).days + 1
                
                previous_start = start - timedelta(days=period_days)
                previous_end = start - timedelta(days=1)
                
                previous_appointments = Appointment.objects.filter(
                    business=request.user.business,
                    status='completed',
                    date__gte=previous_start,
                    date__lte=previous_end
                ).select_related('service')
                
                previous_revenue = sum(
                    float(apt.service.price) if apt.service and apt.service.price else 0
                    for apt in previous_appointments
                )
                
                change_percent = ((total_revenue - previous_revenue) / previous_revenue * 100) if previous_revenue > 0 else 0
            else:
                previous_revenue = 0
                change_percent = 0
            
            return Response({
                'success': True,
                'data': {
                    'total_revenue': round(total_revenue, 2),
                    'average_ticket': round(average_ticket, 2),
                    'total_appointments': total_appointments,
                    'projected_monthly': round(projected_monthly, 2),
                    'comparison': {
                        'previous_period': round(previous_revenue, 2),
                        'change_percent': round(change_percent, 2)
                    }
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClientsSummaryView(APIView):
    """
    GET /api/reports/clients/summary/
    
    Resumen de métricas de clientes.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrSuperAdmin]
    
    def get(self, request):
        """
        GET /api/reports/clients/summary/
        
        Métricas sobre clientes y retención.
        
        Query params:
        - start_date (opcional): Fecha inicio
        - end_date (opcional): Fecha fin
        
        Returns:
            {
                "total_clients": 450,
                "new_clients": 45,
                "recurring_clients": 405,
                "retention_rate": 90.0,
                "churn_rate": 10.0,
                "top_clients": [...]
            }
        """
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            # Base queryset de clientes del negocio
            clients_queryset = Client.objects.filter(business=request.user.business)
            
            # Total de clientes activos
            total_clients = clients_queryset.count()
            
            # Clientes nuevos en el periodo
            new_clients_queryset = clients_queryset
            if start_date:
                new_clients_queryset = new_clients_queryset.filter(created_at__gte=start_date)
            if end_date:
                new_clients_queryset = new_clients_queryset.filter(created_at__lte=end_date)
            
            new_clients = new_clients_queryset.count()
            
            # Clientes recurrentes (con más de 1 cita completada)
            recurring_clients = 0
            for client in clients_queryset:
                appointments_count = Appointment.objects.filter(
                    client=client,
                    status='completed'
                ).count()
                if appointments_count > 1:
                    recurring_clients += 1
            
            # Tasa de retención
            retention_rate = (recurring_clients / total_clients * 100) if total_clients > 0 else 0
            churn_rate = 100 - retention_rate
            
            # Top clientes por número de citas
            top_clients_data = []
            for client in clients_queryset[:10]:  # Top 10
                client_appointments = Appointment.objects.filter(
                    client=client,
                    status='completed'
                )
                
                appointments_count = client_appointments.count()
                
                # Calcular revenue del cliente
                revenue = sum(
                    float(apt.service.price) if apt.service and apt.service.price else 0
                    for apt in client_appointments.select_related('service')
                )
                
                if appointments_count > 0:
                    top_clients_data.append({
                        'name': client.name,
                        'email': client.email,
                        'appointments': appointments_count,
                        'revenue': round(revenue, 2)
                    })
            
            # Ordenar por appointments descendente
            top_clients_data.sort(key=lambda x: x['appointments'], reverse=True)
            top_clients = top_clients_data[:10]
            
            return Response({
                'success': True,
                'data': {
                    'total_clients': total_clients,
                    'new_clients': new_clients,
                    'recurring_clients': recurring_clients,
                    'retention_rate': round(retention_rate, 2),
                    'churn_rate': round(churn_rate, 2),
                    'top_clients': top_clients
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfessionalsSummaryView(APIView):
    """
    GET /api/reports/professionals/summary/
    
    Resumen de desempeño de profesionales.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrSuperAdmin]
    
    def get(self, request):
        """
        GET /api/reports/professionals/summary/
        
        Métricas de desempeño por profesional.
        
        Query params:
        - start_date (opcional): Fecha inicio
        - end_date (opcional): Fecha fin
        
        Returns:
            {
                "total_professionals": 10,
                "average_appointments": 50.5,
                "average_revenue": 2500.00,
                "professionals": [...]
            }
        """
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            # Obtener profesionales del negocio
            professionals = Professional.objects.filter(business=request.user.business)
            total_professionals = professionals.count()
            
            # Calcular métricas por profesional
            professionals_data = []
            total_appointments_all = 0
            total_revenue_all = 0
            
            for professional in professionals:
                # Filtrar citas del profesional
                appointments_queryset = Appointment.objects.filter(
                    professional=professional,
                    status='completed'
                )
                
                if start_date:
                    appointments_queryset = appointments_queryset.filter(date__gte=start_date)
                if end_date:
                    appointments_queryset = appointments_queryset.filter(date__lte=end_date)
                
                appointments_count = appointments_queryset.count()
                
                # Calcular revenue
                appointments_with_service = appointments_queryset.select_related('service')
                revenue = sum(
                    float(apt.service.price) if apt.service and apt.service.price else 0
                    for apt in appointments_with_service
                )
                
                # Calcular tasa de completación
                total_apt = Appointment.objects.filter(
                    professional=professional
                )
                if start_date:
                    total_apt = total_apt.filter(date__gte=start_date)
                if end_date:
                    total_apt = total_apt.filter(date__lte=end_date)
                
                total_apt_count = total_apt.count()
                completion_rate = (appointments_count / total_apt_count * 100) if total_apt_count > 0 else 0
                
                professionals_data.append({
                    'id': professional.id,
                    'name': professional.user.get_full_name() if professional.user else 'Sin nombre',
                    'appointments': appointments_count,
                    'revenue': round(revenue, 2),
                    'completion_rate': round(completion_rate, 2)
                })
                
                total_appointments_all += appointments_count
                total_revenue_all += revenue
            
            # Promedios
            average_appointments = total_appointments_all / total_professionals if total_professionals > 0 else 0
            average_revenue = total_revenue_all / total_professionals if total_professionals > 0 else 0
            
            # Ordenar por revenue descendente
            professionals_data.sort(key=lambda x: x['revenue'], reverse=True)
            
            return Response({
                'success': True,
                'data': {
                    'total_professionals': total_professionals,
                    'average_appointments': round(average_appointments, 2),
                    'average_revenue': round(average_revenue, 2),
                    'professionals': professionals_data
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OperationsSummaryView(APIView):
    """
    GET /api/reports/operations/summary/
    
    Resumen de operaciones y eficiencia.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrSuperAdmin]
    
    def get(self, request):
        """
        GET /api/reports/operations/summary/
        
        Métricas operativas del negocio.
        
        Query params:
        - start_date (opcional): Fecha inicio
        - end_date (opcional): Fecha fin
        
        Returns:
            {
                "average_duration": 60,  # minutos
                "utilization_rate": 75.0,  # % de ocupación
                "peak_hours": {...},
                "peak_days": {...}
            }
        """
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            # Base queryset
            appointments = Appointment.objects.filter(
                business=request.user.business,
                status__in=['completed', 'confirmed']
            )
            
            if start_date:
                appointments = appointments.filter(date__gte=start_date)
            if end_date:
                appointments = appointments.filter(date__lte=end_date)
            
            total_appointments = appointments.count()
            
            # Duración promedio (basada en el servicio)
            total_duration = 0
            duration_count = 0
            for apt in appointments.select_related('service'):
                if apt.service and apt.service.duration:
                    total_duration += apt.service.duration
                    duration_count += 1
            
            average_duration = total_duration / duration_count if duration_count > 0 else 0
            
            # Análisis de horas pico
            peak_hours = {}
            for apt in appointments:
                if apt.start_time:
                    hour = apt.start_time.hour
                    peak_hours[hour] = peak_hours.get(hour, 0) + 1
            
            # Top 3 horas más ocupadas
            sorted_hours = sorted(peak_hours.items(), key=lambda x: x[1], reverse=True)[:3]
            top_peak_hours = [
                {'hour': f'{hour:02d}:00', 'appointments': count}
                for hour, count in sorted_hours
            ]
            
            # Análisis de días más ocupados
            peak_days = {}
            for apt in appointments:
                day_name = apt.date.strftime('%A')  # Lunes, Martes, etc.
                peak_days[day_name] = peak_days.get(day_name, 0) + 1
            
            # Ordenar días
            sorted_days = sorted(peak_days.items(), key=lambda x: x[1], reverse=True)
            top_peak_days = [
                {'day': day, 'appointments': count}
                for day, count in sorted_days
            ]
            
            # Tasa de utilización (asumiendo 8 horas laborales por día)
            if start_date and end_date:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                business_days = (end - start).days + 1
            else:
                business_days = 30
            
            # Asumiendo 8 horas = 480 minutos por día
            available_minutes = business_days * 480
            used_minutes = total_appointments * average_duration
            utilization_rate = (used_minutes / available_minutes * 100) if available_minutes > 0 else 0
            
            return Response({
                'success': True,
                'data': {
                    'average_duration': round(average_duration, 2),
                    'utilization_rate': round(utilization_rate, 2),
                    'peak_hours': top_peak_hours,
                    'peak_days': top_peak_days,
                    'total_appointments': total_appointments
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExportReportPdfView(APIView):
    """
    GET /api/reports/export/pdf/

    Genera exportación PDF de un reporte específico.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrSuperAdmin]

    def get(self, request):
        try:
            report_type = request.query_params.get('report_type', 'appointments')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')

            valid_report_types = {'appointments', 'revenue', 'clients', 'professionals', 'operations'}
            if report_type not in valid_report_types:
                return Response({
                    'success': False,
                    'error': 'Tipo de reporte no válido'
                }, status=status.HTTP_400_BAD_REQUEST)

            business = request.user.business
            if business is None:
                return Response({
                    'success': False,
                    'error': 'El usuario no tiene negocio asignado'
                }, status=status.HTTP_400_BAD_REQUEST)

            # PDF en memoria
            buffer = BytesIO()
            pdf = canvas.Canvas(buffer, pagesize=letter)
            width, height = letter
            y = height - 50

            def draw_line(text, gap=18):
                nonlocal y
                if y < 50:
                    pdf.showPage()
                    y = height - 50
                    pdf.setFont('Helvetica', 11)
                pdf.drawString(50, y, str(text))
                y -= gap

            # Header
            pdf.setTitle(f"Reporte {report_type}")
            pdf.setFont('Helvetica-Bold', 16)
            draw_line(f"Reporte: {report_type.capitalize()}", gap=24)
            pdf.setFont('Helvetica', 11)
            draw_line(f"Negocio: {business.name}")
            draw_line(f"Generado: {timezone.now().strftime('%Y-%m-%d %H:%M')}")
            if start_date or end_date:
                draw_line(f"Periodo: {start_date or '...'} al {end_date or '...'}")
            draw_line('-' * 100, gap=20)

            if report_type == 'appointments':
                queryset = Appointment.objects.filter(business=business)
                if start_date:
                    queryset = queryset.filter(date__gte=start_date)
                if end_date:
                    queryset = queryset.filter(date__lte=end_date)

                total = queryset.count()
                by_status = queryset.values('status').annotate(count=Count('id'))
                status_dict = {item['status']: item['count'] for item in by_status}
                completed = status_dict.get('completed', 0)
                cancelled = status_dict.get('cancelled', 0) + status_dict.get('no_show', 0)
                completion_rate = (completed / total * 100) if total > 0 else 0
                cancellation_rate = (cancelled / total * 100) if total > 0 else 0

                draw_line('Resumen de Citas', gap=22)
                draw_line(f"Total de citas: {total}")
                draw_line(f"Tasa de completacion: {completion_rate:.2f}%")
                draw_line(f"Tasa de cancelacion: {cancellation_rate:.2f}%")
                draw_line('Distribucion por estado:')
                for st in ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']:
                    draw_line(f"  - {st}: {status_dict.get(st, 0)}")

            elif report_type == 'revenue':
                queryset = Appointment.objects.filter(
                    business=business,
                    status='completed'
                ).select_related('service')
                if start_date:
                    queryset = queryset.filter(date__gte=start_date)
                if end_date:
                    queryset = queryset.filter(date__lte=end_date)

                total_revenue = sum(
                    float(apt.service.price) if apt.service and apt.service.price else 0
                    for apt in queryset
                )
                total_appointments = queryset.count()
                average_ticket = total_revenue / total_appointments if total_appointments > 0 else 0

                draw_line('Resumen de Ingresos', gap=22)
                draw_line(f"Ingresos totales: ${total_revenue:.2f}")
                draw_line(f"Citas completadas: {total_appointments}")
                draw_line(f"Ticket promedio: ${average_ticket:.2f}")

            elif report_type == 'clients':
                clients_queryset = Client.objects.filter(business=business)
                if start_date:
                    clients_period = clients_queryset.filter(created_at__gte=start_date)
                else:
                    clients_period = clients_queryset
                if end_date:
                    clients_period = clients_period.filter(created_at__lte=end_date)

                total_clients = clients_queryset.count()
                new_clients = clients_period.count()
                recurring_clients = 0
                for client in clients_queryset:
                    if Appointment.objects.filter(client=client, status='completed').count() > 1:
                        recurring_clients += 1
                retention_rate = (recurring_clients / total_clients * 100) if total_clients > 0 else 0

                draw_line('Resumen de Clientes', gap=22)
                draw_line(f"Total de clientes: {total_clients}")
                draw_line(f"Clientes nuevos: {new_clients}")
                draw_line(f"Clientes recurrentes: {recurring_clients}")
                draw_line(f"Tasa de retencion: {retention_rate:.2f}%")

            elif report_type == 'professionals':
                professionals = Professional.objects.filter(business=business)
                draw_line('Resumen de Profesionales', gap=22)
                draw_line(f"Total de profesionales: {professionals.count()}")
                draw_line('Top por citas completadas:')

                ranking = []
                for professional in professionals:
                    appointments_qs = Appointment.objects.filter(
                        professional=professional,
                        status='completed'
                    )
                    if start_date:
                        appointments_qs = appointments_qs.filter(date__gte=start_date)
                    if end_date:
                        appointments_qs = appointments_qs.filter(date__lte=end_date)
                    ranking.append((professional, appointments_qs.count()))

                ranking.sort(key=lambda x: x[1], reverse=True)
                for professional, count in ranking[:10]:
                    name = professional.user.get_full_name() if professional.user else 'Sin nombre'
                    draw_line(f"  - {name}: {count} citas")

            else:  # operations
                appointments = Appointment.objects.filter(
                    business=business,
                    status__in=['completed', 'confirmed']
                ).select_related('service')
                if start_date:
                    appointments = appointments.filter(date__gte=start_date)
                if end_date:
                    appointments = appointments.filter(date__lte=end_date)

                total_appointments = appointments.count()
                total_duration = 0
                duration_count = 0
                peak_hours = {}
                for apt in appointments:
                    if apt.service and apt.service.duration:
                        total_duration += apt.service.duration
                        duration_count += 1
                    if apt.start_time:
                        hour = apt.start_time.hour
                        peak_hours[hour] = peak_hours.get(hour, 0) + 1

                average_duration = total_duration / duration_count if duration_count > 0 else 0
                top_hours = sorted(peak_hours.items(), key=lambda x: x[1], reverse=True)[:3]

                draw_line('Resumen de Operaciones', gap=22)
                draw_line(f"Total de citas: {total_appointments}")
                draw_line(f"Duracion promedio: {average_duration:.2f} min")
                draw_line('Horas pico:')
                for hour, count in top_hours:
                    draw_line(f"  - {hour:02d}:00: {count} citas")

            pdf.showPage()
            pdf.save()
            buffer.seek(0)

            filename_date = timezone.now().strftime('%Y%m%d')
            filename = f"reporte_{report_type}_{filename_date}.pdf"
            pdf_bytes = buffer.getvalue()

            ExportHistory.objects.create(
                business=business,
                exported_by=request.user,
                format='pdf',
                file_name=filename,
                file_size=len(pdf_bytes),
                config={
                    'report_type': report_type,
                    'start_date': start_date,
                    'end_date': end_date,
                },
                metadata={
                    'generated_at': timezone.now().isoformat(),
                }
            )

            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
