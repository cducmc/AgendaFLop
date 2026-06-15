/**
 * =============================================================================
 * APPOINTMENTS TREND CHART - Gráfica de tendencia de citas
 * =============================================================================
 * 
 * Muestra la evolución de las citas en el tiempo.
 * Usa recharts con AreaChart para visualización profesional.
 * 
 * Props:
 * - data: Array de objetos con { day, count }
 * - title: Título de la gráfica
 * - color: Color principal de la gráfica (default: primary)
 * 
 * =============================================================================
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Componente AppointmentsTrendChart
 */
function AppointmentsTrendChart({ data = [], title = 'Tendencia de Citas', color = '#6366F1' }) {
  /**
   * Tooltip personalizado
   */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].payload.day}
          </p>
          <p className="text-sm text-gray-600">
            Citas: <span className="font-bold text-primary">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>No hay datos disponibles</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart 
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCitas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default AppointmentsTrendChart;
