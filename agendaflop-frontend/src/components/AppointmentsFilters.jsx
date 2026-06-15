/**
 * =============================================================================
 * APPOINTMENTS FILTERS - Componente de Filtros y Búsqueda
 * =============================================================================
 * 
 * Componente para filtrar y buscar citas con múltiples criterios:
 * - Búsqueda por texto (nombre del cliente o teléfono)
 * - Filtro por estado (todos, pendiente, confirmada, completada, etc.)
 * - Filtro por fecha (hoy, esta semana, este mes, rango personalizado)
 * - Ordenamiento (más reciente, más antiguo, por precio)
 * 
 * Props:
 * - onFilterChange: Function - Callback cuando cambian los filtros
 * 
 * =============================================================================
 */

import { useState } from 'react';
import { Search, Filter, Calendar, SortAsc, X } from 'lucide-react';

function AppointmentsFilters({ onFilterChange }) {
  // Estados locales de los filtros
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Manejar cambio en búsqueda de texto
   */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    emitFilterChange({ searchText: value });
  };

  /**
   * Manejar cambio en filtro de estado
   */
  const handleStatusChange = (status) => {
    setStatusFilter(status);
    emitFilterChange({ statusFilter: status });
  };

  /**
   * Manejar cambio en filtro de fecha
   */
  const handleDateChange = (date) => {
    setDateFilter(date);
    emitFilterChange({ dateFilter: date });
  };

  /**
   * Manejar cambio en ordenamiento
   */
  const handleSortChange = (sort) => {
    setSortBy(sort);
    emitFilterChange({ sortBy: sort });
  };

  /**
   * Emitir cambios consolidados al componente padre
   */
  const emitFilterChange = (updates) => {
    const filters = {
      searchText: updates.searchText !== undefined ? updates.searchText : searchText,
      statusFilter: updates.statusFilter !== undefined ? updates.statusFilter : statusFilter,
      dateFilter: updates.dateFilter !== undefined ? updates.dateFilter : dateFilter,
      sortBy: updates.sortBy !== undefined ? updates.sortBy : sortBy,
    };
    onFilterChange(filters);
  };

  /**
   * Limpiar todos los filtros
   */
  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setDateFilter('all');
    setSortBy('newest');
    onFilterChange({
      searchText: '',
      statusFilter: 'all',
      dateFilter: 'all',
      sortBy: 'newest'
    });
  };

  /**
   * Verificar si hay filtros activos
   */
  const hasActiveFilters = () => {
    return searchText !== '' || statusFilter !== 'all' || dateFilter !== 'all' || sortBy !== 'newest';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 border border-gray-100">
      
      {/* Barra principal: Búsqueda y botón de filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        
        {/* Campo de búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchText}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {searchText && (
            <button
              onClick={() => handleSearchChange({ target: { value: '' } })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botón para mostrar/ocultar filtros avanzados */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all
            ${showFilters 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {hasActiveFilters() && !showFilters && (
            <span className="ml-2 bg-indigo-500 text-white text-xs rounded-full px-2 py-0.5">
              {[searchText !== '', statusFilter !== 'all', dateFilter !== 'all', sortBy !== 'newest'].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Botón limpiar filtros */}
        {hasActiveFilters() && (
          <button
            onClick={handleClearFilters}
            className="flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar
          </button>
        )}
      </div>

      {/* Panel de filtros avanzados (colapsable) */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 animate-fade-in-up">
          
          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="no_show">No Asistieron</option>
            </select>
          </div>

          {/* Filtro por Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha
            </label>
            <select
              value={dateFilter}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="past">Pasadas</option>
              <option value="future">Próximas</option>
            </select>
          </div>

          {/* Ordenamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <SortAsc className="w-4 h-4 inline mr-1" />
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="newest">Más reciente</option>
              <option value="oldest">Más antiguo</option>
              <option value="price_high">Precio: Mayor a menor</option>
              <option value="price_low">Precio: Menor a mayor</option>
              <option value="date_asc">Fecha: Próxima primero</option>
              <option value="date_desc">Fecha: Lejana primero</option>
            </select>
          </div>
        </div>
      )}

      {/* Resumen de filtros activos */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Filtros activos:</p>
          <div className="flex flex-wrap gap-2">
            {searchText && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Búsqueda: "{searchText}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Estado: {getStatusLabel(statusFilter)}
              </span>
            )}
            {dateFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Fecha: {getDateLabel(dateFilter)}
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Orden: {getSortLabel(sortBy)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Obtener etiqueta legible del estado
 */
function getStatusLabel(status) {
  const labels = {
    pending: 'Pendientes',
    confirmed: 'Confirmadas',
    completed: 'Completadas',
    cancelled: 'Canceladas',
    no_show: 'No Asistieron'
  };
  return labels[status] || status;
}

/**
 * Obtener etiqueta legible de la fecha
 */
function getDateLabel(date) {
  const labels = {
    today: 'Hoy',
    week: 'Esta semana',
    month: 'Este mes',
    past: 'Pasadas',
    future: 'Próximas'
  };
  return labels[date] || date;
}

/**
 * Obtener etiqueta legible del ordenamiento
 */
function getSortLabel(sort) {
  const labels = {
    newest: 'Más reciente',
    oldest: 'Más antiguo',
    price_high: 'Precio ↓',
    price_low: 'Precio ↑',
    date_asc: 'Fecha ↑',
    date_desc: 'Fecha ↓'
  };
  return labels[sort] || sort;
}

export default AppointmentsFilters;
