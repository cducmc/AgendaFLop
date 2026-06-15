/**
 * =============================================================================
 * LOADING SPINNER - Componente de Carga
 * =============================================================================
 * 
 * Componente de spinner de carga con diferentes tamaños y modos:
 * - Fullscreen: Ocupa toda la pantalla con overlay
 * - Inline: Se integra en el contenido
 * - Diferentes tamaños: small, medium, large
 * - Texto personalizable
 * 
 * Props:
 * - fullscreen: boolean - Si true, muestra overlay de pantalla completa
 * - size: string - Tamaño del spinner ('small', 'medium', 'large')
 * - text: string - Texto opcional a mostrar debajo del spinner
 * 
 * =============================================================================
 */

import { Loader2 } from 'lucide-react';

function LoadingSpinner({ fullscreen = false, size = 'medium', text = '' }) {
  
  /**
   * Tamaños del spinner
   */
  const sizes = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  const spinnerSize = sizes[size] || sizes.medium;

  /**
   * Spinner básico
   */
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${spinnerSize} text-primary animate-spin`} />
      {text && (
        <p className="text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  /**
   * Si es fullscreen, renderizar con overlay
   */
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  /**
   * Modo inline
   */
  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
}

export default LoadingSpinner;
