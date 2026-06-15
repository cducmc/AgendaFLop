"""
Modelos para el sistema de reportes y analytics
"""

from django.db import models
from django.contrib.auth import get_user_model
from business.models import Business

User = get_user_model()


class ReportTemplate(models.Model):
    """
    Plantillas predefinidas de reportes que los usuarios pueden usar.
    
    Ejemplos:
    - "Resumen Semanal de Citas"
    - "Ingresos Mensuales"
    - "Top 10 Clientes"
    - "Desempeño de Profesionales"
    
    Los templates definen qué métricas incluir y cómo visualizarlas.
    """
    
    # Categorías de reportes
    CATEGORY_CHOICES = [
        ('appointments', 'Citas'),
        ('revenue', 'Ingresos'),
        ('clients', 'Clientes'),
        ('professionals', 'Profesionales'),
        ('operations', 'Operaciones'),
        ('custom', 'Personalizado'),
    ]
    
    name = models.CharField(
        max_length=200,
        verbose_name='Nombre del Template',
        help_text='Ej: "Resumen Semanal de Citas"'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de qué incluye el reporte'
    )
    
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='appointments',
        verbose_name='Categoría',
        help_text='Categoría principal del reporte'
    )
    
    # Configuración del template (JSON)
    # Ejemplo: {"metrics": ["total_appointments", "revenue"], "period": "week"}
    config = models.JSONField(
        default=dict,
        verbose_name='Configuración',
        help_text='Configuración JSON del template (métricas, periodo, visualizaciones)'
    )
    
    # Templates del sistema vs personalizados
    is_system = models.BooleanField(
        default=False,
        verbose_name='¿Es del Sistema?',
        help_text='Templates del sistema no pueden ser editados por usuarios'
    )
    
    # Orden para mostrar en UI
    order = models.IntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de presentación (menor = primero)'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='¿Activo?'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Template de Reporte'
        verbose_name_plural = 'Templates de Reportes'
        ordering = ['category', 'order', 'name']
    
    def __str__(self):
        return f"{self.get_category_display()} - {self.name}"


class SavedReport(models.Model):
    """
    Reportes guardados por usuarios para acceso rápido.
    
    Un usuario puede:
    - Guardar reportes personalizados con filtros específicos
    - Marcar reportes como favoritos
    - Programar envío automático por email
    """
    
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='saved_reports',
        verbose_name='Negocio'
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_reports',
        verbose_name='Creado por'
    )
    
    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='saved_reports',
        verbose_name='Template Base',
        help_text='Template del que se derivó este reporte (opcional)'
    )
    
    name = models.CharField(
        max_length=200,
        verbose_name='Nombre del Reporte',
        help_text='Ej: "Citas de Enero 2024"'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    
    # Configuración específica del reporte
    # Ejemplo: {"start_date": "2024-01-01", "end_date": "2024-01-31", "service_id": 5}
    config = models.JSONField(
        default=dict,
        verbose_name='Configuración',
        help_text='Filtros y configuración específica del reporte'
    )
    
    is_favorite = models.BooleanField(
        default=False,
        verbose_name='¿Favorito?',
        help_text='Marcar para acceso rápido'
    )
    
    # Programación de envío automático
    is_scheduled = models.BooleanField(
        default=False,
        verbose_name='¿Programado?',
        help_text='Enviar automáticamente por email'
    )
    
    schedule_frequency = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Diario'),
            ('weekly', 'Semanal'),
            ('monthly', 'Mensual'),
        ],
        blank=True,
        null=True,
        verbose_name='Frecuencia de Envío'
    )
    
    schedule_recipients = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Destinatarios',
        help_text='Lista de emails para envío automático'
    )
    
    last_generated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Última Generación'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Reporte Guardado'
        verbose_name_plural = 'Reportes Guardados'
        ordering = ['-is_favorite', '-created_at']
    
    def __str__(self):
        return f"{self.business.name} - {self.name}"


class ExportHistory(models.Model):
    """
    Historial de exportaciones de reportes (PDF, Excel).
    
    Útil para:
    - Auditoría de qué reportes se generaron
    - Reutilizar archivos ya generados (caché)
    - Analizar qué reportes son más usados
    """
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
    ]
    
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='export_history',
        verbose_name='Negocio'
    )
    
    exported_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='exports',
        verbose_name='Exportado por'
    )
    
    saved_report = models.ForeignKey(
        SavedReport,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='exports',
        verbose_name='Reporte Guardado',
        help_text='Si se exportó desde un reporte guardado'
    )
    
    format = models.CharField(
        max_length=10,
        choices=FORMAT_CHOICES,
        verbose_name='Formato'
    )
    
    file_name = models.CharField(
        max_length=255,
        verbose_name='Nombre del Archivo',
        help_text='Nombre del archivo generado'
    )
    
    file_size = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Tamaño (bytes)',
        help_text='Tamaño del archivo en bytes'
    )
    
    # Ruta del archivo (si se guarda temporalmente)
    file_path = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Ruta del Archivo',
        help_text='Path relativo al MEDIA_ROOT'
    )
    
    # Configuración usada para generar el reporte
    config = models.JSONField(
        default=dict,
        verbose_name='Configuración',
        help_text='Parámetros usados para generar el reporte'
    )
    
    # Metadata adicional
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadata',
        help_text='Información adicional (ej: cantidad de registros, tiempo de generación)'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Exportación')
    
    class Meta:
        verbose_name = 'Historial de Exportación'
        verbose_name_plural = 'Historial de Exportaciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', '-created_at']),
            models.Index(fields=['exported_by', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.business.name} - {self.file_name} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

