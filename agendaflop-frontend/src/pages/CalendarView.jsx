/**
 * =============================================================================
 * CALENDAR VIEW - Vista de Calendario Profesional (Bloque 3)
 * =============================================================================
 * 
 * Calendario interactivo con múltiples vistas y drag & drop:
 * - Vistas: Mes, Semana, Día, Agenda
 * - Drag & drop para mover citas
 * - Colores por estado de cita
 * - Click para ver detalles
 * - Doble click para editar
 * - Modal para crear citas rápidas
 * - Navegación fluida entre fechas
 * 
 * =============================================================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  User,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Configurar localizador con date-fns en español
 */
const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
});

// Habilitar drag and drop
const DnDCalendar = withDragAndDrop(Calendar);

/**
 * Mensajes en español para el calendario
 */
const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Cita',
  noEventsInRange: 'No hay citas en este rango',
  showMore: (total) => `+ Ver más (${total})`,
};

/**
 * Colores por estado de cita
 */
const getEventColor = (status) => {
  const colors = {
    pending: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },      // Amarillo
    confirmed: { bg: '#DDD6FE', border: '#8B5CF6', text: '#5B21B6' },    // Púrpura
    completed: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },    // Verde
    cancelled: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },    // Rojo
    no_show: { bg: '#E5E7EB', border: '#6B7280', text: '#1F2937' },      // Gris
  };
  return colors[status] || colors.pending;
};


/**
 * Componente CalendarView
 */
function CalendarView() {
  const { user, business } = useAuth();
  
  // Estados
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  /**
   * Cargar citas al cambiar la fecha o vista
   */
  useEffect(() => {
    loadAppointments(currentDate, view);
  }, [currentDate, view]);

  /**
   * Calcular rango de fechas según la vista actual
   */
  const getDateRange = (date, currentView) => {
    let start, end;
    
    switch (currentView) {
      case 'month':
        start = startOfMonth(date);
        end = endOfMonth(date);
        // Agregar días para mostrar semanas completas
        start = addDays(start, -getDay(start));
        end = addDays(end, 6 - getDay(end));
        break;
      case 'week':
        start = startOfWeek(date, { locale: es });
        end = addDays(start, 6);
        break;
      case 'day':
        start = date;
        end = date;
        break;
      case 'agenda':
        start = date;
        end = addDays(date, 30); // Agenda muestra próximos 30 días
        break;
      default:
        start = startOfMonth(date);
        end = endOfMonth(date);
    }
    
    return { start, end };
  };

  /**
   * Cargar citas del backend
   */
  const loadAppointments = async (date, currentView) => {
    try {
      setLoading(true);
      setError(null);
      
      const { start, end } = getDateRange(date, currentView);
      
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');
      
      const response = await appointmentsAPI.calendarRange(startDate, endDate);
      
      // Convertir citas a eventos del calendario
      const calendarEvents = response.data.map(appointment => {
        // Combinar fecha y hora
        const startDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        
        // Calcular fin (sumar duración en minutos)
        const duration = appointment.service_duration || 30;
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
        
        return {
          id: appointment.id,
          title: `${appointment.client_name} - ${appointment.service_name}`,
          start: startDateTime,
          end: endDateTime,
          resource: appointment, // Guardar datos completos
        };
      });
      
      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error cargando citas:', err);
      setError('Error al cargar las citas del calendario');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar navegación del calendario
   */
  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  /**
   * Manejar cambio de vista
   */
  const handleViewChange = (newView) => {
    setView(newView);
  };

  /**
   * Manejar click en un evento
   */
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  /**
   * Manejar drag & drop de eventos
   */
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      const newDate = format(start, 'yyyy-MM-dd');
      const newTime = format(start, 'HH:mm');
      
      // Actualizar en el backend
      await appointmentsAPI.reschedule(event.id, newDate, newTime);
      
      // Actualizar localmente
      const updatedEvents = events.map(e => 
        e.id === event.id 
          ? { ...e, start, end }
          : e
      );
      setEvents(updatedEvents);
      
      // Recargar para asegurar sincronización
      loadAppointments(currentDate, view);
    } catch (err) {
      console.error('Error moviendo cita:', err);
      alert(err.response?.data?.error || 'Error al mover la cita');
      // Revertir cambios
      loadAppointments(currentDate, view);
    }
  };

  /**
   * Manejar resize de eventos
   */
  const handleEventResize = async ({ event, start, end }) => {
    // Por ahora, solo permitimos mover, no cambiar duración
    console.log('Resize no implementado aún');
  };

  /**
   * Estilizar eventos según el estado
   */
  const eventStyleGetter = (event) => {
    const appointment = event.resource;
    const colors = getEventColor(appointment.status);
    
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        color: colors.text,
        borderRadius: '4px',
        padding: '2px 5px',
        fontSize: '0.875rem',
        fontWeight: '500',
      }
    };
  };

  /**
   * Toolbar personalizado
   */
  const CustomToolbar = ({ label, onNavigate, onView, view }) => {
    return (
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        {/* Navegación de fecha */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Hoy
          </button>
          
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Siguiente"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          
          <span className="text-xl font-bold text-gray-900 ml-4">
            {label}
          </span>
        </div>

        {/* Selector de vista */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {['month', 'week', 'day', 'agenda'].map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                view === v
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {v === 'month' && 'Mes'}
              {v === 'week' && 'Semana'}
              {v === 'day' && 'Día'}
              {v === 'agenda' && 'Agenda'}
            </button>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Componente de evento personalizado
   */
  const CustomEvent = ({ event }) => {
    const appointment = event.resource;
    return (
      <div className="flex items-center gap-1 truncate">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  // Estado de carga
  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <LoadingSpinner size="large" />
              <p className="text-gray-600 font-medium mt-4">Cargando calendario...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Calendario de Citas
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {business?.name} • Gestión visual de todas tus citas
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => loadAppointments(currentDate, view)}
              className="ml-auto px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Leyenda de colores */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Estados:</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { status: 'pending', label: 'Pendiente' },
              { status: 'confirmed', label: 'Confirmada' },
              { status: 'completed', label: 'Completada' },
              { status: 'cancelled', label: 'Cancelada' },
              { status: 'no_show', label: 'No Asistió' },
            ].map(({ status, label }) => {
              const colors = getEventColor(status);
              return (
                <div key={status} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ 
                      backgroundColor: colors.bg,
                      border: `2px solid ${colors.border}`
                    }}
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            view={view}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar,
              event: CustomEvent,
            }}
            messages={messages}
            culture="es"
            draggableAccessor={() => true}
            resizable={false}
            step={30}
            timeslots={2}
            min={new Date(2026, 0, 1, 8, 0)} // 8 AM
            max={new Date(2026, 0, 1, 20, 0)} // 8 PM
          />
        </div>

        {/* Modal de evento (simplificado por ahora) */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Detalles de la Cita
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Cliente</p>
                      <p className="font-semibold">{selectedEvent.resource.client_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Servicio</p>
                      <p className="font-semibold">{selectedEvent.resource.service_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Horario</p>
                      <p className="font-semibold">
                        {format(selectedEvent.start, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold`}
                      style={{
                        backgroundColor: getEventColor(selectedEvent.resource.status).bg,
                        color: getEventColor(selectedEvent.resource.status).text,
                      }}
                    >
                      {selectedEvent.resource.status === 'pending' && 'Pendiente'}
                      {selectedEvent.resource.status === 'confirmed' && 'Confirmada'}
                      {selectedEvent.resource.status === 'completed' && 'Completada'}
                      {selectedEvent.resource.status === 'cancelled' && 'Cancelada'}
                      {selectedEvent.resource.status === 'no_show' && 'No Asistió'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowEventModal(false)}
                  className="mt-6 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default CalendarView;
