/**
 * =============================================================================
 * SERVICE CARD - Tarjeta de servicio para portal público
 * =============================================================================
 * 
 * Muestra información de un servicio de manera atractiva:
 * - Nombre y descripción
 * - Duración y precio
 * - Imagen (si existe)
 * - Indicador de selección
 * 
 * Props:
 * - service: Objeto con datos del servicio
 * - isSelected: Boolean si está seleccionado
 * - onSelect: Función callback para seleccionar
 * =============================================================================
 */

import { Clock, DollarSign, Check } from 'lucide-react';

/**
 * Componente ServiceCard
 */
function ServiceCard({ service, isSelected = false, onSelect }) {
  return (
    <div
      onClick={() => onSelect && onSelect(service)}
      className={`
        relative bg-white rounded-xl shadow-md hover:shadow-xl 
        transition-all duration-300 overflow-hidden border-2 cursor-pointer
        ${isSelected 
          ? 'border-primary ring-4 ring-primary/20' 
          : 'border-gray-100 hover:border-primary/50'
        }
      `}
    >
      {/* Indicador de selección */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-primary text-white rounded-full p-1.5 shadow-lg">
            <Check className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Imagen del servicio (si existe) */}
      {service.image && (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={`http://127.0.0.1:8000${service.image}`}
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Contenido */}
      <div className={`p-6 ${service.image ? 'pt-4' : ''}`}>
        {/* Nombre del servicio */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {service.name}
        </h3>

        {/* Descripción */}
        {service.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Detalles: Duración y Precio */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Duración */}
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-medium">{service.duration} min</span>
          </div>

          {/* Precio */}
          <div className="flex items-center gap-1 text-primary">
            <DollarSign className="w-5 h-5" />
            <span className="text-2xl font-bold">{parseFloat(service.price).toFixed(0)}</span>
          </div>
        </div>

        {/* Botón de selección (solo visible en hover si no está seleccionado) */}
        {!isSelected && (
          <button
            className="w-full mt-4 bg-primary/10 text-primary font-semibold py-2 px-4 rounded-lg
                     hover:bg-primary hover:text-white transition-all duration-200"
          >
            Seleccionar
          </button>
        )}
      </div>
    </div>
  );
}

export default ServiceCard;
