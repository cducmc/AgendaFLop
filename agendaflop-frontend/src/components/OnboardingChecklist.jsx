/**
 * =============================================================================
 * ONBOARDING CHECKLIST - Lista de progreso de onboarding (Bloque 5)
 * =============================================================================
 * 
 * Componente de checklist para guiar a nuevos usuarios en la configuración inicial:
 * - Barra de progreso con porcentaje
 * - Lista de pasos con estado (completado/pendiente)
 * - Iconos visuales para cada paso
 * - Links directos para completar cada paso
 * - Animación de confetti al completar 100%
 * - Botón para descartar/saltar el onboarding
 * - Auto-refresh cuando se completan pasos
 * - Diferenciación visual entre pasos obligatorios y opcionales
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Wrench, 
  Clock, 
  Users, 
  Palette, 
  Calendar, 
  UserPlus, 
  Globe,
  TrendingUp,
  X,
  Sparkles
} from 'lucide-react';
import { onboardingAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * Configuración de pasos del onboarding con metadata
 */
const ONBOARDING_STEPS = {
  has_created_service: {
    label: 'Crear tu primer servicio',
    description: 'Define los servicios que ofrece tu negocio',
    icon: Wrench,
    link: '/services',
    required: true,
  },
  has_configured_hours: {
    label: 'Configurar horario de atención',
    description: 'Establece tus horarios de trabajo',
    icon: Clock,
    link: '/settings',
    required: true,
  },
  has_created_professional: {
    label: 'Agregar profesionales',
    description: 'Añade a tu equipo de trabajo',
    icon: Users,
    link: '/professionals',
    required: true,
  },
  has_created_first_appointment: {
    label: 'Crear tu primera cita',
    description: 'Agenda una cita de prueba',
    icon: Calendar,
    link: '/appointments',
    required: true,
  },
  has_customized_branding: {
    label: 'Personalizar tu marca',
    description: 'Agrega logo y colores (opcional)',
    icon: Palette,
    link: '/settings',
    required: false,
  },
  has_invited_team_member: {
    label: 'Invitar miembros del equipo',
    description: 'Colabora con tu equipo (opcional)',
    icon: UserPlus,
    link: '/team',
    required: false,
  },
  has_tested_public_booking: {
    label: 'Probar portal de reservas',
    description: 'Verifica cómo se ve tu sitio público (opcional)',
    icon: Globe,
    link: '/public-portal',
    required: false,
  },
};

function OnboardingChecklist({ onDismiss }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  /**
   * Cargar progreso de onboarding al montar
   */
  useEffect(() => {
    loadProgress();
    
    // Auto-refresh cada 10 segundos para detectar cambios
    const interval = setInterval(loadProgress, 10000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Detectar cuando se completa el onboarding (100%)
   */
  useEffect(() => {
    if (progress && progress.completion_percentage === 100 && !showConfetti) {
      setShowConfetti(true);
      
      // Ocultar confetti después de 5 segundos
      setTimeout(() => setShowConfetti(false), 5000);
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
      console.error('Error cargando progreso de onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Descartar el onboarding
   */
  const handleDismiss = async () => {
    try {
      await onboardingAPI.dismiss();
      if (onDismiss) onDismiss();
    } catch (err) {
      console.error('Error al descartar onboarding:', err);
    }
  };

  /**
   * Marcar un paso como completado manualmente (para pasos que no se auto-detectan)
   */
  const handleMarkComplete = async (stepKey) => {
    try {
      const response = await onboardingAPI.markStep(stepKey, true);
      setProgress(response.data.data);
    } catch (err) {
      console.error('Error al marcar paso:', err);
    }
  };

  /**
   * Navegar a la página para completar un paso
   */
  const handleStepClick = (step) => {
    const config = ONBOARDING_STEPS[step.key];
    if (config?.link) {
      navigate(config.link);
    }
  };

  // No mostrar si está completado o descartado
  if (!loading && progress && (progress.is_completed || progress.is_dismissed)) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-2 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progress) return null;

  const completionPercentage = progress.completion_percentage || 0;
  const pendingSteps = progress.pending_steps || [];
  const completedSteps = progress.completed_steps || [];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-sm p-6 border border-indigo-100 relative overflow-hidden">
      {/* Confetti animation cuando se completa */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-0 left-1/4 animate-bounce">
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="absolute top-0 right-1/4 animate-bounce delay-100">
            <Sparkles className="w-6 h-6 text-pink-400" />
          </div>
          <div className="absolute bottom-0 left-1/3 animate-bounce delay-200">
            <Sparkles className="w-7 h-7 text-blue-400" />
          </div>
        </div>
      )}

      {/* Header con título y botón cerrar */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              ¡Bienvenido a AgendaFlop! 🎉
            </h3>
            <p className="text-sm text-gray-600">
              Completa estos pasos para configurar tu negocio
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Cerrar onboarding"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progreso general
          </span>
          <span className="text-sm font-bold text-indigo-600">
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Lista de pasos completados */}
      {completedSteps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completados ({completedSteps.length})
          </h4>
          <div className="space-y-2">
            {completedSteps.map((step) => {
              const config = ONBOARDING_STEPS[step.key];
              const Icon = config?.icon || CheckCircle2;
              
              return (
                <div
                  key={step.key}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <Icon className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 line-through">
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de pasos pendientes */}
      {pendingSteps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Circle className="w-4 h-4" />
            Pendientes ({pendingSteps.length})
          </h4>
          <div className="space-y-2">
            {pendingSteps.map((step) => {
              const config = ONBOARDING_STEPS[step.key];
              const Icon = config?.icon || Circle;
              
              return (
                <button
                  key={step.key}
                  onClick={() => handleStepClick(step)}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                >
                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-indigo-600" />
                  <Icon className="w-5 h-5 text-gray-600 flex-shrink-0 group-hover:text-indigo-600" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-900">
                      {step.label}
                      {!config?.required && (
                        <span className="ml-2 text-xs text-gray-500">(opcional)</span>
                      )}
                    </p>
                    {config?.description && (
                      <p className="text-xs text-gray-600 group-hover:text-indigo-700">
                        {config.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensaje de completado */}
      {completionPercentage === 100 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                ¡Felicitaciones! 🎊
              </p>
              <p className="text-sm text-green-700">
                Has completado la configuración inicial de tu negocio
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer con link al wizard */}
      <div className="mt-4 pt-4 border-t border-indigo-100">
        <p className="text-xs text-gray-600 text-center">
          ¿Necesitas ayuda?{' '}
          <button
            onClick={() => navigate('/onboarding-wizard')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Abre el asistente paso a paso
          </button>
        </p>
      </div>
    </div>
  );
}

export default OnboardingChecklist;
