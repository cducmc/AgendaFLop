/**
 * Theme Manager - Gestiona los colores dinámicos del negocio
 * Aplica los colores configurados en el negocio como CSS variables
 */

/**
 * Aplica los colores del negocio como variables CSS globales
 * @param {string} primaryColor - Color primario en formato hex (#RRGGBB)
 * @param {string} secondaryColor - Color secundario en formato hex (#RRGGBB)
 */
export const applyBusinessTheme = (primaryColor, secondaryColor) => {
  if (!primaryColor || !secondaryColor) {
    console.warn('No se aplicó tema: colores no proporcionados');
    return;
  }

  const root = document.documentElement;
  
  // Convertir hex a RGB para Tailwind (necesario para opacidad)
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);
  
  // Aplicar colores principales como canales RGB (para Tailwind)
  root.style.setProperty('--color-primary', primaryRgb);
  root.style.setProperty('--color-secondary', secondaryRgb);
  
  // También mantener versiones hex para referencia
  root.style.setProperty('--color-primary-hex', primaryColor);
  root.style.setProperty('--color-secondary-hex', secondaryColor);
  
  // Generar variantes automáticamente
  const primaryLight = lightenColor(primaryColor, 10);
  const primaryDark = darkenColor(primaryColor, 10);
  const secondaryLight = lightenColor(secondaryColor, 10);
  const secondaryDark = darkenColor(secondaryColor, 10);
  
  const primaryLightRgb = hexToRgb(primaryLight);
  const primaryDarkRgb = hexToRgb(primaryDark);
  const secondaryLightRgb = hexToRgb(secondaryLight);
  const secondaryDarkRgb = hexToRgb(secondaryDark);
  
  root.style.setProperty('--color-primary-light', primaryLightRgb);
  root.style.setProperty('--color-primary-dark', primaryDarkRgb);
  root.style.setProperty('--color-secondary-light', secondaryLightRgb);
  root.style.setProperty('--color-secondary-dark', secondaryDarkRgb);
  
  console.log('✅ Tema aplicado:', { 
    primaryColor, 
    secondaryColor,
    primaryRgb,
    secondaryRgb
  });
};

/**
 * Restaura los colores por defecto del sistema
 */
export const resetToDefaultTheme = () => {
  const root = document.documentElement;
  // Indigo RGB: 99, 102, 241
  root.style.setProperty('--color-primary', '99 102 241');
  root.style.setProperty('--color-primary-hex', '#6366f1');
  // Purple RGB: 139, 92, 246
  root.style.setProperty('--color-secondary', '139 92 246');
  root.style.setProperty('--color-secondary-hex', '#8b5cf6');
  // Light variants
  root.style.setProperty('--color-primary-light', '129 140 248');
  root.style.setProperty('--color-primary-dark', '79 70 229');
  root.style.setProperty('--color-secondary-light', '167 139 250');
  root.style.setProperty('--color-secondary-dark', '124 58 237');
  console.log('✅ Tema restaurado a colores por defecto');
};

/**
 * Convierte color hex a RGB
 * Formato de retorno compatible con Tailwind CSS variables
 * @param {string} hex - Color en formato hex (#RRGGBB)
 * @returns {string} - Color en formato "R G B" para Tailwind
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return '0 0 0'; // Negro por defecto si el formato es inválido
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r} ${g} ${b}`; // Formato Tailwind: "R G B"
}

/**
 * Aclara un color hex
 */
function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, ((num >> 16) & 0xff) + amt);
  const G = Math.min(255, ((num >> 8) & 0xff) + amt);
  const B = Math.min(255, (num & 0xff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/**
 * Oscurece un color hex
 */
function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, ((num >> 16) & 0xff) - amt);
  const G = Math.max(0, ((num >> 8) & 0xff) - amt);
  const B = Math.max(0, (num & 0xff) - amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/**
 * Obtiene los colores actuales del tema desde CSS variables
 */
export const getCurrentTheme = () => {
  const root = getComputedStyle(document.documentElement);
  return {
    primaryColor: root.getPropertyValue('--color-primary-hex').trim() || '#6366f1',
    secondaryColor: root.getPropertyValue('--color-secondary-hex').trim() || '#8b5cf6',
  };
};
