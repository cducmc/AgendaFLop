/**
 * =============================================================================
 * REPORTS - Página de Reportes y Analytics (Bloque 6)
 * =============================================================================
 * 
 * Dashboard completo de reportes con múltiples categorías:
 * - Citas: Métricas, tendencias, tasas de conversión
 * - Ingresos: Revenue, ticket promedio, proyecciones
 * - Clientes: Retención, nuevos vs recurrentes
 * - Profesionales: Desempeño, utilización
 * - Operaciones: Ocupación, eficiencia
 * 
 * Características:
 * - Selector de rango de fechas
 * - Comparación con periodo anterior
 * - Exportación a PDF/Excel
 * - Gráficas interactivas
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  BarChart3,
  Download,
  RefreshCw,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusPieChart from '../components/charts/StatusPieChart';
import RevenueComparisonChart from '../components/charts/RevenueComparisonChart';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

/**
 * Componente principal de Reportes
 */
function Reports() {
  // Estado de tabs
  const [activeTab, setActiveTab] = useState('appointments');
  
  // Estado de rango de fechas
  const [dateRange, setDateRange] = useState('last_30_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Estado de datos
  const [appointmentsData, setAppointmentsData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [clientsData, setClientsData] = useState(null);
  const [professionalsData, setProfessionalsData] = useState(null);
  const [operationsData, setOperationsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  /**
   * Calcular fechas según el rango seleccionado
   */
  const getDateRangeParams = () => {
    const today = new Date();
    let start_date, end_date;
    
    switch (dateRange) {
      case 'today':
        start_date = format(today, 'yyyy-MM-dd');
        end_date = format(today, 'yyyy-MM-dd');
        break;
      case 'last_7_days':
        start_date = format(subDays(today, 7), 'yyyy-MM-dd');
        end_date = format(today, 'yyyy-MM-dd');
        break;
      case 'last_30_days':
        start_date = format(subDays(today, 30), 'yyyy-MM-dd');
        end_date = format(today, 'yyyy-MM-dd');
        break;
      case 'this_month':
        start_date = format(startOfMonth(today), 'yyyy-MM-dd');
        end_date = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'this_week':
        start_date = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        end_date = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'custom':
        start_date = customStartDate;
        end_date = customEndDate;
        break;
      default:
        start_date = format(subDays(today, 30), 'yyyy-MM-dd');
        end_date = format(today, 'yyyy-MM-dd');
    }
    
    return { start_date, end_date };
  };
  
  /**
   * Cargar datos de reportes
   */
  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = getDateRangeParams();
      
      // Cargar reportes en paralelo
      const [appointmentsRes, revenueRes, clientsRes, professionalsRes, operationsRes] = await Promise.all([
        reportsAPI.getAppointmentsSummary(params),
        reportsAPI.getRevenueSummary(params),
        reportsAPI.getClientsSummary(params),
        reportsAPI.getProfessionalsSummary(params),
        reportsAPI.getOperationsSummary(params),
      ]);
      
      setAppointmentsData(appointmentsRes.data.data);
      setRevenueData(revenueRes.data.data);
      setClientsData(clientsRes.data.data);
      setProfessionalsData(professionalsRes.data.data);
      setOperationsData(operationsRes.data.data);
      
    } catch (err) {
      console.error('Error cargando reportes:', err);
      setError('Error al cargar los reportes. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Cargar datos al montar y cuando cambia el rango
   */
  useEffect(() => {
    loadReportsData();
  }, [dateRange, customStartDate, customEndDate]);
  
  /**
   * Renderizar indicador de cambio (↑↓)
   */
  const renderTrendIndicator = (trend) => {
    if (trend === 'up') {
      return <ArrowUp className="w-4 h-4 text-green-600" />;
    } else if (trend === 'down') {
      return <ArrowDown className="w-4 h-4 text-red-600" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };
  
  /**
   * Renderizar indicador de cambio porcentual con color
   */
  const renderChangePercent = (percent) => {
    if (!percent || percent === 0) {
      return <span className="text-gray-500">0%</span>;
    }
    
    const isPositive = percent > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? '↑' : '↓';
    
    return (
      <span className={`${color} font-medium flex items-center gap-1`}>
        {icon} {Math.abs(percent).toFixed(1)}%
      </span>
    );
  };
  
  /**
   * Exportar datos a Excel
   */
  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const dateParams = getDateRangeParams();
      const fileName = `Reporte_${activeTab}_${dateParams.start_date}_${dateParams.end_date}.xlsx`;
      
      // Exportar según el tab activo
      if (activeTab === 'appointments' && appointmentsData) {
        const data = [
          ['REPORTE DE CITAS'],
          ['Periodo', `${appointmentsData.period.start} al ${appointmentsData.period.end}`],
          [],
          ['MÉTRICAS GENERALES'],
          ['Total de Citas', appointmentsData.total],
          ['Tasa de Completación', `${appointmentsData.completion_rate}%`],
          ['Tasa de Cancelación', `${appointmentsData.cancellation_rate}%`],
          ['Promedio por Día', appointmentsData.average_per_day.toFixed(1)],
          ['Tendencia', appointmentsData.trend === 'up' ? 'Al alza' : appointmentsData.trend === 'down' ? 'A la baja' : 'Estable'],
          [],
          ['DISTRIBUCIÓN POR ESTADO'],
          ['Estado', 'Cantidad'],
          ['Pendientes', appointmentsData.by_status.pending],
          ['Confirmadas', appointmentsData.by_status.confirmed],
          ['Completadas', appointmentsData.by_status.completed],
          ['Canceladas', appointmentsData.by_status.cancelled],
          ['No asistió', appointmentsData.by_status.no_show],
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Citas');
      } else if (activeTab === 'revenue' && revenueData) {
        const data = [
          ['REPORTE DE INGRESOS'],
          [],
          ['MÉTRICAS GENERALES'],
          ['Ingresos Totales', `$${revenueData.total_revenue.toLocaleString()}`],
          ['Ticket Promedio', `$${revenueData.average_ticket.toFixed(2)}`],
          ['Citas Completadas', revenueData.total_appointments],
          ['Proyección Mensual', `$${revenueData.projected_monthly.toLocaleString()}`],
          [],
          ['COMPARACIÓN CON PERIODO ANTERIOR'],
          ['Periodo Actual', `$${revenueData.total_revenue.toLocaleString()}`],
          ['Periodo Anterior', `$${revenueData.comparison.previous_period.toLocaleString()}`],
          ['Cambio', `${revenueData.comparison.change_percent.toFixed(1)}%`],
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ingresos');
      } else if (activeTab === 'clients' && clientsData) {
        const data = [
          ['REPORTE DE CLIENTES'],
          [],
          ['MÉTRICAS GENERALES'],
          ['Total de Clientes', clientsData.total_clients],
          ['Clientes Nuevos', clientsData.new_clients],
          ['Clientes Recurrentes', clientsData.recurring_clients],
          ['Tasa de Retención', `${clientsData.retention_rate.toFixed(1)}%`],
          ['Tasa de Abandono', `${clientsData.churn_rate.toFixed(1)}%`],
          [],
          ['MEJORES CLIENTES'],
          ['Nombre', 'Email', 'Citas', 'Ingresos'],
          ...clientsData.top_clients.map(c => [c.name, c.email, c.appointments, `$${c.revenue.toLocaleString()}`]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
      } else if (activeTab === 'professionals' && professionalsData) {
        const data = [
          ['REPORTE DE PROFESIONALES'],
          [],
          ['MÉTRICAS GENERALES'],
          ['Total de Profesionales', professionalsData.total_professionals],
          ['Promedio de Citas', professionalsData.average_appointments.toFixed(1)],
          ['Ingreso Promedio', `$${professionalsData.average_revenue.toLocaleString()}`],
          [],
          ['DESEMPEÑO POR PROFESIONAL'],
          ['Nombre', 'Citas', 'Tasa Completación', 'Ingresos'],
          ...professionalsData.professionals.map(p => [
            p.name, 
            p.appointments, 
            `${p.completion_rate.toFixed(0)}%`, 
            `$${p.revenue.toLocaleString()}`
          ]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Profesionales');
      } else if (activeTab === 'operations' && operationsData) {
        const data = [
          ['REPORTE DE OPERACIONES'],
          [],
          ['MÉTRICAS GENERALES'],
          ['Duración Promedio', `${operationsData.average_duration.toFixed(0)} minutos`],
          ['Tasa de Utilización', `${operationsData.utilization_rate.toFixed(1)}%`],
          ['Total de Citas', operationsData.total_appointments],
          [],
          ['HORAS MÁS OCUPADAS'],
          ['Hora', 'Citas'],
          ...operationsData.peak_hours.map(h => [h.hour, h.appointments]),
          [],
          ['DÍAS MÁS OCUPADOS'],
          ['Día', 'Citas'],
          ...operationsData.peak_days.map(d => [d.day, d.appointments]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Operaciones');
      }
      
      // Descargar archivo
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error('Error al exportar:', err);
      setError('Error al exportar el reporte. Por favor, intenta de nuevo.');
    }
  };

  /**
   * Exportar reporte a PDF mediante backend
   */
  const exportToPdf = async () => {
    try {
      const params = {
        ...getDateRangeParams(),
        report_type: activeTab,
      };

      const response = await reportsAPI.exportPdf(params);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const datePart = format(new Date(), 'yyyyMMdd');
      link.href = downloadUrl;
      link.download = `Reporte_${activeTab}_${datePart}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      setError('Error al exportar el PDF. Por favor, intenta de nuevo.');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              Reportes y Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Visualiza el desempeño de tu negocio con métricas detalladas
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={exportToPdf}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
            <button
              onClick={loadReportsData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
        
        {/* Selector de rango de fechas */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Periodo:
            </label>
            
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'today', label: 'Hoy' },
                { value: 'last_7_days', label: 'Últimos 7 días' },
                { value: 'last_30_days', label: 'Últimos 30 días' },
                { value: 'this_week', label: 'Esta semana' },
                { value: 'this_month', label: 'Este mes' },
                { value: 'custom', label: 'Personalizado' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === option.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Inputs de fechas personalizadas */}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-500">hasta</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Tabs de categorías */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'appointments', label: 'Citas', icon: Calendar },
              { id: 'revenue', label: 'Ingresos', icon: DollarSign },
              { id: 'clients', label: 'Clientes', icon: Users },
              { id: 'professionals', label: 'Profesionales', icon: Briefcase },
              { id: 'operations', label: 'Operaciones', icon: TrendingUp },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          {/* Contenido de tabs */}
          <div className="p-6">
            {activeTab === 'appointments' && appointmentsData && (
              <AppointmentsReport data={appointmentsData} />
            )}
            {activeTab === 'revenue' && revenueData && (
              <RevenueReport data={revenueData} />
            )}
            {activeTab === 'clients' && clientsData && (
              <ClientsReport data={clientsData} />
            )}
            {activeTab === 'professionals' && professionalsData && (
              <ProfessionalsReport data={professionalsData} />
            )}
            {activeTab === 'operations' && operationsData && (
              <OperationsReport data={operationsData} />
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

/**
 * Componente de reporte de citas
 */
function AppointmentsReport({ data }) {
  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total de Citas"
          value={data.total}
          icon={Calendar}
          color="indigo"
        />
        <MetricCard
          label="Tasa de Completación"
          value={`${data.completion_rate}%`}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          label="Tasa de Cancelación"
          value={`${data.cancellation_rate}%`}
          icon={TrendingUp}
          color="red"
        />
        <MetricCard
          label="Promedio por Día"
          value={data.average_per_day.toFixed(1)}
          icon={Calendar}
          color="purple"
        />
      </div>
      
      {/* Gráfico de distribución por estado */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Distribución por Estado
        </h3>
        <StatusPieChart data={data.by_status} />
      </div>
      
      {/* Distribución por estado - Vista de tabla */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detalle por Estado
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(data.by_status).map(([status, count]) => {
            const statusConfig = {
              pending: { label: 'Pendientes', textColor: 'text-yellow-600' },
              confirmed: { label: 'Confirmadas', textColor: 'text-blue-600' },
              completed: { label: 'Completadas', textColor: 'text-green-600' },
              cancelled: { label: 'Canceladas', textColor: 'text-red-600' },
              no_show: { label: 'No asistió', textColor: 'text-gray-600' },
            };
            
            const config = statusConfig[status];
            
            return (
              <div key={status} className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <div className={`text-3xl font-bold ${config.textColor}`}>
                  {count}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {config.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Periodo y tendencia */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-indigo-900">Periodo:</span>
            <span className="ml-2 text-sm text-indigo-700">
              {data.period.start} al {data.period.end}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-indigo-900">Tendencia:</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.trend === 'up' ? 'bg-green-100 text-green-700' :
              data.trend === 'down' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {data.trend === 'up' ? '↑ Al alza' : 
               data.trend === 'down' ? '↓ A la baja' : 
               '→ Estable'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de reporte de ingresos
 */
function RevenueReport({ data }) {
  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Ingresos Totales"
          value={`$${data.total_revenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          change={data.comparison.change_percent}
        />
        <MetricCard
          label="Ticket Promedio"
          value={`$${data.average_ticket.toFixed(2)}`}
          icon={TrendingUp}
          color="blue"
        />
        <MetricCard
          label="Citas Completadas"
          value={data.total_appointments}
          icon={Calendar}
          color="indigo"
        />
        <MetricCard
          label="Proyección Mensual"
          value={`$${data.projected_monthly.toLocaleString()}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>
      
      {/* Gráfico de comparación */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparación con Periodo Anterior
        </h3>
        <RevenueComparisonChart
          currentRevenue={data.total_revenue}
          previousRevenue={data.comparison.previous_period}
          changePercent={data.comparison.change_percent}
        />
      </div>
      
      {/* Comparación con periodo anterior - Vista de tabla */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen de Comparación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600">Periodo Actual</div>
            <div className="text-2xl font-bold text-green-700">
              ${data.total_revenue.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Periodo Anterior</div>
            <div className="text-2xl font-bold text-gray-700">
              ${data.comparison.previous_period.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Cambio</div>
            <div className={`text-2xl font-bold ${
              data.comparison.change_percent > 0 ? 'text-green-600' : 
              data.comparison.change_percent < 0 ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {data.comparison.change_percent > 0 ? '+' : ''}
              {data.comparison.change_percent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Card de métrica reutilizable
 */
function MetricCard({ label, value, icon: Icon, color = 'indigo', change }) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">{label}</div>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          {change !== undefined && (
            <div className={`text-sm mt-2 flex items-center gap-1 ${
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de reporte de clientes
 */
function ClientsReport({ data }) {
  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total de Clientes"
          value={data.total_clients}
          icon={Users}
          color="indigo"
        />
        <MetricCard
          label="Clientes Nuevos"
          value={data.new_clients}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          label="Clientes Recurrentes"
          value={data.recurring_clients}
          icon={Users}
          color="blue"
        />
        <MetricCard
          label="Tasa de Retención"
          value={`${data.retention_rate}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>
      
      {/* Tasas de retención y churn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tasa de Retención
          </h3>
          <div className="text-4xl font-bold text-green-600">
            {data.retention_rate.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Clientes que regresan después de su primera cita
          </p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tasa de Abandono
          </h3>
          <div className="text-4xl font-bold text-red-600">
            {data.churn_rate.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Clientes que no han regresado
          </p>
        </div>
      </div>
      
      {/* Top clientes */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mejores Clientes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Citas</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {data.top_clients.map((client, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{client.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{client.email}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-900 font-medium">
                    {client.appointments}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-green-600 font-semibold">
                    ${client.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de reporte de profesionales
 */
function ProfessionalsReport({ data }) {
  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total de Profesionales"
          value={data.total_professionals}
          icon={Briefcase}
          color="indigo"
        />
        <MetricCard
          label="Promedio de Citas"
          value={data.average_appointments.toFixed(1)}
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          label="Ingreso Promedio"
          value={`$${data.average_revenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
      </div>
      
      {/* Tabla de profesionales */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Desempeño por Profesional
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Profesional</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Citas</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Tasa Completación</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {data.professionals.map((prof, index) => (
                <tr key={prof.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">{prof.name}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-900">
                    {prof.appointments}
                  </td>
                  <td className="py-3 px-4 text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      prof.completion_rate >= 80 ? 'bg-green-100 text-green-700' :
                      prof.completion_rate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {prof.completion_rate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-green-600 font-semibold">
                    ${prof.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de reporte de operaciones
 */
function OperationsReport({ data }) {
  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Duración Promedio"
          value={`${data.average_duration.toFixed(0)} min`}
          icon={TrendingUp}
          color="indigo"
        />
        <MetricCard
          label="Tasa de Utilización"
          value={`${data.utilization_rate.toFixed(1)}%`}
          icon={BarChart3}
          color="purple"
        />
        <MetricCard
          label="Total de Citas"
          value={data.total_appointments}
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          label="Ocupación"
          value={data.utilization_rate >= 75 ? 'Alta' : data.utilization_rate >= 50 ? 'Media' : 'Baja'}
          icon={TrendingUp}
          color={data.utilization_rate >= 75 ? 'green' : data.utilization_rate >= 50 ? 'yellow' : 'red'}
        />
      </div>
      
      {/* Análisis de horas pico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Horas Más Ocupadas
          </h3>
          <div className="space-y-3">
            {data.peak_hours.map((hour, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded ${
                    index === 0 ? 'bg-indigo-600 text-white' :
                    index === 1 ? 'bg-indigo-500 text-white' :
                    'bg-indigo-400 text-white'
                  }`}>
                    #{index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{hour.hour}</span>
                </div>
                <span className="text-indigo-600 font-bold">{hour.appointments} citas</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Días Más Ocupados
          </h3>
          <div className="space-y-3">
            {data.peak_days.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-gray-900">{day.day}</span>
                <span className="text-purple-600 font-bold">{day.appointments} citas</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Indicador de ocupación */}
      <div className={`rounded-lg p-6 border ${
        data.utilization_rate >= 75 ? 'bg-green-50 border-green-200' :
        data.utilization_rate >= 50 ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Análisis de Ocupación
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    data.utilization_rate >= 75 ? 'bg-green-600' :
                    data.utilization_rate >= 50 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(data.utilization_rate, 100)}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {data.utilization_rate.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {data.utilization_rate >= 75 ? 
                'Excelente utilización del tiempo disponible. El negocio está operando eficientemente.' :
                data.utilization_rate >= 50 ?
                'Buena utilización. Hay oportunidad de optimizar los horarios.' :
                'Baja utilización. Considera ajustar disponibilidad u optimizar marketing.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
