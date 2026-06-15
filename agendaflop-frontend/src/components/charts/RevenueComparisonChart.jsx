/**
 * =============================================================================
 * REVENUE COMPARISON CHART - Gráfico de barras de comparación de ingresos
 * =============================================================================
 * 
 * Muestra la comparación entre ingresos del periodo actual vs periodo anterior.
 * Utiliza Recharts para renderizado interactivo.
 * 
 * Props:
 * - currentRevenue: ingresos del periodo actual (number)
 * - previousRevenue: ingresos del periodo anterior (number)
 * - changePercent: porcentaje de cambio (number)
 * 
 * =============================================================================
 */

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

/**
 * Componente de gráfico de barras de comparación
 */
function RevenueComparisonChart({ currentRevenue, previousRevenue, changePercent }) {
  // Formatear datos para el gráfico
  const chartData = [
    {
      name: 'Periodo Anterior',
      revenue: previousRevenue,
      fill: '#9CA3AF', // Gris
    },
    {
      name: 'Periodo Actual',
      revenue: currentRevenue,
      fill: changePercent >= 0 ? '#10B981' : '#EF4444', // Verde si aumentó, rojo si bajó
    },
  ];
  
  /**
   * Formatear valor de moneda para el tooltip
   */
  const formatCurrency = (value) => {
    return `$${value.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  
  /**
   * Tooltip personalizado con mejor formato
   */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].payload.name}
          </p>
          <p className="text-lg font-bold text-green-600 mt-1">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          {/* Grid de fondo */}
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          
          {/* Eje X (categorías) */}
          <XAxis
            dataKey="name"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          
          {/* Eje Y (valores) */}
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#D1D5DB' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          
          {/* Tooltip interactivo */}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
          
          {/* Barras principales */}
          <Bar
            dataKey="revenue"
            radius={[8, 8, 0, 0]}
            maxBarSize={120}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Indicador de cambio porcentual */}
      <div className="mt-4 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          changePercent > 0 ? 'bg-green-100 text-green-700' :
          changePercent < 0 ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          <span className="text-lg font-bold">
            {changePercent > 0 ? '↑' : changePercent < 0 ? '↓' : '→'}
          </span>
          <span className="font-semibold">
            {Math.abs(changePercent).toFixed(1)}% {changePercent >= 0 ? 'de incremento' : 'de decremento'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default RevenueComparisonChart;
