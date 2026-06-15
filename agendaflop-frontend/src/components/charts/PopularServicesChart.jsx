/**
 * =============================================================================
 * POPULAR SERVICES CHART - Servicios más solicitados
 * =============================================================================
 * 
 * Muestra los servicios más populares con barras horizontales.
 * Incluye cantidad de citas e ingresos generados.
 * 
 * Props:
 * - data: Array de objetos con { service_name, count, revenue }
 * - title: Título de la gráfica
 * 
 * =============================================================================
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

/**
 * Colores para las barras (gradiente de primary)
 */
const COLORS = ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF'];

/**
 * Componente PopularServicesChart
 */
function PopularServicesChart({ data = [], title = 'Servicios Más Populares' }) {
  /**
   * Formatear moneda
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  /**
   * Tooltip personalizado
   */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            {item.service_name}
          </p>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Citas:</span> {item.count}
            </p>
            <p className="text-xs text-green-600 font-medium">
              <span className="font-normal text-gray-600">Ingresos:</span> {formatCurrency(item.revenue)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  /**
   * Truncar nombres largos
   */
  const truncateName = (name, maxLength = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Tomar solo top 5
  const topServices = data.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </h3>
      </div>
      
      {topServices.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>No hay datos de servicios disponibles</p>
        </div>
      ) : (
        <>
          {/* Gráfica de barras horizontales */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={topServices}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis 
                type="number"
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                type="category"
                dataKey="service_name"
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6B7280' }}
                width={90}
                tickFormatter={(value) => truncateName(value, 15)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar 
                dataKey="count" 
                radius={[0, 8, 8, 0]}
                maxBarSize={40}
              >
                {topServices.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Tabla resumen */}
          <div className="mt-6 space-y-2">
            {topServices.map((service, index) => (
              <div 
                key={service.service_id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ borderLeft: `4px solid ${COLORS[index % COLORS.length]}` }}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    #{index + 1} {service.service_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {service.count} citas
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-green-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(service.revenue)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total (Top 5):</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-900">
                  {topServices.reduce((acc, s) => acc + s.count, 0)} citas
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(topServices.reduce((acc, s) => acc + s.revenue, 0))}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PopularServicesChart;
