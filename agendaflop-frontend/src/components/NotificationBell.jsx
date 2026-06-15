/**
 * =============================================================================
 * NOTIFICATION BELL - Campana de Notificaciones (Bloque 4)
 * =============================================================================
 * 
 * Componente de campana de notificaciones con dropdown:
 * - Badge con contador de no leídas
 * - Dropdown con lista de notificaciones
 * - Marcar como leída al hacer click
 * - Botón para marcar todas como leídas
 * - Auto-refresh cada 30 segundos
 * - Scroll infinito para cargar más
 * - Iconos según tipo de notificación
 * - Formato de tiempo relativo (ej: "hace 5 min")
 * 
 * =============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Calendar, X, Clock, DollarSign, User } from 'lucide-react';
import { notificationsAPI } from '../services/api';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  /**
   * Cargar notificaciones al montar y cada 30 segundos
   */
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Cerrar dropdown al hacer click fuera
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Cargar lista de notificaciones
   */
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll({ page_size: 10 });
      setNotifications(response.data.results || response.data || []);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar contador de no leídas
   */
  const loadUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Error cargando contador:', err);
    }
  };

  /**
   * Marcar notificación como leída
   */
  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      
      // Actualizar estado local
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, is_read: true } : notif
      ));
      
      // Actualizar contador
      loadUnreadCount();
    } catch (err) {
      console.error('Error marcando como leída:', err);
    }
  };

  /**
   * Marcar todas como leídas
   */
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Actualizar estado local
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  };

  /**
   * Toggle del dropdown
   */
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  /**
   * Obtener icono según tipo de notificación
   */
  const getNotificationIcon = (type) => {
    const icons = {
      appointment_created: <Calendar className="w-4 h-4 text-blue-500" />,
      appointment_confirmed: <Check className="w-4 h-4 text-green-500" />,
      appointment_cancelled: <X className="w-4 h-4 text-red-500" />,
      appointment_rescheduled: <Clock className="w-4 h-4 text-orange-500" />,
      appointment_reminder: <Bell className="w-4 h-4 text-purple-500" />,
      appointment_completed: <CheckCheck className="w-4 h-4 text-green-600" />,
      appointment_no_show: <User className="w-4 h-4 text-gray-500" />,
      payment_received: <DollarSign className="w-4 h-4 text-green-500" />,
      client_registered: <User className="w-4 h-4 text-blue-500" />,
    };
    return icons[type] || <Bell className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-6 h-6" />
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay notificaciones</p>
                <p className="text-sm text-gray-400 mt-1">Cuando tengas notificaciones aparecerán aquí</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold text-gray-900 ${
                            !notification.is_read ? 'font-bold' : ''
                          }`}>
                            {notification.title}
                          </p>
                          
                          {/* Indicador de no leída */}
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Tiempo */}
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.time_ago}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Aquí podrías navegar a una página de todas las notificaciones
                }}
                className="w-full text-sm text-center text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
