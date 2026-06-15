/**
 * =============================================================================
 * PROFESSIONAL CARD - Tarjeta de profesional para portal público
 * =============================================================================
 * 
 * Muestra información de un profesional:
 * - Avatar y nombre
 * - Título/especialidad
 * - Bio breve
 * - Servicios que ofrece
 * - Indicador de selección
 * 
 * Props:
 * - professional: Objeto con datos del profesional
 * - isSelected: Boolean si está seleccionado
 * - onSelect: Función callback para seleccionar
 * - showServices: Boolean para mostrar/ocultar servicios
 * =============================================================================
 */

import { User, Check, Briefcase } from 'lucide-react';

/**
 * Componente ProfessionalCard
 */
function ProfessionalCard({ professional, isSelected = false, onSelect, showServices = true }) {
  return (
    <div
      onClick={() => onSelect && onSelect(professional)}
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

      <div className="p-6">
        {/* Avatar y nombre */}
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {professional.avatar ? (
              <img
                src={`http://127.0.0.1:8000${professional.avatar}`}
                alt={professional.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>

          {/* Nombre y título */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {professional.name}
            </h3>
            {professional.title && (
              <p className="text-sm text-gray-600 truncate">
                {professional.title}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {professional.bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {professional.bio}
          </p>
        )}

        {/* Especialidades */}
        {professional.specialties && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Especialidades:</span>
            </div>
            <p className="text-sm text-gray-600">
              {professional.specialties}
            </p>
          </div>
        )}

        {/* Servicios que ofrece (solo si showServices = true y hay servicios) */}
        {showServices && professional.services && professional.services.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Servicios que ofrece:
            </p>
            <div className="flex flex-wrap gap-2">
              {professional.services.map((service) => (
                <span
                  key={service.id}
                  className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                >
                  {service.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botón de selección (solo visible si no está seleccionado) */}
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

export default ProfessionalCard;
