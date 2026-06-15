"""
URLs para la app reports
"""

from django.urls import path
from .views import (
    AppointmentsSummaryView, 
    RevenueSummaryView,
    ClientsSummaryView,
    ProfessionalsSummaryView,
     OperationsSummaryView,
     ExportReportPdfView
)

urlpatterns = [
    # Reportes de Citas
    path('appointments/summary/', 
         AppointmentsSummaryView.as_view(), 
         name='appointments-summary'),
    
    # Reportes de Ingresos
    path('revenue/summary/', 
         RevenueSummaryView.as_view(), 
         name='revenue-summary'),
    
    # Reportes de Clientes
    path('clients/summary/', 
         ClientsSummaryView.as_view(), 
         name='clients-summary'),
    
    # Reportes de Profesionales
    path('professionals/summary/', 
         ProfessionalsSummaryView.as_view(), 
         name='professionals-summary'),
    
    # Reportes de Operaciones
    path('operations/summary/', 
         OperationsSummaryView.as_view(), 
         name='operations-summary'),

    # Exportación PDF
    path('export/pdf/',
         ExportReportPdfView.as_view(),
         name='export-report-pdf'),
]
