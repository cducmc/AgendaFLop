/**
 * =============================================================================
 * AUTH SERVICE - Servicios de Autenticación
 * =============================================================================
 * 
 * Funciones para:
 * - Login
 * - Register (crear negocio + usuario)
 * - Logout
 * - Refresh token
 * - Obtener usuario actual
 * - Cambiar contraseña
 * =============================================================================
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Registrar nuevo negocio y usuario
 */
export const register = async (userData, isFormData = false) => {
  const config = isFormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  } : {};
  
  const { data } = await axios.post(`${API_BASE_URL}/auth/register/`, userData, config);
  
  // Guardar tokens y usuario en localStorage
  if (data.access) {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('business', JSON.stringify(data.business));
  }
  
  return data;
};

/**
 * Login
 */
export const login = async (email, password) => {
  const { data } = await axios.post(`${API_BASE_URL}/auth/login/`, {
    email,
    password,
  });
  
  // Guardar tokens en localStorage
  if (data.access) {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
  }
  
  return data;
};

/**
 * Logout
 */
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      await axios.post(`${API_BASE_URL}/auth/logout/`, {
        refresh: refreshToken,
      });
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Limpiar localStorage siempre
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('business');
  }
};

/**
 * Obtener información del usuario actual
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return null;
  }
  
  try {
    const { data } = await axios.get(`${API_BASE_URL}/auth/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Actualizar localStorage
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('business', JSON.stringify(data.business));
    
    return data;
  } catch (error) {
    // Si falla, limpiar tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('business');
    return null;
  }
};

/**
 * Refrescar access token
 */
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
    refresh: refreshToken,
  });
  
  localStorage.setItem('access_token', data.access);
  
  return data.access;
};

/**
 * Cambiar contraseña
 */
export const changePassword = async (oldPassword, newPassword) => {
  const token = localStorage.getItem('access_token');
  
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/change-password/`,
    {
      old_password: oldPassword,
      new_password: newPassword,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  return data;
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  return !!token;
};

/**
 * Obtener usuario del localStorage
 */
export const getUserFromStorage = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Obtener negocio del localStorage
 */
export const getBusinessFromStorage = () => {
  const business = localStorage.getItem('business');
  return business ? JSON.parse(business) : null;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshAccessToken,
  changePassword,
  isAuthenticated,
  getUserFromStorage,
  getBusinessFromStorage,
};

export default authService;
