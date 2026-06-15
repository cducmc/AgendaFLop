from django.apps import AppConfig


class BusinessConfig(AppConfig):
    name = 'business'
    default_auto_field = 'django.db.models.BigAutoField'
    
    def ready(self):
        """
        Importar signals cuando la app está lista.
        Esto registra los signals automáticamente para el onboarding.
        """
        import business.signals  # noqa
