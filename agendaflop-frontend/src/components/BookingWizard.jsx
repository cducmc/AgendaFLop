/**
 * =============================================================================
 * BOOKING WIZARD - Wizard paso a paso para reservar citas
 * =============================================================================
 * 
 * Flujo de reserva en 4 pasos:
 * 1. Seleccionar servicio
 * 2. Seleccionar profesional (o cualquiera)
 * 3. Seleccionar fecha y hora
 * 4. Ingresar datos personales
 * 
 * Maneja todo el estado de la reserva y la validación de cada paso.
 * 
 * Props:
 * - business: Objeto con datos del negocio
 * - services: Array de servicios disponibles
 * - professionals: Array de profesionales disponibles
 * - onComplete: Callback cuando se completa la reserva
 * =============================================================================
 */

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Calendar as CalendarIcon, User, Phone, Mail, MessageSquare } from 'lucide-react';
import ServiceCard from './ServiceCard';
import ProfessionalCard from './ProfessionalCard';
import TimeSlotSelector from './TimeSlotSelector';
import LoadingSpinner from './LoadingSpinner';
import { publicAPI } from '../services/api';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente BookingWizard
 */
function BookingWizard({ business, services, professionals, onComplete }) {
  // Estado del wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado de la reserva
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const totalSteps = 4;

  /**
   * Filtrar profesionales que ofrecen el servicio seleccionado
   */
  const getAvailableProfessionals = () => {
    if (!selectedService) return professionals;
    
    return professionals.filter(prof => 
      prof.services && prof.services.some(s => s.id === selectedService.id)
    );
  };

  /**
   * Generar fechas disponibles (próximos 30 días)
   */
  const getAvailableDates = () => {
    const maxDaysAhead = business?.booking_max_days_ahead || 30;
    const dates = [];
    for (let i = 0; i < maxDaysAhead; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  /**
   * Validar si se puede avanzar al siguiente paso
   */
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return true; // Profesional es opcional
      case 3:
        return selectedDate !== null && selectedSlot !== null;
      case 4:
        return clientData.name.trim() !== '' && clientData.phone.trim() !== '';
      default:
        return false;
    }
  };

  /**
   * Avanzar al siguiente paso
   */
  const handleNext = () => {
    if (canGoNext() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  /**
   * Retroceder al paso anterior
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  /**
   * Manejar selección de servicio
   */
  const handleSelectService = (service) => {
    setSelectedService(service);
    // Limpiar profesional si no ofrece el nuevo servicio
    if (selectedProfessional) {
      const profOffers = selectedProfessional.services?.some(s => s.id === service.id);
      if (!profOffers) {
        setSelectedProfessional(null);
      }
    }
  };

  /**
   * Manejar selección de profesional
   */
  const handleSelectProfessional = (professional) => {
    setSelectedProfessional(professional);
  };

  /**
   * Manejar cambio en datos del cliente
   */
  const handleClientDataChange = (field, value) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Enviar reserva al backend
   */
  const handleSubmit = async () => {
    if (!canGoNext()) return;

    try {
      setLoading(true);
      setError(null);

      // Preparar datos para el backend
      const appointmentData = {
        service: selectedService.id,
        professional: selectedProfessional?.id || null,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedSlot,
        client_name: clientData.name,
        client_phone: clientData.phone,
        client_email: clientData.email || null,
        notes: clientData.notes || null,
      };

      const response = await publicAPI.createPublicAppointment(business.slug, appointmentData);
      
      // Notificar completado
      if (onComplete) {
        onComplete(response.data?.appointment || response.data);
      }
    } catch (err) {
      console.error('Error al crear reserva:', err);
      setError(err.response?.data?.error || err.response?.data?.detail || 'Error al crear la reserva. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renderizar indicadores de progreso
   */
  const renderProgress = () => {
    const steps = [
      { number: 1, label: 'Servicio' },
      { number: 2, label: 'Profesional' },
      { number: 3, label: 'Fecha y Hora' },
      { number: 4, label: 'Datos' },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              {/* Círculo del paso */}
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    transition-all duration-300
                    ${currentStep > step.number 
                      ? 'bg-green-500 text-white' 
                      : currentStep === step.number
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span className={`text-xs mt-2 font-medium ${currentStep >= step.number ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              
              {/* Línea conectora */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Renderizar contenido del paso actual
   */
  const renderStepContent = () => {
    // Paso 1: Seleccionar servicio
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¿Qué servicio necesitas?</h2>
            <p className="text-gray-600">Selecciona el servicio que deseas reservar</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedService?.id === service.id}
                onSelect={handleSelectService}
              />
            ))}
          </div>
        </div>
      );
    }

    // Paso 2: Seleccionar profesional
    if (currentStep === 2) {
      const availableProfessionals = getAvailableProfessionals();
      
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¿Con quién prefieres tu cita?</h2>
            <p className="text-gray-600">Selecciona un profesional o deja que el negocio asigne uno</p>
          </div>

          {/* Opción "Cualquier profesional" */}
          <div 
            onClick={() => setSelectedProfessional(null)}
            className={`
              p-6 rounded-xl border-2 cursor-pointer transition-all duration-300
              ${!selectedProfessional 
                ? 'border-primary bg-primary/5 ring-4 ring-primary/20' 
                : 'border-gray-200 hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Cualquier profesional disponible</h3>
                <p className="text-sm text-gray-600">El negocio asignará al mejor profesional para ti</p>
              </div>
              {!selectedProfessional && (
                <div className="ml-auto">
                  <Check className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Lista de profesionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                isSelected={selectedProfessional?.id === professional.id}
                onSelect={handleSelectProfessional}
                showServices={false}
              />
            ))}
          </div>
        </div>
      );
    }

    // Paso 3: Seleccionar fecha y hora
    if (currentStep === 3) {
      const availableDates = getAvailableDates();
      
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¿Cuándo te gustaría tu cita?</h2>
            <p className="text-gray-600">Selecciona una fecha y luego elige el horario</p>
          </div>

          {/* Selector de fecha */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Selecciona una fecha
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {availableDates.map((date) => {
                const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <button
                    key={date.toString()}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedSlot(null); // Limpiar horario al cambiar fecha
                    }}
                    className={`
                      flex flex-col items-center p-3 rounded-lg transition-all duration-200
                      ${isSelected
                        ? 'bg-primary text-white shadow-lg ring-2 ring-primary/50'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary'
                      }
                    `}
                  >
                    <span className="text-xs font-medium uppercase">
                      {format(date, 'EEE', { locale: es })}
                    </span>
                    <span className="text-2xl font-bold">
                      {format(date, 'd')}
                    </span>
                    <span className="text-xs">
                      {format(date, 'MMM', { locale: es })}
                    </span>
                    {isToday && (
                      <span className="text-xs font-semibold mt-1">Hoy</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de horario */}
          {selectedDate && (
            <div className="pt-6 border-t border-gray-200">
              <TimeSlotSelector
                businessSlug={business.slug}
                selectedDate={selectedDate}
                serviceId={selectedService?.id}
                professionalId={selectedProfessional?.id}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
            </div>
          )}
        </div>
      );
    }

    // Paso 4: Datos del cliente
    if (currentStep === 4) {
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tus datos de contacto</h2>
            <p className="text-gray-600">Necesitamos esta información para confirmar tu reserva</p>
          </div>

          {/* Resumen de la reserva */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/20">
            <h3 className="font-semibold text-gray-800 mb-4">Resumen de tu reserva:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Servicio:</span>
                <span className="font-medium text-gray-800">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profesional:</span>
                <span className="font-medium text-gray-800">{selectedProfessional?.name || 'Cualquiera'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium text-gray-800">
                  {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hora:</span>
                <span className="font-medium text-gray-800">{selectedSlot}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-primary/20">
                <span className="text-gray-600">Duración:</span>
                <span className="font-medium text-gray-800">{selectedService?.duration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio:</span>
                <span className="font-bold text-primary text-lg">${parseFloat(selectedService?.price).toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={clientData.name}
                onChange={(e) => handleClientDataChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Juan Pérez"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={clientData.phone}
                onChange={(e) => handleClientDataChange('phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="3001234567"
              />
            </div>

            {/* Email (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email (opcional)
              </label>
              <input
                type="email"
                value={clientData.email}
                onChange={(e) => handleClientDataChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="juan@ejemplo.com"
              />
            </div>

            {/* Notas (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Notas adicionales (opcional)
              </label>
              <textarea
                value={clientData.notes}
                onChange={(e) => handleClientDataChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Algún detalle que debamos saber..."
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  /**
   * Render principal
   */
  return (
    <div className="space-y-8 notranslate" translate="no">
      {/* Indicadores de progreso */}
      {renderProgress()}

      {/* Contenido del paso */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <div className="text-red-600 text-sm flex-1">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        {/* Botón atrás */}
        <button
          onClick={handleBack}
          disabled={currentStep === 1 || loading}
          className={`
            px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all
            ${currentStep === 1 || loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Atrás</span>
        </button>

        {/* Botón siguiente / confirmar */}
        {currentStep < totalSteps ? (
          <button
            onClick={handleNext}
            disabled={!canGoNext() || loading}
            className={`
              px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all
              ${canGoNext() && !loading
                ? 'bg-primary text-white hover:bg-primary/90 shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <span>Siguiente</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canGoNext() || loading}
            className={`
              px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all
              ${canGoNext() && !loading
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirmar Reserva</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default BookingWizard;
