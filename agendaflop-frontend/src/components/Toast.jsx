/**
 * =============================================================================
 * TOAST NOTIFICATION - Sistema de Notificaciones Toast
 * =============================================================================
 * 
 * Componente de notificación toast moderna y animada:
 * - Diferentes tipos: success, error, warning, info
 * - Animaciones suaves de entrada/salida
 * - Auto-cierre configurable
 * - Icono según el tipo
 * - Botón de cierre manual
 * - Posición fija en la esquina superior derecha
 * 
 * Props:
 * - type: string - Tipo de notificación (success, error, warning, info)
 * - message: string - Mensaje a mostrar
 * - onClose: function - Callback al cerrar
 * - duration: number - Duración en ms antes de auto-cerrar (default: 5000)
 * 
 * =============================================================================
 */

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

function Toast({ type = 'info', message, onClose, duration = 5000 }) {
  const [isExiting, setIsExiting] = useState(false);

  /**
   * Configuración de estilos e iconos según el tipo
   */
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      progressColor: 'bg-green-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      progressColor: 'bg-red-500'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-600',
      progressColor: 'bg-orange-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      progressColor: 'bg-blue-500'
    }
  };

  const currentConfig = config[type] || config.info;
  const Icon = currentConfig.icon;

  /**
   * Manejar auto-cierre
   */
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  /**
   * Manejar cierre con animación
   */
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`
        fixed top-6 right-6 z-[9999] max-w-md w-full
        transform transition-all duration-300 ease-out
        ${isExiting 
          ? 'translate-x-[120%] opacity-0' 
          : 'translate-x-0 opacity-100'
        }
      `}
    >
      <div
        className={`
          ${currentConfig.bgColor} ${currentConfig.borderColor}
          border-l-4 rounded-lg shadow-lg p-4
          flex items-start gap-3
        `}
      >
        {/* Icono */}
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${currentConfig.iconColor}`} />
        </div>

        {/* Mensaje */}
        <div className="flex-1 pt-0.5">
          <p className={`font-medium ${currentConfig.textColor}`}>
            {message}
          </p>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 ${currentConfig.textColor} 
            opacity-70 hover:opacity-100 transition-opacity
          `}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Barra de progreso */}
      {duration > 0 && (
        <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className={`h-full ${currentConfig.progressColor} animate-progress`}
            style={{
              animation: `progress ${duration}ms linear forwards`
            }}
          ></div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation: progress ${duration}ms linear forwards;
        }
      `}</style>
    </div>
  );
}

/**
 * =============================================================================
 * TOAST CONTAINER - Contenedor para múltiples toasts
 * =============================================================================
 * 
 * Componente que maneja múltiples notificaciones toast apiladas
 * 
 * Props:
 * - toasts: array - Array de objetos con {id, type, message}
 * - onRemove: function - Callback al remover un toast por id
 * 
 * =============================================================================
 */
export function ToastContainer({ toasts = [], onRemove }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] space-y-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 9999 - index
          }}
        >
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => onRemove(toast.id)}
            duration={toast.duration || 5000}
          />
        </div>
      ))}
    </div>
  );
}

export default Toast;
