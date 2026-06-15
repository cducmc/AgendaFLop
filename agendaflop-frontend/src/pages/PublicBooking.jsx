/**
 * =============================================================================
 * PUBLIC BOOKING - Portal público de reservas para clientes finales
 * =============================================================================
 * 
 * Portal completo con wizard de reserva en 4 pasos:
 * 1. Seleccionar servicio
 * 2. Seleccionar profesional (opcional)
 * 3. Seleccionar fecha y hora
 * 4. Ingresar datos del cliente
 * 
 * - Carga datos públicos sin autenticación
 * - Aplica branding dinámico del negocio
 * - Mobile-first design
 * - Hero section con información del negocio
 * - Wizard interactivo para reservar
 * 
 * Ruta: /book/:businessSlug
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, Users, CheckCircle2, ArrowLeft } from 'lucide-react';
import { publicAPI } from '../services/api';
import { hexToRgb } from '../utils/themeManager';
import LoadingSpinner from '../components/LoadingSpinner';
import BookingWizard from '../components/BookingWizard';

/**
 * =============================================================================
 * BOOKING CONFIRMATION - Pantalla de confirmación exitosa
 * =============================================================================
 */
function BookingConfirmation({ appointment, business, onNewBooking }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Tarjeta de confirmación */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Ícono de éxito */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            ¡Reserva Confirmada!
          </h1>

          {/* Mensaje */}
          <p className="text-center text-gray-600 mb-8">
            Tu cita ha sido agendada exitosamente. Recibirás una confirmación en breve.
          </p>

          {/* Detalles de la reserva */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/20 mb-8">
            <h2 className="font-bold text-gray-800 mb-4 text-lg">Detalles de tu reserva:</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Negocio:</span>
                <span className="font-semibold text-gray-900">{business.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Servicio:</span>
                <span className="font-semibold text-gray-900">{appointment.service_name || appointment.service}</span>
              </div>
              {appointment.professional_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Profesional:</span>
                  <span className="font-semibold text-gray-900">{appointment.professional_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-semibold text-gray-900">{appointment.appointment_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hora:</span>
                <span className="font-semibold text-gray-900">{appointment.appointment_time}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-primary/20">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-semibold text-gray-900">{appointment.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Teléfono:</span>
                <span className="font-semibold text-gray-900">{appointment.client_phone}</span>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> Si necesitas cancelar o reprogramar, 
              contacta directamente con {business.name}
              {business.phone && ` al teléfono ${business.phone}`}.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onNewBooking}
              className="flex-1 bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Hacer otra reserva
            </button>
            
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all text-center"
              >
                Contactar negocio
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * =============================================================================
 * PUBLIC BOOKING - Componente principal
 * =============================================================================
 */
export default function PublicBooking() {
  const { businessSlug } = useParams();
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  
  // Estado local
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [completedAppointment, setCompletedAppointment] = useState(null);

  /**
   * Aplica los colores del negocio como CSS variables
   */
  const applyBusinessTheme = (primaryColor, secondaryColor) => {
    if (primaryColor) {
      const primaryRgb = hexToRgb(primaryColor);
      document.documentElement.style.setProperty('--color-primary', primaryRgb);
    }
    if (secondaryColor) {
      const secondaryRgb = hexToRgb(secondaryColor);
      document.documentElement.style.setProperty('--color-secondary', secondaryRgb);
    }
  };

  /**
   * Cargar todos los datos públicos del negocio
   */
  useEffect(() => {
    const loadPublicData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar info del negocio
        const businessResponse = await publicAPI.getBusinessBySlug(businessSlug);
        const businessData = businessResponse.data;
        setBusiness(businessData);

        // Aplicar tema del negocio
        applyBusinessTheme(businessData.primary_color, businessData.secondary_color);

        // Cargar servicios y profesionales en paralelo
        const [servicesResponse, professionalsResponse] = await Promise.all([
          publicAPI.getPublicServices(businessSlug),
          publicAPI.getPublicProfessionals(businessSlug)
        ]);
        
        setServices(servicesResponse.data);
        setProfessionals(professionalsResponse.data);

      } catch (err) {
        console.error('Error cargando datos públicos:', err);
        setError(
          err.response?.status === 404
            ? 'Negocio no encontrado'
            : 'Error al cargar información. Por favor, intenta de nuevo.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (businessSlug) {
      loadPublicData();
    }
  }, [businessSlug]);

  /**
   * Manejar inicio de reserva
   */
  const handleStartBooking = () => {
    setShowWizard(true);
  };

  /**
   * Manejar reserva completada
   */
  const handleBookingComplete = (appointment) => {
    setCompletedAppointment(appointment);
    setShowWizard(false);
  };

  /**
   * Manejar nueva reserva (reset)
   */
  const handleNewBooking = () => {
    setCompletedAppointment(null);
    setShowWizard(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Renderizado condicional: Loading
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="text-gray-600 font-medium mt-4">Cargando información...</p>
        </div>
      </div>
    );
  }

  /**
   * Renderizado condicional: Error
   */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error}
          </h2>
          <p className="text-gray-600 mb-6">
            Verifica que la URL sea correcta o contacta directamente al negocio.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  /**
   * Renderizado condicional: Sin servicios disponibles
   */
  if (services.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-xl shadow-md p-8">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Servicios no disponibles
            </h3>
            <p className="text-gray-600">
              Este negocio aún no ha publicado servicios para reserva online.
              Por favor, contacta directamente para más información.
            </p>
            {business?.phone && (
              <a
                href={`tel:${business.phone}`}
                className="inline-block mt-6 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Llamar ahora
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Renderizado condicional: Confirmación de reserva
   */
  if (completedAppointment) {
    return (
      <BookingConfirmation
        appointment={completedAppointment}
        business={business}
        onNewBooking={handleNewBooking}
      />
    );
  }

  /**
   * Renderizado principal: Portal de reservas
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white relative overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center">
            {/* Logo */}
            {business.logo && (
              <div className="flex justify-center mb-6">
                <img 
                  src={`${backendBaseUrl}${business.logo}`}
                  alt={business.name}
                  className="h-24 w-24 object-contain rounded-xl shadow-2xl bg-white/10 backdrop-blur-sm p-2"
                />
              </div>
            )}

            {/* Nombre del negocio */}
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {business.name}
            </h1>

            {/* Descripción */}
            {business.description && (
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
                {business.description}
              </p>
            )}

            {/* Stats/Info rápida */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-white/80 mb-8">
              {services.length > 0 && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{services.length} Servicios</span>
                </div>
              )}
              {professionals.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{professionals.length} Profesionales</span>
                </div>
              )}
            </div>

            {/* CTA principal */}
            <button
              onClick={handleStartBooking}
              className="bg-white text-primary font-bold py-4 px-12 rounded-full text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
            >
              Reservar Cita Ahora
            </button>
          </div>
        </div>
      </div>

      {/* WIZARD DE RESERVA (Modal overlay) */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto notranslate" translate="no">
          <div className="min-h-screen flex items-start justify-center p-4 pt-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8">
              {/* Header del wizard */}
              <div className="border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Reserva tu cita en {business.name}
                </h2>
                <button
                  onClick={() => setShowWizard(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Cerrar"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido del wizard */}
              <div className="p-6 md:p-8">
                <BookingWizard
                  business={business}
                  services={services}
                  professionals={professionals}
                  onComplete={handleBookingComplete}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INFORMACIÓN DE CONTACTO */}
      {!showWizard && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Información de Contacto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {business.phone && (
                <div>
                  <p className="text-gray-600 mb-2">Teléfono</p>
                  <a 
                    href={`tel:${business.phone}`}
                    className="text-primary font-semibold hover:underline"
                  >
                    {business.phone}
                  </a>
                </div>
              )}
              {business.email && (
                <div>
                  <p className="text-gray-600 mb-2">Email</p>
                  <a 
                    href={`mailto:${business.email}`}
                    className="text-primary font-semibold hover:underline"
                  >
                    {business.email}
                  </a>
                </div>
              )}
              {business.address && (
                <div>
                  <p className="text-gray-600 mb-2">Dirección</p>
                  <p className="text-gray-800 font-medium">{business.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      {!showWizard && (
        <footer className="bg-white border-t border-gray-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
            <p>
              Powered by <span className="font-semibold text-primary">AgendaFlop</span>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
