/**
 * =============================================================================
 * STATUS PIE CHART - Gráfico circular de distribución por estado
 * =============================================================================
 * 
 * Muestra la distribución de citas por estado usando un gráfico de pastel.
 * Utiliza Recharts para renderizado interactivo.
 * 
 * Props:
 * - data: objeto con conteos por estado { pending, confirmed, completed, etc. }
 * 
 * =============================================================================
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Configuración de colores por estado
 */
const STATUS_COLORS = {
  pending: '#EAB308',      // Amarillo
  confirmed: '#3B82F6',    // Azul
  completed: '#10B981',    // Verde
  cancelled: '#EF4444',    // Rojo
  no_show: '#6B7280',      // Gris
};

/**
 * Etiquetas en español por estado
 */
const STATUS_LABELS = {
  pending: 'Pendientes',
  confirmed: 'Confirmadas',
  completed: 'Completadas',
  cancelled: 'Canceladas',
  no_show: 'No asistió',
};

/**
 * Componente de gráfico circular
 */
function StatusPieChart({ data }) {
  const total = Object.values(data || {}).reduce((acc, value) => acc + (value || 0), 0);

  // Transformar datos al formato de Recharts
  const chartData = Object.entries(data || {})
    .filter(([_, value]) => value > 0) // Solo mostrar estados con citas
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#6B7280',
    }));
  
  // Si no hay datos, mostrar mensaje
  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No hay datos disponibles
      </div>
    );
  }
  
  /**
   * Renderizar etiqueta personalizada en el gráfico
   */
  const renderLabel = (entry) => {
    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
    return `${percent}%`;
  };
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Gráfico de pastel principal */}
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          
          {/* Tooltip al pasar el mouse */}
          <Tooltip
            formatter={(value) => [`${value} citas`, 'Total']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          
          {/* Leyenda con etiquetas */}
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value, entry) => (
              <span className="text-sm text-gray-700">
                {value}: <span className="font-semibold">{entry.payload.value}</span>
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StatusPieChart;
