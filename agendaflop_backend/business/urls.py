"""
URLs para la app business
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    LogoutView,
    ChangePasswordView,
    MeView,
    SubscriptionPlanViewSet,
    BusinessViewSet,
    ServiceViewSet,
    ProfessionalViewSet,
    ClientViewSet,
    AvailabilityRuleViewSet,
    AvailabilityExceptionViewSet,
    PlatformAdminViewSet,
    PublicBusinessDetailView,
    PublicServicesView,
    PublicProfessionalsView,
    OnboardingProgressViewSet,
)

# Router para ViewSets
router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='plan')
router.register(r'businesses', BusinessViewSet, basename='business')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'professionals', ProfessionalViewSet, basename='professional')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'availability-rules', AvailabilityRuleViewSet, basename='availability-rule')
router.register(r'availability-exceptions', AvailabilityExceptionViewSet, basename='availability-exception')
router.register(r'platform/businesses', PlatformAdminViewSet, basename='platform-business')
router.register(r'onboarding', OnboardingProgressViewSet, basename='onboarding')

urlpatterns = [
    # =========================================================================
    # AUTH ENDPOINTS
    # =========================================================================
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/me/', MeView.as_view(), name='me'),
    
    # =========================================================================
    # PUBLIC ENDPOINTS (Para portal de reservas)
    # =========================================================================
    path('public/businesses/<slug:slug>/', PublicBusinessDetailView.as_view(), name='public_business_detail'),
    path('public/businesses/<slug:slug>/services/', PublicServicesView.as_view(), name='public_services'),
    path('public/businesses/<slug:slug>/professionals/', PublicProfessionalsView.as_view(), name='public_professionals'),
    
    # =========================================================================
    # ROUTER URLS (ViewSets)
    # =========================================================================
    path('', include(router.urls)),
]
