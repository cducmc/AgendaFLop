/**
 * =============================================================================
 * CONFIRMATION DIALOG - Diálogo de Confirmación
 * =============================================================================
 * 
 * Componente modal para confirmar acciones destructivas o importantes:
 * - Cancelar citas (con campo de razón)
 * - Eliminar registros
 * - Cambios irreversibles
 * 
 * Props:
 * - isOpen: Boolean - Controla si el diálogo está abierto
 * - onClose: Function - Función que se ejecuta al cerrar
 * - onConfirm: Function - Función que se ejecuta al confirmar
 * - title: String - Título del diálogo
 * - message: String - Mensaje descriptivo
 * - confirmText: String - Texto del botón confirmar (default: "Confirmar")
 * - cancelText: String - Texto del botón cancelar (default: "Cancelar")
 * - variant: String - Tipo de diálogo: 'danger' | 'warning' | 'info'
 * - requireReason: Boolean - Si requiere ingresar una razón
 * - isLoading: Boolean - Estado de carga
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

function ConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  requireReason = false,
  isLoading = false
}) {
  const [reason, setReason] = useState('');

  // Resetear razón al cerrar el modal
  useEffect(() => {
    if (!isOpen) {
      setReason('');
    }
  }, [isOpen]);

  // Manejar tecla ESC
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLoading, onClose]);

  // No renderizar si está cerrado
  if (!isOpen) return null;

  /**
   * Manejar confirmación
   */
  const handleConfirm = () => {
    if (requireReason) {
      onConfirm(reason);
    } else {
      onConfirm();
    }
  };

  // Estilos según variante
  const variantStyles = {
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const styles = variantStyles[variant];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con icono de advertencia */}
          <div className={`flex items-start p-6 border-b-2 ${styles.border}`}>
            <div className={`flex-shrink-0 p-2 rounded-full ${styles.bg}`}>
              <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Contenido - Campo de razón si es requerido */}
          {requireReason && (
            <div className="p-6">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Razón de cancelación <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Cliente canceló por motivos personales"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={isLoading}
                maxLength={200}
              />
              <p className="mt-1 text-sm text-gray-500">
                {reason.length}/200 caracteres
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 p-6 bg-gray-50 rounded-b-2xl">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || (requireReason && !reason.trim())}
              className={`
                flex-1 px-4 py-2.5 text-white font-medium rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-offset-2 
                transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg hover:shadow-xl
                flex items-center justify-center
                ${styles.button}
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmationDialog;
