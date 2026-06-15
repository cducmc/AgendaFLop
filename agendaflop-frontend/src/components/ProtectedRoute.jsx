/**
 * =============================================================================
 * PROTECTED ROUTE - Componente para Proteger Rutas
 * =============================================================================
 * 
 * Redirige a /login si el usuario no está autenticado
 * Muestra spinner mientras carga el estado de autenticación
 * Permite restringir por roles específicos
 * =============================================================================
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role)) {
      // Redirigir según el rol del usuario
      if (user.role === 'super_admin') {
        return <Navigate to="/platform" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
