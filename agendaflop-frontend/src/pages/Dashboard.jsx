/**
 * =============================================================================
 * DASHBOARD - Panel de Control Principal (MEJORADO - Bloque 2)
 * =============================================================================
 * 
 * Dashboard profesional con estadísticas avanzadas y visualizaciones:
 * - Métricas principales (citas, estados, ingresos)
 * - Gráfica de tendencia de citas (últimos 30 días)
 * - Distribución por estado (pie chart)
 * - Ingresos mensuales (bar chart)
 * - Servicios más populares
 * - Citas de hoy
 * - Comparaciones periodo vs periodo
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  CalendarCheck,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentsAPI } from '../services/api';
import AppointmentsTrendChart from '../components/charts/AppointmentsTrendChart';
import StatusDistributionChart from '../components/charts/StatusDistributionChart';
import RevenueBarChart from '../components/charts/RevenueBarChart';
import PopularServicesChart from '../components/charts/PopularServicesChart';
import LoadingSpinner from '../components/LoadingSpinner';
import OnboardingChecklist from '../components/OnboardingChecklist';

function Dashboard() {
  const { user, business } = useAuth();
  
  // Estados para almacenar datos del dashboard
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    this_week: 0,
    this_month: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [popularServicesData, setPopularServicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Cargar todos los datos al montar el componente
   */
  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  /**
   * Obtener todos los datos del dashboard
   */
  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar todos los datos en paralelo
      const [statsRes, todayRes, analyticsRes, revenueRes, servicesRes] = await Promise.all([
        appointmentsAPI.stats(),
        appointmentsAPI.today(),
        appointmentsAPI.analytics(),
        appointmentsAPI.revenue(),
        appointmentsAPI.popularServices(),
      ]);
      
      setStats(statsRes.data);
      setTodayAppointments(todayRes.data);
      setAnalyticsData(analyticsRes.data);
      setRevenueData(revenueRes.data);
      setPopularServicesData(servicesRes.data);
      
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calcular porcentaje de cumplimiento
   */
  const getCompletionRate = () => {
    const total = stats.completed + stats.cancelled;
    if (total === 0) return 0;
    return Math.round((stats.completed / total) * 100);
  };

  /**
   * Componente de tarjeta de estadística reutilizable
   */
  const StatCard = ({ icon: Icon, label, value, color, bgColor, subtitle, trend }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );

  /**
   * Obtener badge de estado
   */
  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmada', class: 'bg-secondary/10 text-secondary border-2 border-secondary/30' },
      completed: { label: 'Completada', class: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelada', class: 'bg-red-100 text-red-800' },
      no_show: { label: 'No Asistió', class: 'bg-gray-100 text-gray-800' }
    };
    
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  /**
   * Formatear moneda
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <LoadingSpinner size="large" />
              <p className="text-gray-600 font-medium mt-4">Cargando dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <div className="flex-1">{error}</div>
            <button
              onClick={fetchAllDashboardData}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completionRate = getCompletionRate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {business?.name} • Dashboard con estadísticas avanzadas
          </p>
        </div>

        {/* === ONBOARDING CHECKLIST === */}
        <OnboardingChecklist onDismiss={() => {
          // Opcional: Refrescar o hacer algo cuando se descarta el onboarding
          console.log('Onboarding descartado');
        }} />

        {/* === SECCIÓN 1: TARJETAS DE MÉTRICAS PRINCIPALES === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Calendar}
            label="Total Citas"
            value={stats.total}
            color="text-primary"
            bgColor="bg-primary/10"
            subtitle="Todas las citas"
          />
          <StatCard
            icon={Clock}
            label="Pendientes"
            value={stats.pending}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
            subtitle="Por confirmar"
          />
          <StatCard
            icon={CalendarCheck}
            label="Confirmadas"
            value={stats.confirmed}
            color="text-secondary"
            bgColor="bg-secondary/10"
            subtitle="Programadas"
          />
          <StatCard
            icon={CheckCircle}
            label="Completadas"
            value={stats.completed}
            color="text-green-600"
            bgColor="bg-green-50"
            subtitle="Finalizadas"
          />
        </div>

        {/* === SECCIÓN 2: INGRESOS Y COMPARACIONES === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ingresos del mes */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <DollarSign className="w-32 h-32" />
            </div>
            <div className="relative">
              <p className="text-green-100 text-sm font-medium mb-2">Ingresos Este Mes</p>
              <p className="text-4xl font-bold mb-3">
                {revenueData ? formatCurrency(revenueData.month_revenue) : '$0'}
              </p>
              {revenueData && revenueData.revenue_change_percent !== 0 && (
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  revenueData.revenue_change_percent > 0 
                    ? 'bg-white/20 text-white' 
                    : 'bg-black/20 text-white'
                }`}>
                  {revenueData.revenue_change_percent > 0 ? '↑' : '↓'} 
                  {Math.abs(revenueData.revenue_change_percent).toFixed(1)}% vs mes anterior
                </div>
              )}
            </div>
          </div>

          {/* Ingresos de hoy */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hoy</h3>
              <div className="bg-blue-50 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-1">
              {revenueData ? formatCurrency(revenueData.today_revenue) : '$0'}
            </p>
            <p className="text-sm text-gray-500">
              {stats.today} citas hoy
            </p>
          </div>

          {/* Tasa de cumplimiento */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cumplimiento</h3>
              <div className="bg-green-50 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {completionRate}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {stats.completed} completadas • {stats.cancelled} canceladas
            </p>
          </div>
        </div>

        {/* === SECCIÓN 3: GRÁFICAS === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencia de citas (últimos 30 días) */}
          {analyticsData && (
            <AppointmentsTrendChart
              data={analyticsData.daily_appointments}
              title="Tendencia de Citas (Últimos 30 Días)"
            />
          )}

          {/* Distribución por estado */}
          {analyticsData && (
            <StatusDistributionChart
              data={analyticsData.status_distribution}
              title="Distribución por Estado"
            />
          )}
        </div>

        {/* === SECCIÓN 4: INGRESOS MENSUALES Y SERVICIOS POPULARES === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingresos mensuales */}
          {revenueData && (
            <RevenueBarChart
              data={revenueData.monthly_revenue}
              title="Ingresos Últimos 6 Meses"
            />
          )}

          {/* Servicios más populares */}
          <PopularServicesChart
            data={popularServicesData}
            title="Top 5 Servicios"
          />
        </div>

        {/* === SECCIÓN 5: CITAS DE HOY === */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-primary" />
              Citas de Hoy
            </h3>
            <Link 
              to="/appointments"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Ver todas
              <ArrowUp className="w-4 h-4 rotate-45" />
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay citas programadas para hoy</p>
              <Link
                to="/appointments/new"
                className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
              >
                Crear nueva cita
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map(appointment => (
                <div 
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  <div className="flex items-center flex-1 gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {appointment.client_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.service_name} • {appointment.appointment_time?.slice(0, 5)} • {appointment.service_duration} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(appointment.service_price)}
                    </span>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              ))}
              {todayAppointments.length > 5 && (
                <div className="text-center pt-3">
                  <Link
                    to="/appointments"
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Ver {todayAppointments.length - 5} citas más →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* === SECCIÓN 6: RESUMEN RÁPIDO POR ESTADO === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-2 border-yellow-200">
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-xs text-yellow-600 mt-1 font-medium">Pendientes</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-secondary/30">
            <p className="text-2xl font-bold text-secondary">{stats.confirmed}</p>
            <p className="text-xs text-secondary mt-1 font-medium">Confirmadas</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            <p className="text-xs text-green-600 mt-1 font-medium">Completadas</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
            <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
            <p className="text-xs text-red-600 mt-1 font-medium">Canceladas</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
