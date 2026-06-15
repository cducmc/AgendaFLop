/**
 * =============================================================================
 * AUTH CONTEXT - Contexto Global de Autenticación
 * =============================================================================
 * 
 * Maneja el estado de autenticación en toda la aplicación:
 * - Usuario actual
 * - Negocio actual
 * - Tokens JWT
 * - Funciones login/logout/register
 * - Tema dinámico del negocio
 * =============================================================================
 */

import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { applyBusinessTheme, resetToDefaultTheme } from '../utils/themeManager';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar usuario al montar el componente
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay token
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      // Obtener usuario del backend
      const data = await authService.getCurrentUser();
      
      if (data) {
        setUser(data.user);
        setBusiness(data.business);
        setIsAuthenticated(true);
        
        // Aplicar tema del negocio si tiene colores configurados
        if (data.business?.primary_color && data.business?.secondary_color) {
          console.log('🎨 Aplicando colores del negocio:', {
            primary: data.business.primary_color,
            secondary: data.business.secondary_color,
            businessName: data.business.name
          });
          applyBusinessTheme(data.business.primary_color, data.business.secondary_color);
        } else {
          console.warn('⚠️ No se encontraron colores del negocio:', data.business);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
      setBusiness(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      
      // Después del login, cargar datos completos del usuario
      await loadUser();
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData, isFormData = false) => {
    try {
      const data = await authService.register(userData, isFormData);
      
      setUser(data.user);
      setBusiness(data.business);
      setIsAuthenticated(true);
      
      // Aplicar tema del negocio si tiene colores configurados
      if (data.business?.primary_color && data.business?.secondary_color) {
        applyBusinessTheme(data.business.primary_color, data.business.secondary_color);
      }
      
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setBusiness(null);
      setIsAuthenticated(false);
      // Resetear tema a colores por defecto
      resetToDefaultTheme();
    }
  };

  const updateUser = async () => {
    await loadUser();
  };

  const value = {
    user,
    business,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
