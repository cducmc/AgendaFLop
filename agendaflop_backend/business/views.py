"""
Views y ViewSets para la app business
"""

from rest_framework import viewsets, status, generics, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from core.permissions import (
    IsOwnerOrManagerOrSuperAdmin,
    IsSuperAdmin,
    CanManageCatalog,
    CanManageClients,
)

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
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    SubscriptionPlanSerializer,
    BusinessSerializer,
    BusinessUpdateSerializer,
    SubscriptionSerializer,
    ServiceSerializer,
    ProfessionalSerializer,
    ClientSerializer,
    ClientCreateSerializer,
    AvailabilityRuleSerializer,
    AvailabilityExceptionSerializer,
    OnboardingProgressSerializer,
    OnboardingStepUpdateSerializer
)

User = get_user_model()


# =============================================================================
# PERMISSIONS
# =============================================================================

class IsSameBusinessPermission(permissions.BasePermission):
    """
    Permiso: El usuario solo puede acceder a recursos de su propio negocio
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'super_admin':
            return True
        
        # Verificar que el objeto pertenece al mismo negocio del usuario
        if hasattr(obj, 'business'):
            return obj.business == request.user.business
        elif isinstance(obj, Business):
            return obj == request.user.business
        
        return False


# =============================================================================
# BASE VIEWSET WITH BUSINESS CHECK
# =============================================================================

class BusinessRequiredMixin:
    """
    Mixin que verifica que el usuario tenga un negocio asignado
    antes de realizar operaciones de creación o actualización
    """
    def check_user_has_business(self):
        """Verifica que el usuario tenga un negocio asignado"""
        if not self.request.user.business:
            return Response({
                'error': 'No tienes un negocio asignado. Contacta al administrador.'
            }, status=status.HTTP_400_BAD_REQUEST)
        return None
    
    def create(self, request, *args, **kwargs):
        """Override create para validar business"""
        error_response = self.check_user_has_business()
        if error_response:
            return error_response
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Override update para validar business"""
        error_response = self.check_user_has_business()
        if error_response:
            return error_response
        return super().update(request, *args, **kwargs)
    
    def get_queryset(self):
        """Override get_queryset para retornar vacío si no hay business"""
        if not self.request.user.business:
            return self.queryset.model.objects.none()
        return super().get_queryset()


# =============================================================================
# AUTH VIEWS
# =============================================================================

class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    
    Registrar nuevo usuario + negocio.
    Crea automáticamente:
    - Usuario con rol business_owner
    - Negocio con slug único
    - Subscripción gratuita con 30 días de prueba
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'business': {
                'id': str(user.business.id),
                'name': user.business.name,
                'slug': user.business.slug
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': '¡Cuenta creada exitosamente! Tienes 30 días de prueba gratis.'
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    
    Cerrar sesión (blacklist del token)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                'message': 'Sesión cerrada exitosamente'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Token inválido'
            }, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    
    Cambiar contraseña del usuario autenticado
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            # Verificar contraseña actual
            if not request.user.check_password(serializer.data.get('old_password')):
                return Response({
                    'old_password': ['Contraseña incorrecta']
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Establecer nueva contraseña
            request.user.set_password(serializer.data.get('new_password'))
            request.user.save()
            
            return Response({
                'message': 'Contraseña actualizada exitosamente'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """
    GET /api/auth/me/
    
    Obtener información del usuario autenticado
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_data = UserSerializer(request.user).data
        
        # Agregar información del negocio
        if request.user.business:
            business_data = BusinessSerializer(request.user.business).data
            
            # Agregar información de la subscripción
            try:
                subscription = Subscription.objects.get(business=request.user.business)
                subscription_data = SubscriptionSerializer(subscription).data
            except Subscription.DoesNotExist:
                subscription_data = None
            
            return Response({
                'user': user_data,
                'business': business_data,
                'subscription': subscription_data
            })
        
        return Response({'user': user_data})


# =============================================================================
# SUBSCRIPTION PLANS (Público)
# =============================================================================

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/plans/ - Listar planes disponibles
    GET /api/plans/{id}/ - Ver detalle de un plan
    
    Solo lectura. Los planes son gestionados por super admin via Django Admin.
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by('price_monthly')
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]


# =============================================================================
# BUSINESS VIEWSET
# =============================================================================

class BusinessViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para el negocio.
    Cada usuario solo puede ver/editar su propio negocio.
    """
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManagerOrSuperAdmin]
    
    def get_queryset(self):
        """Filtrar solo el negocio del usuario"""
        if self.request.user.role == 'super_admin':
            return Business.objects.all()
        return Business.objects.filter(id=self.request.user.business.id)
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return BusinessUpdateSerializer
        return BusinessSerializer
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        GET /api/businesses/me/ - Obtener MI negocio
        PATCH /api/businesses/me/ - Actualizar MI negocio
        
        Cualquier usuario autenticado puede ver su propio negocio.
        Solo business_owner y manager pueden editarlo.
        """
        business = request.user.business
        
        if not business:
            return Response(
                {'detail': 'No tienes un negocio asignado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if request.method == 'GET':
            serializer = self.get_serializer(business)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # Solo dueño o manager pueden editar
            if request.user.role not in ['business_owner', 'manager', 'super_admin']:
                return Response(
                    {'detail': 'No tienes permiso para editar el negocio'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = BusinessUpdateSerializer(business, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


# =============================================================================
# SERVICES VIEWSET
# =============================================================================

class ServiceViewSet(BusinessRequiredMixin, viewsets.ModelViewSet):
    """
    CRUD de servicios filtrado por negocio del usuario con optimizaciones.
    """
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Service.objects.all()
    
    def get_queryset(self):
        """Solo servicios del negocio del usuario"""
        try:
            if not self.request.user.business:
                return Service.objects.none()
            return Service.objects.filter(
                business=self.request.user.business
            ).select_related('business').order_by('name')
        except Exception as e:
            return Service.objects.none()

    def get_permissions(self):
        # Lectura para todo el staff; mutaciones solo owner/manager/super_admin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageCatalog()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Asignar automáticamente el negocio al crear"""
        try:
            serializer.save(business=self.request.user.business)
        except Exception as e:
            raise serializers.ValidationError(f'Error al crear servicio: {str(e)}')


# =============================================================================
# PROFESSIONALS VIEWSET
# =============================================================================

class ProfessionalViewSet(BusinessRequiredMixin, viewsets.ModelViewSet):
    """
    CRUD de profesionales filtrado por negocio con optimizaciones.
    """
    serializer_class = ProfessionalSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Professional.objects.all()
    
    def get_queryset(self):
        """Solo profesionales del negocio del usuario"""
        try:
            if not self.request.user.business:
                return Professional.objects.none()
            return Professional.objects.filter(
                business=self.request.user.business
            ).select_related('business', 'user').prefetch_related('services').order_by('name')
        except Exception as e:
            return Professional.objects.none()

    def get_permissions(self):
        # Lectura para todo el staff; mutaciones solo owner/manager/super_admin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageCatalog()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Asignar automáticamente el negocio al crear"""
        try:
            serializer.save(business=self.request.user.business)
        except Exception as e:
            raise serializers.ValidationError(f'Error al crear profesional: {str(e)}')
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        GET /api/professionals/available/
        
        Solo profesionales activos que aceptan reservas online
        """
        try:
            professionals = self.get_queryset().filter(
                is_active=True,
                accepts_online_bookings=True
            )
            serializer = self.get_serializer(professionals, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': f'Error al obtener profesionales disponibles: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# CLIENTS VIEWSET
# =============================================================================

class ClientViewSet(BusinessRequiredMixin, viewsets.ModelViewSet):
    """
    CRUD de clientes filtrado por negocio con optimizaciones.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Client.objects.all()
    
    def get_queryset(self):
        """Solo clientes del negocio del usuario"""
        try:
            if not self.request.user.business:
                return Client.objects.none()
            
            queryset = Client.objects.filter(
                business=self.request.user.business
            ).select_related('business').order_by('-created_at')
            
            # Filtro de búsqueda
            search = self.request.query_params.get('search', None)
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(phone__icontains=search) |
                    Q(email__icontains=search)
                )
            
            # Filtro VIP
            is_vip = self.request.query_params.get('is_vip', None)
            if is_vip is not None:
                queryset = queryset.filter(is_vip=is_vip.lower() == 'true')
            
            return queryset
        except Exception as e:
            return Client.objects.none()

    def get_permissions(self):
        # Crear/editar: owner, manager, receptionist, super_admin
        if self.action in ['create', 'update', 'partial_update', 'toggle_vip']:
            return [permissions.IsAuthenticated(), CanManageClients()]

        # Eliminar: solo owner/manager/super_admin
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsOwnerOrManagerOrSuperAdmin()]

        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ClientCreateSerializer
        return ClientSerializer
    
    def perform_create(self, serializer):
        """Asignar automáticamente el negocio al crear"""
        try:
            serializer.save(business=self.request.user.business)
        except Exception as e:
            raise serializers.ValidationError(f'Error al crear cliente: {str(e)}')
    
    @action(detail=False, methods=['get'])
    def vip(self, request):
        """
        GET /api/clients/vip/
        
        Solo clientes VIP
        """
        try:
            clients = self.get_queryset().filter(is_vip=True)
            serializer = self.get_serializer(clients, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': f'Error al obtener clientes VIP: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def toggle_vip(self, request, pk=None):
        """
        POST /api/clients/{id}/toggle_vip/
        
        Marcar/desmarcar como VIP
        """
        try:
            client = self.get_object()
            client.is_vip = not client.is_vip
            client.save()
            
            serializer = self.get_serializer(client)
            return Response({
                'message': f'Cliente {"marcado" if client.is_vip else "desmarcado"} como VIP',
                'client': serializer.data
            })
        except Client.DoesNotExist:
            return Response({
                'error': 'Cliente no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Error al actualizar cliente: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# AVAILABILITY VIEWSETS (Bloque 8)
# =============================================================================

class AvailabilityRuleViewSet(BusinessRequiredMixin, viewsets.ModelViewSet):
    """
    CRUD de reglas de disponibilidad optimizado con queries eficientes.
    """

    serializer_class = AvailabilityRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = AvailabilityRule.objects.all()

    def get_queryset(self):
        try:
            if not self.request.user.business:
                return AvailabilityRule.objects.none()

            queryset = AvailabilityRule.objects.filter(
                business=self.request.user.business
            ).select_related('business', 'professional')
            
            professional_id = self.request.query_params.get('professional_id')
            weekday = self.request.query_params.get('weekday')

            if professional_id:
                queryset = queryset.filter(professional_id=professional_id)
            if weekday is not None:
                queryset = queryset.filter(weekday=weekday)

            return queryset.order_by('professional_id', 'weekday', 'start_time')
        except Exception as e:
            # Log error pero no dejar que rompa la query
            return AvailabilityRule.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageCatalog()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        try:
            serializer.save(business=self.request.user.business)
        except Exception as e:
            raise serializers.ValidationError(f'Error al crear regla: {str(e)}')


class AvailabilityExceptionViewSet(BusinessRequiredMixin, viewsets.ModelViewSet):
    """
    CRUD de excepciones de disponibilidad optimizado con queries eficientes.
    """

    serializer_class = AvailabilityExceptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = AvailabilityException.objects.all()

    def get_queryset(self):
        try:
            if not self.request.user.business:
                return AvailabilityException.objects.none()

            queryset = AvailabilityException.objects.filter(
                business=self.request.user.business
            ).select_related('business', 'professional')
            
            professional_id = self.request.query_params.get('professional_id')
            date_from = self.request.query_params.get('date_from')
            date_to = self.request.query_params.get('date_to')

            if professional_id:
                queryset = queryset.filter(professional_id=professional_id)
            if date_from:
                queryset = queryset.filter(date__gte=date_from)
            if date_to:
                queryset = queryset.filter(date__lte=date_to)

            return queryset.order_by('-date', 'start_time')
        except Exception as e:
            # Log error pero no dejar que rompa la query
            return AvailabilityException.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManageCatalog()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        try:
            serializer.save(business=self.request.user.business)
        except Exception as e:
            raise serializers.ValidationError(f'Error al crear excepción: {str(e)}')


# =============================================================================
# PLATFORM ADMIN VIEWSET (Super Admin Only)
# =============================================================================

class PlatformAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet exclusivo para super_admin.
    Permite gestionar todos los negocios de la plataforma con estadísticas completas.
    
    Endpoints:
    - GET /api/platform/businesses/ - Listar todos los negocios con stats
    - GET /api/platform/businesses/{id}/ - Ver detalle de un negocio
    - PATCH /api/platform/businesses/{id}/ - Actualizar negocio
    - POST /api/platform/businesses/{id}/toggle_active/ - Activar/desactivar negocio
    """
    queryset = Business.objects.all().order_by('-created_at')
    permission_classes = [IsSuperAdmin]
    
    def get_serializer_class(self):
        """Usar BusinessStatsSerializer para listar y detalles"""
        # Import here to avoid circular dependency
        from .serializers import BusinessStatsSerializer
        return BusinessStatsSerializer
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/platform/businesses/
        
        Listar todos los negocios con estadísticas
        """
        queryset = self.get_queryset()
        
        # Filtros opcionales
        is_active = request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        is_verified = request.query_params.get('is_verified', None)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
        
        business_type = request.query_params.get('business_type', None)
        if business_type:
            queryset = queryset.filter(business_type=business_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        POST /api/platform/businesses/{id}/toggle_active/
        
        Activar/desactivar un negocio
        """
        business = self.get_object()
        business.is_active = not business.is_active
        business.save()
        
        serializer = self.get_serializer(business)
        return Response({
            'message': f'Negocio {"activado" if business.is_active else "desactivado"} exitosamente',
            'business': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def toggle_verified(self, request, pk=None):
        """
        POST /api/platform/businesses/{id}/toggle_verified/
        
        Verificar/desverificar un negocio
        """
        business = self.get_object()
        business.is_verified = not business.is_verified
        business.save()
        
        serializer = self.get_serializer(business)
        return Response({
            'message': f'Negocio {"verificado" if business.is_verified else "desverificado"} exitosamente',
            'business': serializer.data
        })


# =============================================================================
# PUBLIC VIEWS (Para portal de reservas)
# =============================================================================

class PublicBusinessDetailView(APIView):
    """
    GET /api/public/businesses/{slug}/
    
    Ver información pública de un negocio (para portal de reservas)
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, slug):
        try:
            business = Business.objects.get(slug=slug, is_active=True)
            serializer = BusinessSerializer(business)
            return Response(serializer.data)
        except Business.DoesNotExist:
            return Response({
                'error': 'Negocio no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# ONBOARDING PROGRESS VIEWSET
# =============================================================================

class OnboardingProgressViewSet(viewsets.GenericViewSet):
    """
    ViewSet para gestionar el progreso de onboarding de nuevos usuarios.
    
    El onboarding guía a los nuevos negocios a través de la configuración inicial
    con un sistema de pasos que se completan automáticamente mediante signals
    o manualmente mediante la API.
    
    Endpoints:
    - GET /api/onboarding/ - Obtener progreso actual del usuario
    - GET /api/onboarding/status/ - Quick check del porcentaje de completado
    - POST /api/onboarding/mark_step/ - Marcar un paso como completado manualmente
    - POST /api/onboarding/dismiss/ - Descartar el wizard de onboarding
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OnboardingProgressSerializer
    
    def get_queryset(self):
        """
        Filtrar para obtener solo el progreso del negocio del usuario actual.
        """
        return OnboardingProgress.objects.filter(business=self.request.user.business)
    
    def list(self, request):
        """
        GET /api/onboarding/
        
        Obtener el progreso completo de onboarding del usuario actual.
        
        Returns:
            - 200: Progreso de onboarding con todos los pasos y porcentaje
            - 404: No existe progreso (negocio sin OnboardingProgress)
        """
        try:
            # Obtener o crear el progreso de onboarding para el negocio del usuario
            onboarding, created = OnboardingProgress.objects.get_or_create(
                business=request.user.business
            )
            
            serializer = self.get_serializer(onboarding)
            
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Progreso de onboarding obtenido correctamente'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error al obtener progreso: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        GET /api/onboarding/status/
        
        Quick check del estado de onboarding (solo porcentaje y estado de completado).
        Útil para mostrar progreso en la UI sin cargar todos los detalles.
        
        Returns:
            - 200: Porcentaje de completado y estado
        """
        try:
            onboarding, created = OnboardingProgress.objects.get_or_create(
                business=request.user.business
            )
            
            return Response({
                'success': True,
                'data': {
                    'completion_percentage': onboarding.completion_percentage,
                    'is_completed': onboarding.is_completed,
                    'is_dismissed': onboarding.is_dismissed,
                    'pending_steps_count': len(onboarding.pending_steps),
                    'completed_steps_count': len(onboarding.completed_steps)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error al obtener estado: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def mark_step(self, request):
        """
        POST /api/onboarding/mark_step/
        
        Marcar un paso específico como completado manualmente.
        Útil para pasos que no se pueden detectar automáticamente
        (ej: has_tested_public_booking, has_customized_branding).
        
        Body params:
            - step_key (str): Nombre del campo del paso a marcar
              Opciones: has_created_service, has_configured_hours, 
                       has_created_professional, has_customized_branding,
                       has_created_first_appointment, has_invited_team_member,
                       has_tested_public_booking
            - completed (bool): True para marcar como completado, False para desmarcar
        
        Returns:
            - 200: Paso marcado correctamente con progreso actualizado
            - 400: Parámetros inválidos
        """
        serializer = OnboardingStepUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            onboarding, created = OnboardingProgress.objects.get_or_create(
                business=request.user.business
            )
            
            step_key = serializer.validated_data['step_key']
            completed = serializer.validated_data['completed']
            
            # Actualizar el paso específico
            if completed:
                # Marcar como completado usando el método del modelo
                onboarding.mark_step_completed(step_key)
            else:
                # Desmarcar el paso
                setattr(onboarding, step_key, False)
                # Si se desmarca un paso, el onboarding ya no está completado
                if onboarding.is_completed:
                    onboarding.is_completed = False
                onboarding.save()
            
            # Refrescar desde la BD para obtener propiedades calculadas actualizadas
            onboarding.refresh_from_db()
            
            response_serializer = OnboardingProgressSerializer(onboarding)
            
            return Response({
                'success': True,
                'data': response_serializer.data,
                'message': f'Paso "{step_key}" {"completado" if completed else "desmarcado"} correctamente'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error al actualizar paso: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def dismiss(self, request):
        """
        POST /api/onboarding/dismiss/
        
        Descartar/saltar el wizard de onboarding.
        El usuario indica que no quiere seguir el proceso guiado,
        pero aún puede ver el checklist en el dashboard.
        
        Returns:
            - 200: Onboarding descartado correctamente
        """
        try:
            onboarding, created = OnboardingProgress.objects.get_or_create(
                business=request.user.business
            )
            
            # Usar el método del modelo para descartar
            onboarding.dismiss_onboarding()
            
            response_serializer = OnboardingProgressSerializer(onboarding)
            
            return Response({
                'success': True,
                'data': response_serializer.data,
                'message': 'Onboarding descartado. Puedes retomarlo en cualquier momento desde el dashboard.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error al descartar onboarding: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicServicesView(APIView):
    """
    GET /api/public/businesses/{slug}/services/
    
    Listar servicios disponibles para reserva online
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, slug):
        try:
            business = Business.objects.get(slug=slug, is_active=True)
            services = Service.objects.filter(
                business=business,
                is_active=True,
                allow_online_booking=True
            )
            serializer = ServiceSerializer(services, many=True)
            return Response(serializer.data)
        except Business.DoesNotExist:
            return Response({
                'error': 'Negocio no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)


class PublicProfessionalsView(APIView):
    """
    GET /api/public/businesses/{slug}/professionals/
    
    Listar profesionales disponibles para reserva online
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, slug):
        try:
            business = Business.objects.get(slug=slug, is_active=True)
            professionals = Professional.objects.filter(
                business=business,
                is_active=True,
                accepts_online_bookings=True
            ).prefetch_related('services')
            serializer = ProfessionalSerializer(professionals, many=True)
            return Response(serializer.data)
        except Business.DoesNotExist:
            return Response({
                'error': 'Negocio no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

