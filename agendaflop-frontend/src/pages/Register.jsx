/**
 * =============================================================================
 * REGISTER PAGE - Página de Registro
 * =============================================================================
 * 
 * Formulario de registro multi-step para crear:
 * - Usuario (email, contraseña, nombre)
 * - Negocio (nombre, tipo, teléfono)
 * 
 * Automáticamente te coloca en plan FREE con 30 días de pruena
 * =============================================================================
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mail, Lock, User, Building2, Phone, AlertCircle, CheckCircle, Sparkles, Palette, Upload, X, Image as ImageIcon
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'salon', label: '💇 Salón de Belleza' },
  { value: 'barber', label: '✂️ Barbería' },
  { value: 'spa', label: '🧖 Spa' },
  { value: 'clinic', label: '🏥 Clínica / Consultorio' },
  { value: 'gym', label: '💪 Gimnasio' },
  { value: 'consulting', label: '💼 Consultoría' },
  { value: 'other', label: '⚙️ Otro' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    // Usuario
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    // Negocio
    business_name: '',
    business_type: 'salon',
    business_phone: '', // Cambiado de 'phone' a 'business_phone' para ser más claro
    // Personalización
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Datos personales, 2: Datos del negocio, 3: Personalización
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    }
    
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Las contraseñas no coinciden';
    }
    
    if (!formData.first_name) {
      newErrors.first_name = 'El nombre es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.business_name) {
      newErrors.business_name = 'El nombre del negocio es requerido';
    }
    
    if (!formData.business_phone) {
      newErrors.business_phone = 'El teléfono es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors({ logo: 'Por favor selecciona una imagen válida' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ logo: 'La imagen debe ser menor a 5MB' });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setErrors({});

    try {
      // Si hay logo, usar FormData
      if (logoFile) {
        const formDataToSend = new FormData();
        
        // Datos del usuario
        formDataToSend.append('email', formData.email);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('password2', formData.password);
        formDataToSend.append('first_name', formData.first_name);
        formDataToSend.append('last_name', formData.last_name || '');
        
        // Datos del negocio
        formDataToSend.append('business_name', formData.business_name);
        formDataToSend.append('business_type', formData.business_type);
        formDataToSend.append('business_phone', formData.business_phone);
        
        // Personalización
        formDataToSend.append('primary_color', formData.primary_color);
        formDataToSend.append('secondary_color', formData.secondary_color);
        formDataToSend.append('logo', logoFile);
        
        await register(formDataToSend, true);
      } else {
        // Sin logo, enviar JSON
        const dataToSend = {
          email: formData.email,
          password: formData.password,
          password2: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name || '',
          business_name: formData.business_name,
          business_type: formData.business_type,
          business_phone: formData.business_phone,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
        };
        await register(dataToSend);
      }
      navigate('/');
    } catch (err) {
      console.error('Register error:', err);
      console.error('Error response:', err.response?.data);
      
      const backendErrors = err.response?.data || {};
      const newErrors = {};
      
      // Mapear errores del backend
      Object.keys(backendErrors).forEach(key => {
        if (Array.isArray(backendErrors[key])) {
          newErrors[key] = backendErrors[key][0];
        } else {
          newErrors[key] = backendErrors[key];
        }
      });
      
      // Si hay un error general, mostrarlo
      if (Object.keys(newErrors).length === 0) {
        newErrors.non_field_errors = 'Error al crear la cuenta. Por favor intenta de nuevo.';
      }
      
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Crear Cuenta</h1>
            <p className="text-gray-600 mt-2">Comienza tu prueba gratuita de 30 días</p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <div className={`w-16 h-1 mx-2 ${
                step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <div className={`w-16 h-1 mx-2 ${
                step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Error general */}
          {errors.non_field_errors && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-800">{errors.non_field_errors}</p>
            </div>
          )}

          {/* STEP 1: Datos Personales */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                👤 Tus datos personales
              </h3>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="tu@email.com"
                    autoFocus
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                        errors.first_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Juan"
                    />
                  </div>
                  {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                      errors.password_confirm ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Repite tu contraseña"
                  />
                </div>
                {errors.password_confirm && <p className="mt-1 text-sm text-red-600">{errors.password_confirm}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
              >
                Continuar →
              </button>
            </form>
          )}

          {/* STEP 2: Datos del Negocio */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                🏢 Datos de tu negocio
              </h3>

              {/* Nombre del negocio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del negocio
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                      errors.business_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Salón de Belleza María"
                    autoFocus
                  />
                </div>
                {errors.business_name && <p className="mt-1 text-sm text-red-600">{errors.business_name}</p>}
              </div>

              {/* Tipo de negocio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de negocio
                </label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  {BUSINESS_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono del negocio
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="business_phone"
                    value={formData.business_phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                      errors.business_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                {errors.business_phone && <p className="mt-1 text-sm text-red-600">{errors.business_phone}</p>}
              </div>

              {/* Info */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-800">
                  ✨ <strong>Plan FREE</strong> incluido:
                </p>
                <ul className="mt-2 text-sm text-indigo-700 space-y-1">
                  <li>• Hasta 50 citas al mes</li>
                  <li>• 1 usuario</li>
                  <li>• Portal de reservas público</li>
                  <li>• Sin tarjeta de crédito requerida</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  ← Atrás
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Continuar →
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Personalización */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                🎨 Personaliza tu negocio
              </h3>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo (opcional)
                </label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
                      <Upload className="w-4 h-4" />
                      {logoPreview ? 'Cambiar' : 'Subir Logo'}
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
                        className="ml-2 inline-flex items-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm"
                      >
                        <X className="w-4 h-4" /> Quitar
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-2">PNG o JPG, máx 5MB</p>
                  </div>
                </div>
                {errors.logo && <p className="mt-1 text-sm text-red-600">{errors.logo}</p>}
              </div>

              {/* Colores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Palette className="inline w-4 h-4 mr-1" />
                  Colores de tu marca
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Color Primario</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="primary_color"
                        value={formData.primary_color}
                        onChange={handleChange}
                        className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300"
                      />
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Color Secundario</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="secondary_color"
                        value={formData.secondary_color}
                        onChange={handleChange}
                        className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300"
                      />
                      <input
                        type="text"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        placeholder="#8b5cf6"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg flex gap-2">
                  <div 
                    className="flex-1 h-12 rounded flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    Primario
                  </div>
                  <div 
                    className="flex-1 h-12 rounded flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                    style={{ backgroundColor: formData.secondary_color }}
                  >
                    Secundario
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-xs text-indigo-700">
                  💡 <strong>Tip:</strong> Puedes cambiar estos colores más adelante desde Ajustes.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition disabled:opacity-50"
                >
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta ✨'}
                </button>
              </div>
            </form>
          )}

          {/* Link a login */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">¿Ya tienes cuenta? </span>
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
