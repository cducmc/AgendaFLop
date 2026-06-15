/**
 * =============================================================================
 * SETTINGS PAGE - Configuración del Negocio
 * =============================================================================
 * 
 * Permite al dueño del negocio personalizar:
 * - Información básica (nombre, descripción, contacto)
 * - Colores del tema (branding)
 * - Redes sociales
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessAPI } from '../services/api';
import { Save, Palette, Building2, Mail, Phone, MapPin, Globe, Upload, X, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { applyBusinessTheme } from '../utils/themeManager';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    postal_code: '',
    website: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
  });

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      
      // Validar que el usuario tenga negocio
      if (user?.role === 'super_admin' || !user?.business) {
        console.warn('Usuario sin negocio asignado, redirigiendo...');
        navigate('/');
        return;
      }
      
      const response = await businessAPI.getMy();
      // Llenar el formulario con los datos actuales
      const business = response.data;
      setFormData({
        name: business.name || '',
        description: business.description || '',
        email: business.email || '',
        phone: business.phone || '',
        whatsapp: business.whatsapp || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        country: business.country || 'México',
        postal_code: business.postal_code || '',
        website: business.website || '',
        instagram: business.instagram || '',
        facebook: business.facebook || '',
        tiktok: business.tiktok || '',
        primary_color: business.primary_color || '#6366f1',
        secondary_color: business.secondary_color || '#8b5cf6',
      });
      setCurrentLogo(business.logo);
    } catch (error) {
      console.error('Error al cargar negocio:', error);
      setMessage({ type: 'error', text: 'Error al cargar la información' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor selecciona una imagen válida' });
        return;
      }
      
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'La imagen debe ser menor a 5MB' });
        return;
      }
      
      setLogoFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      // Filtrar y preparar los datos para enviar
      const prepareDataForSend = (data, excludeLogo = false) => {
        const result = {};
        
        Object.keys(data).forEach(key => {
          const value = data[key];
          
          // Omitir el logo si no se está subiendo uno nuevo
          if (excludeLogo && key === 'logo') {
            return;
          }
          
          // Omitir valores null, undefined o strings vacíos
          if (value === null || value === undefined || value === '') {
            return;
          }
          
          // Para campos URL (website), asegurarse de que sean URLs válidas
          if (key === 'website') {
            // Si no tiene esquema, agregarlo
            if (!value.startsWith('http://') && !value.startsWith('https://')) {
              result[key] = 'https://' + value;
            } else {
              result[key] = value;
            }
          } else {
            result[key] = value;
          }
        });
        
        return result;
      };
      
      // Usar FormData si hay logo, de lo contrario enviar JSON
      if (logoFile) {
        const formDataToSend = new FormData();
        
        // Agregar todos los campos del formulario (excluir logo del formData original)
        const preparedData = prepareDataForSend(formData, true);
        
        Object.keys(preparedData).forEach(key => {
          formDataToSend.append(key, preparedData[key]);
        });
        
        // Agregar el logo nuevo
        formDataToSend.append('logo', logoFile);
        
        await businessAPI.update(formDataToSend, true); // true indica que es FormData
      } else {
        // Filtrar campos vacíos para envío JSON (EXCLUIR logo)
        const dataToSend = prepareDataForSend(formData, true);
        
        await businessAPI.update(dataToSend);
      }
      
      // Aplicar tema actualizado
      applyBusinessTheme(formData.primary_color, formData.secondary_color);
      
      // Recargar usuario para actualizar el header con el nuevo logo
      await updateUser();
      
      setMessage({ type: 'success', text: '✅ Cambios guardados correctamente' });
      
      // Recargar los datos del negocio
      await fetchBusiness();
      
      // Limpiar preview de logo
      clearLogo();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error al guardar:', error);
      
      // Mostrar errores específicos del backend si existen
      let errorMessage = 'Error al guardar los cambios';
      
      if (error.response?.data) {
        const backendErrors = error.response.data;
        
        // Si hay errores específicos de campos
        if (typeof backendErrors === 'object' && !backendErrors.detail) {
          const errorMessages = Object.entries(backendErrors).map(
            ([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          );
          errorMessage = errorMessages.join(' | ');
        } else if (backendErrors.detail) {
          errorMessage = backendErrors.detail;
        } else if (typeof backendErrors === 'string') {
          errorMessage = backendErrors;
        }
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-8 h-8 text-primary" />
          Configuración del Negocio
        </h1>
        <p className="text-gray-600 mt-2">
          Personaliza la información y apariencia de tu negocio
        </p>
      </div>

      {/* Mensaje de éxito/error */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Logo del Negocio */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Logo del Negocio
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Preview del logo actual o nuevo */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                ) : currentLogo ? (
                  <img src={`http://127.0.0.1:8000${currentLogo}`} alt="Logo actual" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-500 text-center">
                {logoPreview ? 'Nuevo logo' : currentLogo ? 'Logo actual' : 'Sin logo'}
              </p>
            </div>
            
            {/* Upload controls */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subir Logo
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Personaliza tu negocio con un logo. Formatos: JPG, PNG. Máximo 5MB.
              </p>
              
              <div className="flex gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-5 h-5" />
                  {logoPreview ? 'Cambiar Logo' : 'Seleccionar Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                
                {logoPreview && (
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Cancelar
                  </button>
                )}
              </div>
              
              {logoPreview && (
                <p className="text-sm text-green-600 mt-3">
                  ✓ Logo seleccionado. Haz clic en "Guardar Cambios" para aplicar.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Información Básica */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Información Básica
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: Salón Elegance"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Breve descripción de tu negocio..."
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Información de Contacto
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="contacto@negocio.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="+52 55 1234 5678"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+52 55 1234 5678"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio Web
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://www.tunegocio.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Ubicación
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Calle y número"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ciudad"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Estado"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="País"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código Postal
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="12345"
              />
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Redes Sociales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="@tunegocio"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook
              </label>
              <input
                type="text"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="TuNegocio"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TikTok
              </label>
              <input
                type="text"
                name="tiktok"
                value={formData.tiktok}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="@tunegocio"
              />
            </div>
          </div>
        </div>

        {/* Colores del Tema */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Colores del Tema
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Primario
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primary_color"
                  value={formData.primary_color}
                  onChange={handleChange}
                  className="w-16 h-16 rounded cursor-pointer border-2 border-gray-300"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  placeholder="#6366f1"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Color principal de tu marca
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Secundario
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="secondary_color"
                  value={formData.secondary_color}
                  onChange={handleChange}
                  className="w-16 h-16 rounded cursor-pointer border-2 border-gray-300"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  placeholder="#8b5cf6"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Color complementario
              </p>
            </div>
          </div>

          {/* Preview de colores */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Vista previa:</p>
            <div className="flex gap-4">
              <div 
                className="flex-1 h-20 rounded-lg shadow-sm flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: formData.primary_color }}
              >
                Primario
              </div>
              <div 
                className="flex-1 h-20 rounded-lg shadow-sm flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: formData.secondary_color }}
              >
                Secundario
              </div>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
