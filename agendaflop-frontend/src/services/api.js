/**
 * =============================================================================
 * API SERVICE - Configuración centralizada de Axios
 * =============================================================================
 * 
 * Interceptores automáticos:
 * - Request: Agrega JWT token en cada petición
 * - Response: Maneja refresh token en caso de expiración
 * - Error: Logout automático si token inválido
 * =============================================================================
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Crear instancia de axios con configuración
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Agregar JWT token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Manejar refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si token expiró (401) y no es un retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Intentar refrescar token
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        // Guardar nuevo access token
        localStorage.setItem('access_token', data.access);

        // Reintentar petición original con nuevo token
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si refresh falla, limpiar tokens y redirigir a login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// =============================================================================
// APPOINTMENTS API
// =============================================================================
export const appointmentsAPI = {
  getAll: (params = {}) => api.get('/appointments/', { params }),
  create: (data) => api.post('/appointments/', data),
  getById: (id) => api.get(`/appointments/${id}/`),
  update: (id, data) => api.patch(`/appointments/${id}/`, data),
  delete: (id) => api.delete(`/appointments/${id}/`),
  confirm: (id) => api.post(`/appointments/${id}/confirm/`),
  cancel: (id, cancellation_reason) => api.post(`/appointments/${id}/cancel/`, { cancellation_reason }),
  complete: (id) => api.post(`/appointments/${id}/complete/`),
  noShow: (id) => api.post(`/appointments/${id}/no_show/`),
  today: () => api.get('/appointments/today/'),
  upcoming: () => api.get('/appointments/upcoming/'),
  stats: () => api.get('/appointments/stats/'),
  
  // Endpoints de analytics avanzados (Bloque 2)
  analytics: () => api.get('/appointments/analytics/'),
  revenue: () => api.get('/appointments/revenue/'),
  popularServices: () => api.get('/appointments/popular_services/'),
  popularTimes: () => api.get('/appointments/popular_times/'),
  professionalStats: () => api.get('/appointments/professional_stats/'),
  
  // Endpoints de calendario (Bloque 3)
  calendarRange: (startDate, endDate) => api.get('/appointments/calendar_range/', {
    params: { start_date: startDate, end_date: endDate }
  }),
  reschedule: (id, newDate, newTime) => api.post(`/appointments/${id}/reschedule/`, {
    new_date: newDate,
    new_time: newTime
  }),
};

// =============================================================================
// SERVICES API
// =============================================================================
export const servicesAPI = {
  getAll: (params = {}) => api.get('/services/', { params }),
  create: (data) => api.post('/services/', data),
  getById: (id) => api.get(`/services/${id}/`),
  update: (id, data) => api.patch(`/services/${id}/`, data),
  delete: (id) => api.delete(`/services/${id}/`),
};

// =============================================================================
// PROFESSIONALS API
// =============================================================================
export const professionalsAPI = {
  getAll: (params = {}) => api.get('/professionals/', { params }),
  create: (data) => api.post('/professionals/', data),
  getById: (id) => api.get(`/professionals/${id}/`),
  update: (id, data) => api.patch(`/professionals/${id}/`, data),
  delete: (id) => api.delete(`/professionals/${id}/`),
  available: () => api.get('/professionals/available/'),
};

// =============================================================================
// CLIENTS API
// =============================================================================
export const clientsAPI = {
  getAll: (params = {}) => api.get('/clients/', { params }),
  create: (data) => api.post('/clients/', data),
  getById: (id) => api.get(`/clients/${id}/`),
  update: (id, data) => api.patch(`/clients/${id}/`, data),
  delete: (id) => api.delete(`/clients/${id}/`),
  vip: () => api.get('/clients/vip/'),
  toggleVip: (id) => api.post(`/clients/${id}/toggle_vip/`),
};

// =============================================================================
// NOTIFICATIONS API (Bloque 4)
// =============================================================================
export const notificationsAPI = {
  // Obtener todas las notificaciones
  getAll: (params = {}) => api.get('/notifications/', { params }),
  
  // Obtener contador de no leídas
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  
  // Marcar una notificación como leída
  markAsRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  
  // Marcar todas las notificaciones como leídas
  markAllAsRead: () => api.post('/notifications/mark_all_read/'),
  
  // Obtener detalle de una notificación
  getById: (id) => api.get(`/notifications/${id}/`),
};

// =============================================================================
// BUSINESS API
// =============================================================================
export const businessAPI = {
  getAll: () => api.get('/businesses/'),
  getMy: () => api.get('/businesses/me/'),
  update: (data, isFormData = false) => {
    // Si es FormData (por upload de archivos), configurar headers apropiados
    const config = isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    } : {};
    
    return api.patch('/businesses/me/', data, config);
  },
};

// =============================================================================
// AVAILABILITY API - Reglas y excepciones de disponibilidad (Bloque 8)
// =============================================================================
export const availabilityAPI = {
  // Reglas
  getRules: (params = {}) => api.get('/availability-rules/', { params }),
  createRule: (data) => api.post('/availability-rules/', data),
  updateRule: (id, data) => api.patch(`/availability-rules/${id}/`, data),
  deleteRule: (id) => api.delete(`/availability-rules/${id}/`),

  // Excepciones
  getExceptions: (params = {}) => api.get('/availability-exceptions/', { params }),
  createException: (data) => api.post('/availability-exceptions/', data),
  updateException: (id, data) => api.patch(`/availability-exceptions/${id}/`, data),
  deleteException: (id) => api.delete(`/availability-exceptions/${id}/`),
};

// =============================================================================
// PLATFORM ADMIN API - Solo para super_admin
// =============================================================================
export const platformAPI = {
  // Listar todos los negocios con estadísticas
  getAllBusinesses: (params = {}) => api.get('/platform/businesses/', { params }),
  
  // Obtener detalle de un negocio específico
  getBusinessById: (id) => api.get(`/platform/businesses/${id}/`),
  
  // Actualizar información de un negocio
  updateBusiness: (id, data) => api.patch(`/platform/businesses/${id}/`, data),
  
  // Activar/desactivar negocio
  toggleActive: (id) => api.post(`/platform/businesses/${id}/toggle_active/`),
  
  // Verificar/desverificar negocio
  toggleVerified: (id) => api.post(`/platform/businesses/${id}/toggle_verified/`),
};

// =============================================================================
// PUBLIC API - Sin autenticación requerida (portal de reservas)
// =============================================================================
export const publicAPI = {
  /**
   * Obtener información pública de un negocio
   * GET /api/public/businesses/:slug/
   */
  getBusinessBySlug: (slug) => 
    axios.get(`${API_BASE_URL}/public/businesses/${slug}/`),
  
  /**
   * Obtener servicios disponibles para reserva online
   * GET /api/public/businesses/:slug/services/
   */
  getPublicServices: (slug) => 
    axios.get(`${API_BASE_URL}/public/businesses/${slug}/services/`),
  
  /**
   * Obtener profesionales disponibles para reserva online
   * GET /api/public/businesses/:slug/professionals/
   */
  getPublicProfessionals: (slug) => 
    axios.get(`${API_BASE_URL}/public/businesses/${slug}/professionals/`),
  
  /**
   * Obtener horarios disponibles para una fecha, servicio y profesional
   * GET /api/public/businesses/:slug/availability/?date=YYYY-MM-DD&service_id=xxx&professional_id=xxx
   */
  getAvailability: (slug, params) => 
    axios.get(`${API_BASE_URL}/public/businesses/${slug}/availability/`, { params }),
  
  /**
   * Crear una reserva pública
   * POST /api/public/businesses/:slug/appointments/
   */
  createPublicAppointment: (slug, data) => 
    axios.post(`${API_BASE_URL}/public/businesses/${slug}/appointments/`, data),
};

// =============================================================================
// ONBOARDING API - Sistema de onboarding para nuevos usuarios
// =============================================================================
export const onboardingAPI = {
  /**
   * Obtener el progreso completo de onboarding del usuario actual
   * GET /api/onboarding/
   * 
   * @returns {Promise} Progreso de onboarding con todos los pasos y porcentaje
   */
  getProgress: () => api.get('/onboarding/'),
  
  /**
   * Quick check del estado de onboarding (solo porcentaje y estado)
   * GET /api/onboarding/status/
   * 
   * Útil para mostrar progreso en la UI sin cargar todos los detalles
   * 
   * @returns {Promise} { completion_percentage, is_completed, is_dismissed, pending_steps_count, completed_steps_count }
   */
  getStatus: () => api.get('/onboarding/status/'),
  
  /**
   * Marcar un paso específico como completado manualmente
   * POST /api/onboarding/mark_step/
   * 
   * @param {string} stepKey - Nombre del campo del paso a marcar
   *   Opciones: 'has_created_service', 'has_configured_hours', 
   *            'has_created_professional', 'has_customized_branding',
   *            'has_created_first_appointment', 'has_invited_team_member',
   *            'has_tested_public_booking'
   * @param {boolean} completed - True para marcar como completado, False para desmarcar
   * 
   * @returns {Promise} Progreso actualizado
   */
  markStep: (stepKey, completed = true) => 
    api.post('/onboarding/mark_step/', { 
      step_key: stepKey, 
      completed 
    }),
  
  /**
   * Descartar/saltar el wizard de onboarding
   * POST /api/onboarding/dismiss/
   * 
   * El usuario puede retomarlo en cualquier momento desde el dashboard
   * 
   * @returns {Promise} Confirmación de descarte
   */
  dismiss: () => api.post('/onboarding/dismiss/'),
};

// =============================================================================
// REPORTS API - Sistema de reportes y analytics avanzados
// =============================================================================
export const reportsAPI = {
  /**
   * Obtener resumen de citas con métricas clave
   * GET /api/reports/appointments/summary/
   * 
   * @param {Object} params - Parámetros de filtro
   * @param {string} params.start_date - Fecha inicio (YYYY-MM-DD)
   * @param {string} params.end_date - Fecha fin (YYYY-MM-DD)
   * @param {number} params.service_id - ID del servicio (opcional)
   * @param {number} params.professional_id - ID del profesional (opcional)
   * 
   * @returns {Promise} Métricas de citas (total, por estado, tasas, tendencia)
   */
  getAppointmentsSummary: (params = {}) => 
    api.get('/reports/appointments/summary/', { params }),
  
  /**
   * Obtener resumen de ingresos
   * GET /api/reports/revenue/summary/
   * 
   * @param {Object} params - Parámetros de filtro
   * @param {string} params.start_date - Fecha inicio (YYYY-MM-DD)
   * @param {string} params.end_date - Fecha fin (YYYY-MM-DD)
   * 
   * @returns {Promise} Métricas de ingresos (total, ticket promedio, proyección)
   */
  getRevenueSummary: (params = {}) => 
    api.get('/reports/revenue/summary/', { params }),
  
  /**
   * Obtener resumen de clientes
   * GET /api/reports/clients/summary/
   * 
   * @param {Object} params - Parámetros de filtro
   * @param {string} params.start_date - Fecha inicio (YYYY-MM-DD)
   * @param {string} params.end_date - Fecha fin (YYYY-MM-DD)
   * 
   * @returns {Promise} Métricas de clientes (total, nuevos, retención, top clients)
   */
  getClientsSummary: (params = {}) => 
    api.get('/reports/clients/summary/', { params }),
  
  /**
   * Obtener resumen de profesionales
   * GET /api/reports/professionals/summary/
   * 
   * @param {Object} params - Parámetros de filtro
   * @param {string} params.start_date - Fecha inicio (YYYY-MM-DD)
   * @param {string} params.end_date - Fecha fin (YYYY-MM-DD)
   * 
   * @returns {Promise} Métricas de profesionales (desempeño, citas, ingresos)
   */
  getProfessionalsSummary: (params = {}) => 
    api.get('/reports/professionals/summary/', { params }),
  
  /**
   * Obtener resumen de operaciones
   * GET /api/reports/operations/summary/
   * 
   * @param {Object} params - Parámetros de filtro
   * @param {string} params.start_date - Fecha inicio (YYYY-MM-DD)
   * @param {string} params.end_date - Fecha fin (YYYY-MM-DD)
   * 
   * @returns {Promise} Métricas operativas (duración, utilización, horas pico)
   */
  getOperationsSummary: (params = {}) => 
    api.get('/reports/operations/summary/', { params }),

  /**
   * Exportar reporte en PDF
   * GET /api/reports/export/pdf/
   *
   * @param {Object} params - Parámetros de exportación
   * @param {string} params.report_type - Tipo de reporte (appointments, revenue, clients, professionals, operations)
   * @param {string} params.start_date - Fecha inicio (YYYY-MM-DD)
   * @param {string} params.end_date - Fecha fin (YYYY-MM-DD)
   *
   * @returns {Promise} Archivo PDF (blob)
   */
  exportPdf: (params = {}) =>
    api.get('/reports/export/pdf/', { params, responseType: 'blob' }),
};

export default api;


