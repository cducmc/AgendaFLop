/**
 * =============================================================================
 * ONBOARDING WIZARD - Wizard guiado de onboarding (Bloque 5)
 * =============================================================================
 * 
 * Wizard multi-paso que guía a los nuevos usuarios a través de la configuración
 * inicial de su negocio. Cada paso ayuda a completar una tarea específica.
 * 
 * Flujo en 4 pasos principales:
 * 1. Crear primer servicio
 * 2. Configurar horarios de atención
 * 3. Agregar profesional
 * 4. Crear cita de prueba
 * 
 * Características:
 * - Indicador de progreso con puntos
 * - Navegación anterior/siguiente
 * - Saltar paso (skip)
 * - Detección automática de pasos completados
 * - Redirección al dashboard al finalizar
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import * as React from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  Wrench,
  Clock,
  Users,
  Calendar,
  Sparkles,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onboardingAPI } from '../services/api';

/**
 * Configuración de los pasos del wizard
 */
const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Crear tu primer servicio',
    description: 'Define los servicios que vas a ofrecer a tus clientes',
    icon: Wrench,
    stepKey: 'has_created_service',
    color: 'indigo',
    instructions: [
      'Ve a la sección de Servicios',
      'Haz click en "Nuevo Servicio"',
      'Completa el nombre, duración y precio',
      'Guarda el servicio'
    ],
    actionLabel: 'Ir a Servicios',
    actionLink: '/services',
  },
  {
    id: 2,
    title: 'Configurar horarios',
    description: 'Establece tus horarios de atención para cada día de la semana',
    icon: Clock,
    stepKey: 'has_configured_hours',
    color: 'purple',
    instructions: [
      'Ve a Configuración de tu negocio',
      'Busca la sección "Horarios de Atención"',
      'Configura los horarios para cada día',
      'Marca los días que no trabajas como cerrado'
    ],
    actionLabel: 'Ir a Configuración',
    actionLink: '/settings',
  },
  {
    id: 3,
    title: 'Agregar profesionales',
    description: 'Añade a los miembros de tu equipo que atenderán las citas',
    icon: Users,
    stepKey: 'has_created_professional',
    color: 'pink',
    instructions: [
      'Ve a la sección de Profesionales',
      'Haz click en "Nuevo Profesional"',
      'Ingresa el nombre y servicios que ofrece',
      'Configura su horario de trabajo'
    ],
    actionLabel: 'Ir a Profesionales',
    actionLink: '/professionals',
  },
  {
    id: 4,
    title: 'Crear tu primera cita',
    description: 'Prueba el sistema creando una cita de ejemplo',
    icon: Calendar,
    stepKey: 'has_created_first_appointment',
    color: 'green',
    instructions: [
      'Ve a la sección de Citas',
      'Haz click en "Nueva Cita"',
      'Selecciona servicio, profesional y horario',
      'Ingresa los datos del cliente'
    ],
    actionLabel: 'Ir a Citas',
    actionLink: '/appointments',
  },
];

function OnboardingWizard({ onComplete, onDismiss }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const navigate = useNavigate();

  const totalSteps = WIZARD_STEPS.length;
  const currentStepConfig = WIZARD_STEPS.find(s => s.id === currentStep);

  /**
   * Cargar progreso de onboarding al montar
   */
  useEffect(() => {
    loadProgress();
    
    // Auto-refresh cada 5 segundos para detectar pasos completados
    const interval = setInterval(loadProgress, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Detectar pasos completados y actualizar estado
   */
  useEffect(() => {
    if (progress) {
      const completed = new Set();
      WIZARD_STEPS.forEach(step => {
        if (progress[step.stepKey] === true) {
          completed.add(step.id);
        }
      });
      setCompletedSteps(completed);

      // Si todos los pasos están completados, mostrar mensaje de éxito
      if (completed.size === totalSteps && onComplete) {
        setTimeout(() => onComplete(), 2000);
      }
    }
  }, [progress]);

  /**
   * Cargar progreso desde el backend
   */
  const loadProgress = async () => {
    try {
      const response = await onboardingAPI.getProgress();
      setProgress(response.data.data);
    } catch (err) {
      console.error('Error cargando progreso:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navegar al paso anterior
   */
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Navegar al paso siguiente
   */
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Último paso completado, ir al dashboard
      handleFinish();
    }
  };

  /**
   * Saltar paso actual (marcar como no necesario por ahora)
   */
  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  /**
   * Navegar a la página para completar el paso actual
   */
  const handleGoToStep = () => {
    if (currentStepConfig?.actionLink) {
      navigate(currentStepConfig.actionLink);
    }
  };

  /**
   * Finalizar wizard
   */
  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard');
    }
  };

  /**
   * Cerrar wizard completamente
   */
  const handleClose = async () => {
    try {
      await onboardingAPI.dismiss();
      if (onDismiss) {
        onDismiss();
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error al cerrar wizard:', err);
    }
  };

  /**
   * Verificar si el paso actual está completado
   */
  const isCurrentStepCompleted = completedSteps.has(currentStep);

  /**
   * Obtener color según el paso
   */
  const getColorClasses = (color) => {
    const colors = {
      indigo: 'bg-indigo-600 text-white',
      purple: 'bg-purple-600 text-white',
      pink: 'bg-pink-600 text-white',
      green: 'bg-green-600 text-white',
    };
    return colors[color] || colors.indigo;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header con botón cerrar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Configuración Inicial
            </h1>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Cerrar wizard"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Indicador de progreso con puntos */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = step.id === currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Punto del paso */}
                  <div className="relative">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        transition-all duration-300 border-2
                        ${isCompleted 
                          ? 'bg-green-500 border-green-500' 
                          : isCurrent 
                            ? `${getColorClasses(step.color)} border-transparent`
                            : 'bg-white border-gray-300'
                        }
                        hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </button>
                    
                    {/* Label del paso */}
                    <span className={`
                      absolute top-14 left-1/2 transform -translate-x-1/2 whitespace-nowrap
                      text-xs font-medium
                      ${isCurrent ? 'text-gray-900' : 'text-gray-500'}
                    `}>
                      Paso {step.id}
                    </span>
                  </div>
                  
                  {/* Línea conectora */}
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`
                      flex-1 h-1 mx-2
                      ${completedSteps.has(step.id) && completedSteps.has(step.id + 1)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                      }
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card del paso actual */}
        {currentStepConfig && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            {/* Header del paso */}
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-xl ${getColorClasses(currentStepConfig.color)}`}>
                {React.createElement(currentStepConfig.icon, { className: 'w-8 h-8' })}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentStepConfig.title}
                </h2>
                <p className="text-gray-600">
                  {currentStepConfig.description}
                </p>
              </div>
              
              {/* Badge de completado */}
              {isCurrentStepCompleted && (
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Completado
                </div>
              )}
            </div>

            {/* Instrucciones */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">
                Instrucciones
              </h3>
              <ol className="space-y-2">
                {currentStepConfig.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Botón de acción */}
            <button
              onClick={handleGoToStep}
              className={`
                w-full py-3 px-6 rounded-lg font-medium
                ${getColorClasses(currentStepConfig.color)}
                hover:opacity-90 transition-opacity
                flex items-center justify-center gap-2
              `}
            >
              {currentStepConfig.actionLabel}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Navegación del wizard */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              ${currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-white hover:shadow-sm transition-all'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-800 font-medium text-sm underline"
          >
            Saltar este paso
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {currentStep === totalSteps ? 'Finalizar' : 'Siguiente'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de progreso general */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Has completado {completedSteps.size} de {totalSteps} pasos
            {' '}
            ({progress.completion_percentage}% del onboarding total)
          </p>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
