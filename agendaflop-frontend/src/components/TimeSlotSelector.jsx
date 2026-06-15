/**
 * =============================================================================
 * TIME SLOT SELECTOR - Selector de horarios disponibles
 * =========================================================================== *
 * Muestra horarios disponibles en formato de grid interactivo
 * - Carga horarios del backend según fecha, servicio y profesional
 * - Muestra loading, errores y estados vacíos
 * - Permite seleccionar un horario
 *
 * Props:
 * - businessSlug: Slug del negocio
 * - selectedDate: Fecha seleccionada (Date object)
 * - serviceId: ID del servicio
 * - professionalId: ID del profesional (opcional)
 * - selectedSlot: Horario seleccionado actual
 * - onSelectSlot: Callback al seleccionar horario
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { Clock, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { publicAPI } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente TimeSlotSelector
 */
function TimeSlotSelector({
  businessSlug,
  selectedDate,
  serviceId,
  professionalId,
  selectedSlot,
  onSelectSlot
}) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar horarios disponibles cuando cambian los parámetros
   * Usa isMounted para evitar actualizar estado después de desmontaje
   */
  useEffect(() => {
    if (!selectedDate || !serviceId) {
      setSlots([]);
      return;
    }

    let isMounted = true;

    const loadAvailability = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          date: format(selectedDate, 'yyyy-MM-dd'),
          service_id: serviceId,
        };

        if (professionalId) {
          params.professional_id = professionalId;
        }

        const response = await publicAPI.getAvailability(businessSlug, params);
        
        // Solo actualizar estado si el componente está montado
        if (isMounted) {
          setSlots(response.data.available_slots || []);
        }
      } catch (err) {
        // Solo actualizar estado si el componente está montado
        if (isMounted) {
          console.error('Error cargando disponibilidad:', err);
          setError(err.response?.data?.error || 'Error al cargar horarios disponibles');
          setSlots([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAvailability();

    // Cleanup: marcar como desmontado para evitar state updates después del unmount
    return () => {
      isMounted = false;
    };
  }, [selectedDate, serviceId, professionalId, businessSlug]);

  /**
   * Renderizar estado de loading
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
        <p className="text-gray-600">Cargando horarios disponibles...</p>
      </div>
    );
  }

  /**
   * Renderizar estado de error
   */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-red-50 rounded-lg p-6 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-semibold mb-1">Error al cargar horarios</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Renderizar cuando no hay horarios disponibles
   */
  if (slots.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-yellow-50 rounded-lg p-6 max-w-md text-center">
          <Calendar className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-yellow-800 font-semibold mb-2">
            No hay horarios disponibles
          </h3>
          <p className="text-yellow-700 text-sm">
            {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })}
            {' '}no tiene horarios disponibles. Por favor selecciona otra fecha.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Renderizar grid de horarios
   */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Horarios disponibles
        </h3>
        <span className="text-sm text-gray-600">
          {slots.length} {slots.length === 1 ? 'horario' : 'horarios'}
        </span>
      </div>

      {/* Grid de horarios */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelectSlot(slot)}
            className={`
              py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
              ${selectedSlot === slot
                ? 'bg-primary text-white shadow-lg ring-2 ring-primary/50 scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary hover:bg-primary/5'
              }
            `}
          >
            {slot}
          </button>
        ))}
      </div>

      {/* Info adicional */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Fecha seleccionada:</span>{' '}
            {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
          {selectedSlot && (
            <p className="text-sm text-blue-800 mt-1">
              <span className="font-semibold">Hora:</span> {selectedSlot}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TimeSlotSelector;
