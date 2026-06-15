/**
 * =============================================================================
 * STATUS DISTRIBUTION CHART - Gráfica de distribución por estado
 * =============================================================================
 * 
 * Muestra la distribución de citas por estado usando PieChart.
 * Colores profesionales y tooltip interactivo.
 * 
 * Props:
 * - data: Objeto con { pending, confirmed, completed, cancelled, no_show }
 * - title: Título de la gráfica
 * 
 * =============================================================================
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Colores por estado
 */
const COLORS = {
  pending: '#EAB308',      // Yellow
  confirmed: '#8B5CF6',    // Purple (secondary)
  completed: '#10B981',    // Green
  cancelled: '#EF4444',    // Red
  no_show: '#6B7280',      // Gray
};

/**
 * Labels en español
 */
const STATUS_LABELS = {
  pending: 'Pendientes',
  confirmed: 'Confirmadas',
  completed: 'Completadas',
  cancelled: 'Canceladas',
  no_show: 'No Asistió',
};

/**
 * Componente StatusDistributionChart
 */
function StatusDistributionChart({ data = {}, title = 'Distribución por Estado' }) {
  /**
   * Convertir data object a array para recharts
   */
  const chartData = Object.entries(data)
    .filter(([status, count]) => count > 0)  // Solo incluir estados con datos
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: COLORS[status] || '#6B7280',
    }));

  /**
   * Tooltip personalizado
   */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = chartData.reduce((acc, item) => acc + item.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600">
            {payload[0].value} citas ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  /**
   * Renderizar label personalizado en el pie
   */
  const renderLabel = (entry) => {
    return `${entry.value}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>No hay datos disponibles</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={90}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              formatter={(value, entry) => (
                <span className="text-sm text-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {/* Totales por estado */}
      {chartData.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {chartData.map((item) => (
            <div 
              key={item.name}
              className="flex items-center justify-between p-2 rounded-lg"
              style={{ backgroundColor: `${item.color}10` }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatusDistributionChart;
