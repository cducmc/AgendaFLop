/**
 * =============================================================================
 * APPOINTMENT ACTIONS - Componente de Acciones de Citas
 * =============================================================================
 * 
 * Componente que muestra los botones de acción según el estado de la cita:
 * - Pendiente: Confirmar, Cancelar
 * - Confirmada: Completar, Cancelar, Marcar No Asistió
 * - Completada/Cancelada/No Asistió: Editar y Eliminar
 * 
 * Props:
 * - appointment: Object - Objeto de la cita
 * - onConfirm: Function - Callback al confirmar
 * - onCancel: Function - Callback al cancelar
 * - onComplete: Function - Callback al completar
 * - onNoShow: Function - Callback al marcar no asistió
 * - onEdit: Function - Callback al editar
 * - onDelete: Function - Callback al eliminar
 * - isLoading: Boolean - Estado de carga
 * 
 * =============================================================================
 */

import { CheckCircle, XCircle, Check, UserX, Edit2, Trash2 } from 'lucide-react';

function AppointmentActions({ 
  appointment, 
  onConfirm, 
  onCancel, 
  onComplete, 
  onNoShow,
  onEdit,
  onDelete,
  isLoading = false 
}) {
  
  // Determinar qué acciones mostrar según el estado
  const canConfirm = appointment.status === 'pending';
  const canComplete = appointment.status === 'confirmed';
  const canCancel = ['pending', 'confirmed'].includes(appointment.status);
  const canNoShow = appointment.status === 'confirmed';
  const isFinalized = ['completed', 'cancelled', 'no_show'].includes(appointment.status);

  /**
   * Componente de botón de acción reutilizable
   */
  const ActionButton = ({ onClick, icon: Icon, label, variant = 'primary', disabled }) => {
    // Definir estilos según la variante
    const variantStyles = {
      success: 'bg-green-500 hover:bg-green-600 text-white',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
      warning: 'bg-orange-500 hover:bg-orange-600 text-white',
      secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
      primary: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`
          flex items-center justify-center px-3 py-2 rounded-lg 
          font-medium text-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-sm hover:shadow-md
          ${variantStyles[variant]}
        `}
        title={label}
      >
        <Icon className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      {/* Citas finalizadas - Editar y Eliminar */}
      {isFinalized ? (
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            onClick={() => onEdit(appointment)}
            icon={Edit2}
            label="Editar"
            variant="secondary"
          />
          <ActionButton
            onClick={() => onDelete(appointment.id)}
            icon={Trash2}
            label="Eliminar"
            variant="danger"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Citas activas - Múltiples acciones */}
          
          {/* Confirmar - Solo si está pendiente */}
          {canConfirm && (
            <ActionButton
              onClick={() => onConfirm(appointment.id)}
              icon={CheckCircle}
              label="Confirmar"
              variant="success"
            />
          )}

          {/* Completar - Solo si está confirmada */}
          {canComplete && (
            <ActionButton
              onClick={() => onComplete(appointment.id)}
              icon={Check}
              label="Completar"
              variant="success"
            />
          )}

          {/* Cancelar - Si está pendiente o confirmada */}
          {canCancel && (
            <ActionButton
              onClick={() => onCancel(appointment.id)}
              icon={XCircle}
              label="Cancelar"
              variant="danger"
            />
          )}

          {/* No Asistió - Solo si está confirmada */}
          {canNoShow && (
            <ActionButton
              onClick={() => onNoShow(appointment.id)}
              icon={UserX}
              label="No Asistió"
              variant="warning"
            />
          )}

          {/* Editar - Siempre disponible para citas no finalizadas */}
          <ActionButton
            onClick={() => onEdit(appointment)}
            icon={Edit2}
            label="Editar"
            variant="secondary"
          />
        </div>
      )}
    </div>
  );
}

export default AppointmentActions;
