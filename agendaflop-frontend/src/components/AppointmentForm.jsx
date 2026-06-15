/**
 * =============================================================================
 * APPOINTMENT FORM - Formulario de Creación/Edición de Citas
 * =============================================================================
 * 
 * Formulario completo para gestionar citas con:
 * - Validaciones en tiempo real con React Hook Form
 * - Campos organizados por secciones
 * - Mensajes de error claros
 * - Diseño responsivo y moderno
 * - Cálculo automático de precios
 * 
 * Props:
 * - onSubmit: Function - Función que se ejecuta al enviar el formulario
 * - onCancel: Function - Función que se ejecuta al cancelar
 * - initialData: Object - Datos iniciales para edición (opcional)
 * - isLoading: Boolean - Estado de carga durante el envío
 * 
 * =============================================================================
 */

import { useForm } from 'react-hook-form';
import { Calendar, Clock, User, Phone, Mail, Briefcase, DollarSign, FileText } from 'lucide-react';

function AppointmentForm({ onSubmit, onCancel, initialData = null, isLoading = false }) {
  // Configuración de React Hook Form con valores por defecto
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: initialData || {
      client_name: '',
      client_phone: '',
      client_email: '',
      service_name: '',
      service_duration: 30,
      service_price: '',
      appointment_date: '',
      appointment_time: '',
      notes: '',
      status: 'pending'
    }
  });

  // Observar cambios en campos específicos para cálculos dinámicos
  const serviceDuration = watch('service_duration');

  /**
   * Función auxiliar para renderizar campos de texto
   */
  const renderTextField = ({ name, label, icon: Icon, type = 'text', placeholder, validation, helpText }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {validation?.required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        {/* Icono dentro del input */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        
        {/* Input */}
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          {...register(name, validation)}
          className={`
            block w-full pl-10 pr-3 py-2.5 border rounded-lg
            focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-all duration-200
            ${errors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
            disabled:bg-gray-100 disabled:cursor-not-allowed
          `}
          disabled={isLoading}
        />
      </div>
      
      {/* Mensaje de ayuda */}
      {helpText && !errors[name] && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      
      {/* Mensaje de error */}
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {errors[name].message}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* ===================================================================
          SECCIÓN 1: INFORMACIÓN DEL CLIENTE
          =================================================================== */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-primary" />
          Información del Cliente
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderTextField({
            name: 'client_name',
            label: 'Nombre completo',
            icon: User,
            placeholder: 'Ej: Juan Pérez',
            validation: {
              required: 'El nombre del cliente es obligatorio',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              maxLength: { value: 150, message: 'Máximo 150 caracteres' }
            }
          })}

          {renderTextField({
            name: 'client_phone',
            label: 'Teléfono',
            icon: Phone,
            type: 'tel',
            placeholder: 'Ej: +57 300 123 4567',
            validation: {
              required: 'El teléfono es obligatorio',
              pattern: {
                value: /^[\d\s\-\+\(\)]+$/,
                message: 'Formato de teléfono inválido'
              }
            },
            helpText: 'Formato: +57 300 123 4567'
          })}

          <div className="md:col-span-2">
            {renderTextField({
              name: 'client_email',
              label: 'Email',
              icon: Mail,
              type: 'email',
              placeholder: 'cliente@email.com',
              validation: {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              },
              helpText: 'Opcional - Para enviar confirmaciones'
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================
          SECCIÓN 2: INFORMACIÓN DEL SERVICIO
          =================================================================== */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
          Información del Servicio
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            {renderTextField({
              name: 'service_name',
              label: 'Nombre del servicio',
              icon: Briefcase,
              placeholder: 'Ej: Corte de cabello, Manicure, Consulta',
              validation: {
                required: 'El servicio es obligatorio',
                maxLength: { value: 200, message: 'Máximo 200 caracteres' }
              }
            })}
          </div>

          <div>
            <label htmlFor="service_duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duración (minutos) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="service_duration"
                type="number"
                min="5"
                max="480"
                step="5"
                {...register('service_duration', {
                  required: 'La duración es obligatoria',
                  min: { value: 5, message: 'Mínimo 5 minutos' },
                  max: { value: 480, message: 'Máximo 8 horas' }
                })}
                className={`
                  block w-full pl-10 pr-3 py-2.5 border rounded-lg
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  ${errors.service_duration ? 'border-red-500' : 'border-gray-300'}
                `}
                disabled={isLoading}
              />
            </div>
            {serviceDuration && (
              <p className="mt-1 text-sm text-gray-500">
                ≈ {Math.floor(serviceDuration / 60)}h {serviceDuration % 60}min
              </p>
            )}
            {errors.service_duration && (
              <p className="mt-1 text-sm text-red-600">{errors.service_duration.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            {renderTextField({
              name: 'service_price',
              label: 'Precio',
              icon: DollarSign,
              type: 'number',
              placeholder: '25000',
              validation: {
                required: 'El precio es obligatorio',
                min: { value: 0, message: 'El precio debe ser mayor a 0' },
                max: { value: 10000000, message: 'Precio máximo: 10.000.000' }
              },
              helpText: 'Precio en pesos colombianos (COP)'
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================
          SECCIÓN 3: FECHA Y HORA
          =================================================================== */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-green-600" />
          Fecha y Hora de la Cita
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderTextField({
            name: 'appointment_date',
            label: 'Fecha',
            icon: Calendar,
            type: 'date',
            validation: {
              required: 'La fecha es obligatoria'
            },
            helpText: 'Selecciona una fecha futura'
          })}

          {renderTextField({
            name: 'appointment_time',
            label: 'Hora',
            icon: Clock,
            type: 'time',
            validation: {
              required: 'La hora es obligatoria'
            },
            helpText: 'Formato 24 horas'
          })}
        </div>
      </div>

      {/* ===================================================================
          SECCIÓN 4: NOTAS ADICIONALES
          =================================================================== */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          <FileText className="inline w-4 h-4 mr-1" />
          Notas adicionales
        </label>
        <textarea
          id="notes"
          rows="3"
          placeholder="Información adicional sobre la cita..."
          {...register('notes', {
            maxLength: { value: 500, message: 'Máximo 500 caracteres' }
          })}
          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          disabled={isLoading}
        />
        <p className="mt-1 text-sm text-gray-500">Opcional - Máximo 500 caracteres</p>
      </div>

      {/* ===================================================================
          BOTONES DE ACCIÓN
          =================================================================== */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        {/* Botón Cancelar */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>

        {/* Botón Guardar */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              {initialData ? 'Actualizar Cita' : 'Crear Cita'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default AppointmentForm;
