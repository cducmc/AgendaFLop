/**
 * =============================================================================
 * PLATFORM DASHBOARD - Dashboard de Administrador de Plataforma
 * =============================================================================
 * 
 * Dashboard exclusivo para super_admin que muestra:
 * - Lista de todos los negocios en la plataforma
 * - Estadísticas de cada negocio (usuarios, servicios, profesionales, clientes)
 * - Estado de activación y verificación
 * - Plan actual y estado de suscripción
 * - Acciones administrativas (activar/desactivar, verificar)
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { platformAPI } from '../services/api';
import { 
  Building2, 
  Users, 
  Briefcase, 
  UserCheck, 
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Eye,
  Power,
  BadgeCheck,
  LogOut
} from 'lucide-react';

const PlatformDashboard = () => {
  const { user, logout } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive
  const [filterVerified, setFilterVerified] = useState('all'); // all, verified, unverified
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    totalUsers: 0
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await platformAPI.getAllBusinesses();
      const businessData = response.data.results || [];
      
      setBusinesses(businessData);
      
      // Calcular estadísticas
      const totalUsers = businessData.reduce((sum, b) => sum + (b.total_users || 0), 0);
      setStats({
        total: businessData.length,
        active: businessData.filter(b => b.is_active).length,
        verified: businessData.filter(b => b.is_verified).length,
        totalUsers: totalUsers
      });
    } catch (err) {
      console.error('Error loading businesses:', err);
      setError('Error al cargar los negocios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (businessId) => {
    try {
      await platformAPI.toggleActive(businessId);
      loadBusinesses(); // Recargar lista
    } catch (err) {
      console.error('Error toggling active:', err);
      alert('Error al cambiar estado del negocio');
    }
  };

  const handleToggleVerified = async (businessId) => {
    try {
      await platformAPI.toggleVerified(businessId);
      loadBusinesses(); // Recargar lista
    } catch (err) {
      console.error('Error toggling verified:', err);
      alert('Error al cambiar verificación del negocio');
    }
  };

  // Filtrar negocios
  const filteredBusinesses = businesses.filter(business => {
    // Filtro de búsqueda
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de activo
    const matchesActive = filterActive === 'all' ||
                         (filterActive === 'active' && business.is_active) ||
                         (filterActive === 'inactive' && !business.is_active);
    
    // Filtro de verificado
    const matchesVerified = filterVerified === 'all' ||
                           (filterVerified === 'verified' && business.is_verified) ||
                           (filterVerified === 'unverified' && !business.is_verified);
    
    return matchesSearch && matchesActive && matchesVerified;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando negocios...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-600" />
              Platform Dashboard
            </h1>
            <p className="mt-1 text-gray-600">
              Administra todos los negocios de la plataforma
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Super Admin</p>
              <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Negocios</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Building2 className="w-12 h-12 text-indigo-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Negocios Activos</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verificados</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.verified}</p>
            </div>
            <BadgeCheck className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Active */}
          <div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
          </div>

          {/* Filter Verified */}
          <div>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Verificación</option>
              <option value="verified">Verificados</option>
              <option value="unverified">No verificados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Businesses List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Negocio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estadísticas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron negocios
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    {/* Negocio */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {business.logo ? (
                            <img 
                              src={business.logo} 
                              alt={business.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div 
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                              style={{ backgroundColor: business.primary_color || '#6366f1' }}
                            >
                              {business.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {business.name}
                            {business.is_verified && (
                              <BadgeCheck className="inline-block ml-2 w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{business.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{business.current_plan_name}</div>
                      <div className="text-xs text-gray-500">{business.subscription_status}</div>
                    </td>

                    {/* Estadísticas */}
                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-sm">
                        <div className="flex items-center gap-1" title="Usuarios">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{business.total_users}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Servicios">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{business.total_services}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Profesionales">
                          <UserCheck className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{business.total_professionals}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Clientes">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{business.total_clients}</span>
                        </div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        business.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {business.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </td>

                    {/* Fecha Creación */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(business.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(business.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            business.is_active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                          title={business.is_active ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        {/* Toggle Verified */}
                        <button
                          onClick={() => handleToggleVerified(business.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            business.is_verified
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                          title={business.is_verified ? 'Desverificar' : 'Verificar'}
                        >
                          <BadgeCheck className="w-4 h-4" />
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => window.open(`http://localhost:5173/book/${business.slug}`, '_blank')}
                          className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          title="Ver portal público"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Mostrando {filteredBusinesses.length} de {businesses.length} negocios
      </div>
    </div>
  );
};

export default PlatformDashboard;
