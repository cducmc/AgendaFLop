/**
 * =============================================================================
 * APPOINTMENTS LIST PAGE - Página Principal de Gestión de Citas
 * =============================================================================
 * 
 * Página principal que muestra todas las citas y permite:
 * - Ver listado de citas en tarjetas responsivas ✅
 * - Crear nuevas citas mediante modal ✅
 * - Cambiar estado de citas (Confirmar, Cancelar, Completar, No Asistió) ✅
 * - Editar citas existentes ✅
 * - Eliminar citas ✅
 * - Filtrar y buscar citas ✅
 * 
 * Estado actual: Paso 5 completado - Filtros y búsqueda ✅
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../services/api';
import { Calendar, Clock, User, Phone, Plus, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../components/Modal';
import AppointmentForm from '../components/AppointmentForm';
import AppointmentActions from '../components/AppointmentActions';
import ConfirmationDialog from '../components/ConfirmationDialog';
import AppointmentsFilters from '../components/AppointmentsFilters';

function AppointmentsList() {
  // =========================================================================
  // ESTADOS
  // =========================================================================
  
  // Datos de citas
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Control del modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Control del modal de edición
  const [editModal, setEditModal] = useState({
    isOpen: false,
    appointment: null,
    isLoading: false
  });
  
  // Control del diálogo de confirmación para cancelar
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    appointmentId: null,
    isLoading: false
  });
  
  // Control del diálogo de confirmación para eliminar
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    appointmentId: null,
    isLoading: false
  });
  
  // Sistema de notificaciones
  const [notification, setNotification] = useState(null);
  
  // ID de la cita que está siendo procesada (para deshabilitar botones)
  const [processingId, setProcessingId] = useState(null);
  
  // Estado de filtros y búsqueda
  const [filters, setFilters] = useState({
    searchText: '',
    statusFilter: 'all',
    dateFilter: 'all',
    sortBy: 'newest'
  });

  // =========================================================================
  // EFECTOS
  // =========================================================================
  
  // Cargar citas al montar el componente
  useEffect(() => {
    loadAppointments();
  }, []);

  // Auto-ocultar notificaciones después de 5 segundos
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // =========================================================================
  // FUNCIONES
  // =========================================================================
  
  /**
   * Cargar todas las citas desde el API
   */
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentsAPI.getAll();
      setAppointments(response.data.results || []);
    } catch (err) {
      setError('Error al cargar las citas');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar cambios en los filtros
   * @param {Object} newFilters - Nuevos valores de filtros
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  /**
   * Aplicar filtros a las citas
   * @returns {Array} Array de citas filtradas y ordenadas
   */
  const applyFilters = () => {
    let filtered = [...appointments];

    // Filtro de búsqueda por texto (nombre o teléfono)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(app =>
        app.client_name.toLowerCase().includes(searchLower) ||
        app.client_phone.includes(searchLower)
      );
    }

    // Filtro por estado
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === filters.statusFilter);
    }

    // Filtro por fecha
    if (filters.dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const todayDate = new Date(today);
      
      filtered = filtered.filter(app => {
        const appDate = new Date(app.date);
        
        switch (filters.dateFilter) {
          case 'today':
            return app.date === today;
          
          case 'week': {
            const weekFromNow = new Date(todayDate);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return appDate >= todayDate && appDate <= weekFromNow;
          }
          
          case 'month': {
            const monthFromNow = new Date(todayDate);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            return appDate >= todayDate && appDate <= monthFromNow;
          }
          
          case 'past':
            return appDate < todayDate;
          
          case 'future':
            return appDate >= todayDate;
          
          default:
            return true;
        }
      });
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
        
        case 'oldest':
          return new Date(a.created_at || a.date) - new Date(b.created_at || b.date);
        
        case 'price_high':
          return parseFloat(b.price || 0) - parseFloat(a.price || 0);
        
        case 'price_low':
          return parseFloat(a.price || 0) - parseFloat(b.price || 0);
        
        case 'date_asc': {
          const dateCompare = a.date.localeCompare(b.date);
          return dateCompare === 0 ? a.time.localeCompare(b.time) : dateCompare;
        }
        
        case 'date_desc': {
          const dateCompare = b.date.localeCompare(a.date);
          return dateCompare === 0 ? b.time.localeCompare(a.time) : dateCompare;
        }
        
        default:
          return 0;
      }
    });

    return filtered;
  };

  /**
   * Crear una nueva cita
   * @param {Object} formData - Datos del formulario
   */
  const handleCreateAppointment = async (formData) => {
    try {
      setIsSubmitting(true);
      
      // Llamar al API para crear la cita
      await appointmentsAPI.create(formData);
      
      // Cerrar modal
      setIsModalOpen(false);
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: '¡Cita creada exitosamente! 🎉'
      });
      
      // Recargar lista de citas
      await loadAppointments();
      
    } catch (err) {
      console.error('Error creating appointment:', err);
      
      // Mostrar notificación de error
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Error al crear la cita. Por favor intenta de nuevo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Confirmar una cita (cambiar estado de pending a confirmed)
   * @param {number} appointmentId - ID de la cita
   */
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      setProcessingId(appointmentId);
      
      // Llamar al API para confirmar la cita
      await appointmentsAPI.confirm(appointmentId);
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: '✅ Cita confirmada exitosamente'
      });
      
      // Recargar lista de citas
      await loadAppointments();
      
    } catch (err) {
      console.error('Error confirming appointment:', err);
      setNotification({
        type: 'error',
        message: 'Error al confirmar la cita'
      });
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Completar una cita (cambiar estado de confirmed a completed)
   * @param {number} appointmentId - ID de la cita
   */
  const handleCompleteAppointment = async (appointmentId) => {
    try {
      setProcessingId(appointmentId);
      
      // Llamar al API para completar la cita
      await appointmentsAPI.complete(appointmentId);
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: '✅ Cita completada exitosamente'
      });
      
      // Recargar lista de citas
      await loadAppointments();
      
    } catch (err) {
      console.error('Error completing appointment:', err);
      setNotification({
        type: 'error',
        message: 'Error al completar la cita'
      });
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Abrir diálogo de confirmación para cancelar cita
   * @param {number} appointmentId - ID de la cita a cancelar
   */
  const handleOpenCancelDialog = (appointmentId) => {
    setConfirmDialog({
      isOpen: true,
      appointmentId,
      isLoading: false
    });
  };

  /**
   * Cancelar una cita (con razón)
   * @param {string} reason - Razón de cancelación
   */
  const handleCancelAppointment = async (reason) => {
    try {
      setConfirmDialog(prev => ({ ...prev, isLoading: true }));
      
      // Llamar al API para cancelar la cita
      await appointmentsAPI.cancel(confirmDialog.appointmentId, reason);
      
      // Cerrar diálogo
      setConfirmDialog({ isOpen: false, appointmentId: null, isLoading: false });
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: '❌ Cita cancelada exitosamente'
      });
      
      // Recargar lista de citas
      await loadAppointments();
      
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setNotification({
        type: 'error',
        message: 'Error al cancelar la cita'
      });
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Marcar una cita como "No asistió"
   * @param {number} appointmentId - ID de la cita
   */
  const handleNoShowAppointment = async (appointmentId) => {
    try {
      setProcessingId(appointmentId);
      
      // Llamar al API para marcar no show
      await appointmentsAPI.noShow(appointmentId);
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: '⚠️ Cita marcada como "No asistió"'
      });
      
      // Recargar lista de citas
      await loadAppointments();
      
    } catch (err) {
      console.error('Error marking no show:', err);
      setNotification({
        type: 'error',
        message: 'Error al marcar la cita'
      });
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Abrir modal de edición con datos de la cita
   * @param {Object} appointment - Datos de la cita a editar
   */
  const handleEditAppointment = (appointment) => {
    setEditModal({
      isOpen: true,
      appointment: appointment,
      isLoading: false
    });
  };

  /**
   * Actualizar una cita existente
   * @param {Object} formData - Datos actualizados del formulario
   */
  const handleUpdateAppointment = async (formData) => {
    try {
      setEditModal(prev => ({ ...prev, isLoading: true }));
      
      // Llamar al API para actualizar la cita
      await appointmentsAPI.update(editModal.appointment.id, formData);
      
      // Cerrar modal
      setEditModal({ isOpen: false, appointment: null, isLoading: false });
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: '✏️ Cita actualizada exitosamente'
      });
      
      // Recargar lista de citas
      await loadAppointments();
      
    } catch (err) {
      console.error('Error updating appointment:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Error al actualizar la cita'
      });
      setEditModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Abrir diálogo de confirmación para eliminar cita
   * @param {number} appointmentId - ID de la cita a eliminar
   */
  const handleOpenDeleteDialog = (appointmentId) => {
    setDeleteDialog({
      isOpen: true,
      appointmentId,
      isLoading: false
    });
  };

  /**
   * Eliminar una cita permanentemente
   */
  const handleDeleteAppointment = async () => {
    try {
      setDeleteDialog(prev => ({ ...prev, isLoading: true }));
      
      // Llamar al API para eliminar la cita
      await appointmentsAPI.delete(deleteDialog.appointmentId);
      
      // Cerrar diálogo
      setDeleteDialog({ isOpen: false, appointmentId: null, isLoading: false });
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: '🗑️ Cita eliminada exitosamente'
      });
      
      // Recargar lista de citas
      await loadAppointments();
      
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setNotification({
        type: 'error',
        message: 'Error al eliminar la cita'
      });
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Obtener clases de color según el estado de la cita
   * @param {string} status - Estado de la cita (pending, confirmed, completed, cancelled, no_show)
   * @returns {string} - Clases de Tailwind CSS
   */
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-secondary/10 text-secondary border-secondary/30 border-2',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // =========================================================================
  // RENDER: Estados de carga y error
  // =========================================================================
  
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-4"></div>
        <p className="text-xl text-gray-600">Cargando citas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <button
          onClick={loadAppointments}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Página principal
  // =========================================================================
  
  // Aplicar filtros antes de renderizar
  const filteredAppointments = applyFilters();

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* ===================================================================
          HEADER CON TÍTULO Y BOTÓN NUEVA CITA
          =================================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Citas Agendadas
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredAppointments.length} de {appointments.length} {filteredAppointments.length === 1 ? 'cita' : 'citas'}
          </p>
        </div>
        
        {/* Botón Nueva Cita */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Cita
        </button>
      </div>

      {/* ===================================================================
          NOTIFICACIONES
          =================================================================== */}
      {notification && (
        <div
          className={`
            mb-6 p-4 rounded-lg flex items-center justify-between animate-fade-in-up
            ${notification.type === 'success' ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}
          `}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 mr-3" />
            )}
            <p className={`font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ===================================================================
          FILTROS Y BÚSQUEDA
          =================================================================== */}
      <AppointmentsFilters onFilterChange={handleFilterChange} />

      {/* ===================================================================
          LISTA DE CITAS
          =================================================================== */}
      {filteredAppointments.length === 0 ? (
        // Estado vacío cuando no hay citas o no hay resultados de filtros
        <div className="text-center py-16">
          <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          {appointments.length === 0 ? (
            // No hay citas en absoluto
            <>
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                No hay citas registradas
              </h3>
              <p className="text-gray-500 mb-6">
                Comienza creando tu primera cita usando el botón de arriba
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Primera Cita
              </button>
            </>
          ) : (
            // Hay citas pero no coinciden con los filtros
            <>
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                No se encontraron citas
              </h3>
              <p className="text-gray-500 mb-6">
                Intenta ajustar los filtros de búsqueda
              </p>
            </>
          )}
        </div>
      ) : (
        // Grid de tarjetas de citas
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAppointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              {/* Estado de la cita */}
              <div className="mb-4">
                <span className={`
                  px-4 py-1.5 rounded-full text-sm font-semibold border-2
                  ${getStatusColor(appointment.status)}
                `}>
                  {appointment.status_display}
                </span>
              </div>

              {/* Información del cliente */}
              <div className="mb-3 flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg mr-3">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-semibold text-gray-800">{appointment.client_name}</p>
                </div>
              </div>

              {/* Teléfono */}
              <div className="mb-3 flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-sm">{appointment.client_phone}</span>
              </div>

              {/* Servicio */}
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600 font-medium mb-1">
                  {appointment.service_name}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {appointment.service_duration} min
                  </span>
                  <span className="text-lg font-bold text-purple-700">
                    ${appointment.service_price?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium">{appointment.appointment_date}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium">{appointment.appointment_time}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <AppointmentActions
                appointment={appointment}
                onConfirm={handleConfirmAppointment}
                onCancel={handleOpenCancelDialog}
                onComplete={handleCompleteAppointment}
                onNoShow={handleNoShowAppointment}
                onEdit={handleEditAppointment}
                onDelete={handleOpenDeleteDialog}
                isLoading={processingId === appointment.id}
              />
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================
          MODAL DE CREACIÓN DE CITA
          =================================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Cita"
      >
        <AppointmentForm
          onSubmit={handleCreateAppointment}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* ===================================================================
          DIÁLOGO DE CONFIRMACIÓN PARA CANCELAR CITA
          =================================================================== */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, appointmentId: null, isLoading: false })}
        onConfirm={handleCancelAppointment}
        title="¿Cancelar cita?"
        message="Esta acción cambiará el estado de la cita a cancelada. Por favor ingresa la razón de la cancelación."
        confirmText="Sí, cancelar cita"
        cancelText="No, mantener cita"
        variant="danger"
        requireReason={true}
        isLoading={confirmDialog.isLoading}
      />

      {/* ===================================================================
          MODAL DE EDICIÓN DE CITA
          =================================================================== */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, appointment: null, isLoading: false })}
        title="Editar Cita"
      >
        <AppointmentForm
          onSubmit={handleUpdateAppointment}
          onCancel={() => setEditModal({ isOpen: false, appointment: null, isLoading: false })}
          initialData={editModal.appointment}
          isLoading={editModal.isLoading}
        />
      </Modal>

      {/* ===================================================================
          DIÁLOGO DE CONFIRMACIÓN PARA ELIMINAR CITA
          =================================================================== */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, appointmentId: null, isLoading: false })}
        onConfirm={handleDeleteAppointment}
        title="¿Eliminar cita?"
        message="Esta acción eliminará permanentemente la cita. Esta acción no se puede deshacer."
        confirmText="Sí, eliminar permanentemente"
        cancelText="No, mantener cita"
        variant="danger"
        requireReason={false}
        isLoading={deleteDialog.isLoading}
      />
    </div>
  );
}

export default AppointmentsList;
