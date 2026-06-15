/**
 * =============================================================================
 * REVENUE BAR CHART - Gráfica de barras para ingresos
 * =============================================================================
 * 
 * Muestra los ingresos mensuales en formato de barras.
 * Con gradiente y animaciones suaves.
 * 
 * Props:
 * - data: Array de objetos con { month_short, revenue }
 * - title: Título de la gráfica
 * - color: Color de las barras (default: green)
 * 
 * =============================================================================
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Componente RevenueBarChart
 */
function RevenueBarChart({ data = [], title = 'Ingresos Mensuales', color = '#10B981' }) {
  /**
   * Formatear moneda en formato colombiano
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
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            {payload[0].payload.month}
          </p>
          <p className="text-sm text-green-600 font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  /**
   * Calcular valor máximo para ajustar el dominio del eje Y
   */
  const maxValue = data.length > 0 
    ? Math.max(...data.map(d => d.revenue)) * 1.1 
    : 100;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        
        {/* Indicador de tendencia */}
        {data.length >= 2 && (
          <div>
            {data[data.length - 1].revenue > data[data.length - 2].revenue ? (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Creciendo
              </span>
            ) : (
              <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                Decreciendo
              </span>
            )}
          </div>
        )}
      </div>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>No hay datos de ingresos disponibles</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.5}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="month_short" 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6B7280' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={[0, maxValue]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar 
                dataKey="revenue" 
                fill="url(#colorRevenue)"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Total y promedio */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1">Total (6 meses)</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(data.reduce((acc, item) => acc + item.revenue, 0))}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Promedio mensual</p>
              <p className="text-lg font-bold text-blue-700">
                {formatCurrency(data.reduce((acc, item) => acc + item.revenue, 0) / data.length)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RevenueBarChart;
