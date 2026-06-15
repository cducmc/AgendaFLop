/**
 * =============================================================================
 * MODAL COMPONENT - Componente Modal Reutilizable
 * =============================================================================
 * 
 * Componente modal moderno y reutilizable con:
 * - Animaciones suaves de entrada/salida
 * - Click fuera del modal para cerrar
 * - Tecla ESC para cerrar
 * - Diseño responsivo
 * - Overlay con blur
 * 
 * Props:
 * - isOpen: Boolean - Controla si el modal está abierto
 * - onClose: Function - Función que se ejecuta al cerrar
 * - title: String - Título del modal
 * - children: ReactNode - Contenido del modal
 * 
 * =============================================================================
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';

function Modal({ isOpen, onClose, title, children }) {
  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // No renderizar nada si el modal está cerrado
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - Fondo oscuro con blur */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in-up"
          onClick={(e) => e.stopPropagation()} // Prevenir cierre al hacer click dentro del modal
        >
          {/* Header del Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-2xl font-bold text-gray-800">
              {title}
            </h2>
            
            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white hover:shadow-md transition-all duration-200 text-gray-500 hover:text-gray-700"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido del Modal */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-80px)]">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default Modal;
