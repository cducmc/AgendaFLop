from django.apps import AppConfig


class AppointmentsConfig(AppConfig):
    name = 'appointments'
    default_auto_field = 'django.db.models.BigAutoField'
    
    def ready(self):
        """
        Importar signals cuando la app está lista.
        Esto registra los signals automáticamente.
        """
        import appointments.signals  # noqa
