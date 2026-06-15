/**
 * =============================================================================
 * PROFESSIONALS/BUSINESSES PAGE - Vista Inteligente
 * =============================================================================
 * 
 * Vista dinámica que cambia según el rol:
 * - ADMIN (is_staff): Muestra "Negocios" con todos los negocios de la plataforma
 * - USUARIOS NORMALES: Muestra "Profesionales" con gestión de su equipo
 * 
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { professionalsAPI, servicesAPI, businessAPI } from '../services/api';
import { Plus, Edit, Trash2, User, Briefcase, Phone, Mail, Search, CheckCircle, Building2, Users, Crown, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Professionals = () => {
  const { user } = useAuth();
  const isAdmin = user?.is_staff || false;
  
  // Estado para profesionales (usuarios normales)
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  
  // Estado para negocios (admin)
  const [businesses, setBusinesses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    // Usuario
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    // Profesional
    specialty: '',
    services: [],
    is_active: true,
    accepts_online_bookings: true,
  });

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // Admin: cargar todos los negocios
        const businessesResponse = await businessAPI.getAll();
        const businessesData = Array.isArray(businessesResponse.data) ? businessesResponse.data : [];
        setBusinesses(businessesData);
      } else {
        // Usuario normal: cargar profesionales y servicios de su negocio
        const [profsResponse, servicesResponse] = await Promise.all([
          professionalsAPI.getAll(),
          servicesAPI.getAll()
        ]);
        
        const profsData = Array.isArray(profsResponse.data) ? profsResponse.data : profsResponse.data.results || [];
        const servicesData = Array.isArray(servicesResponse.data) ? servicesResponse.data : servicesResponse.data.results || [];
        
        setProfessionals(profsData);
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (professional = null) => {
    if (professional) {
      setEditingProfessional(professional);
      setFormData({
        email: professional.user?.email || '',
        password: '',
        first_name: professional.user?.first_name || '',
        last_name: professional.user?.last_name || '',
        phone: professional.user?.phone || '',
        specialty: professional.specialty || professional.specialties || '',  // Usar specialty o specialties
        services: professional.services?.map(s => s.id) || [],
        is_active: professional.is_active,
        accepts_online_bookings: professional.accepts_online_bookings,
      });
    } else {
      setEditingProfessional(null);
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        specialty: '',
        services: [],
        is_active: true,
        accepts_online_bookings: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProfessional(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Preparar datos según sea creación o edición
      const dataToSend = editingProfessional 
        ? {
            // Al editar, solo enviamos datos del profesional
            specialty: formData.specialty,
            services_ids: formData.services,
            is_active: formData.is_active,
            accepts_online_bookings: formData.accepts_online_bookings,
          }
        : {
            // Al crear, enviamos datos del usuario como campos planos
            user_email: formData.email,
            user_password: formData.password,
            user_first_name: formData.first_name,
            user_last_name: formData.last_name,
            user_phone: formData.phone,
            // Datos del profesional
            specialty: formData.specialty,
            services_ids: formData.services,
            is_active: formData.is_active,
            accepts_online_bookings: formData.accepts_online_bookings,
          };

      console.log('📤 Enviando datos:', dataToSend);

      if (editingProfessional) {
        await professionalsAPI.update(editingProfessional.id, dataToSend);
      } else {
        await professionalsAPI.create(dataToSend);
      }
      
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Response status:', error.response?.status);
      console.error('❌ Response text completo:', JSON.stringify(error.response?.data, null, 2));
      
      // Intentar extraer mensaje de error más descriptivo
      let errorMsg = 'Error al guardar el profesional';
      if (error.response?.data) {
        // Si hay errores de validación específicos, mostrarlos
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMsg = Object.entries(errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n');
        } else if (typeof errors === 'string') {
          errorMsg = errors;
        }
      }
      alert(`Error al guardar:\n\n${errorMsg}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este profesional?')) return;
    
    try {
      await professionalsAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting professional:', error);
      alert('Error al eliminar el profesional');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // VISTA PARA ADMIN: Muestra todos los negocios
  if (isAdmin) {
    const filteredBusinesses = Array.isArray(businesses)
      ? businesses.filter(business =>
          business.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];

    const getPlanBadge = (planDetails) => {
      const planStyles = {
        free: 'bg-gray-100 text-gray-800',
        basic: 'bg-blue-100 text-blue-800',
        pro: 'bg-purple-100 text-purple-800',
        premium: 'bg-yellow-100 text-yellow-800'
      };
      
      const planType = planDetails?.plan_type || 'free';
      
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${planStyles[planType]}`}>
          {planType === 'premium' && <Crown className="w-3 h-3" />}
          {planDetails?.name || 'Free'}
        </span>
      );
    };

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              Negocios Registrados
            </h1>
            <p className="text-gray-600 mt-2">
              Vista general de todos los emprendimientos en la plataforma
            </p>
          </div>
          
          {/* Stats */}
          <div className="text-right">
            <p className="text-4xl font-bold text-primary">{businesses.length}</p>
            <p className="text-sm text-gray-600">Total de negocios</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Businesses Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No se encontraron negocios' : 'No hay negocios registrados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              >
                {/* Header con logo y plan */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    {/* Logo */}
                    {business.logo ? (
                      <img
                        src={`http://127.0.0.1:8000${business.logo}`}
                        alt={business.name}
                        className="w-16 h-16 object-contain rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    
                    {/* Plan badge */}
                    {getPlanBadge(business.current_plan_details)}
                  </div>
                  
                  {/* Nombre del negocio */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {business.name}
                  </h3>
                  
                  {/* Colores */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">Colores:</span>
                    <div className="flex gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: business.primary_color }}
                        title={`Primary: ${business.primary_color}`}
                      />
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: business.secondary_color }}
                        title={`Secondary: ${business.secondary_color}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="p-6 space-y-3">
                  {business.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{business.email}</span>
                    </div>
                  )}
                  
                  {business.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  
                  {/* Fecha de registro */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      Registrado: {new Date(business.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  
                  {/* Cantidad de usuarios */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{business.users_count || 0} usuarios</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // VISTA PARA USUARIOS NORMALES: Gestión de profesionales
  const filteredProfessionals = professionals.filter(prof => {
    const searchLower = searchTerm.toLowerCase();
    const specialty = prof.specialty || prof.specialties || '';
    return (
      prof.user?.first_name?.toLowerCase().includes(searchLower) ||
      prof.user?.last_name?.toLowerCase().includes(searchLower) ||
      prof.name?.toLowerCase().includes(searchLower) ||
      specialty.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profesionales</h1>
          <p className="text-gray-600">Gestiona tu equipo de trabajo</p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar profesionales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Add button */}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
          >
            <Plus className="w-5 h-5" />
            Nuevo Profesional
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-2xl font-bold text-primary">{professionals.length}</p>
            <p className="text-sm text-gray-600">Total profesionales</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-2xl font-bold text-green-600">
              {professionals.filter(p => p.is_active).length}
            </p>
            <p className="text-sm text-gray-600">Activos</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-2xl font-bold text-secondary">
              {professionals.filter(p => p.accepts_online_bookings).length}
            </p>
            <p className="text-sm text-gray-600">Reservas online</p>
          </div>
        </div>

        {/* Professionals Grid */}
        {filteredProfessionals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No hay profesionales registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessionals.map((professional) => {
              const displayName = professional.user 
                ? `${professional.user.first_name} ${professional.user.last_name}`.trim()
                : professional.name || 'Sin nombre';
              const displayInitial = professional.user?.first_name?.charAt(0).toUpperCase() 
                || professional.name?.charAt(0).toUpperCase() 
                || '?';
              const displaySpecialty = professional.specialty || professional.specialties || '';
              
              return (
                <div
                  key={professional.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
                >
                  {/* Header con avatar */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {displayInitial}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {displayName}
                      </h3>
                      <p className="text-sm text-gray-600">{displaySpecialty}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenModal(professional)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(professional.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                {/* Contact info */}
                <div className="space-y-2 mb-4">
                  {(professional.user?.phone || professional.phone) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {professional.user?.phone || professional.phone}
                    </div>
                  )}
                  {(professional.user?.email || professional.email) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {professional.user?.email || professional.email}
                    </div>
                  )}
                </div>

                {/* Services */}
                {professional.services && professional.services.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">SERVICIOS:</p>
                    <div className="flex flex-wrap gap-1">
                      {professional.services.map(service => (
                        <span
                          key={service.id}
                          className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    professional.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {professional.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  {professional.accepts_online_bookings && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      Reserva online
                    </span>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={handleCloseModal}
            title={editingProfessional ? 'Editar Profesional' : 'Nuevo Profesional'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Solo mostrar campos de usuario al crear (no al editar) */}
              {!editingProfessional && (
                <>
                  <div className="pb-4 mb-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3">👤 Datos del usuario</h4>
                    
                    {/* Email */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                        placeholder="ejemplo@correo.com"
                      />
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                        minLength={8}
                        placeholder="Mínimo 8 caracteres"
                      />
                      <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres</p>
                    </div>

                    {/* Name */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          autoComplete="given-name"
                          placeholder="Carlos"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          autoComplete="family-name"
                          placeholder="Castillo"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        autoComplete="tel"
                        placeholder="3215698741"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Professional data */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">💼 Datos profesionales</h4>
                
                {/* Specialty */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Colorista, Barbero, Estilista..."
                  />
                </div>

                {/* Services */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicios que ofrece
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                    {services.map(service => (
                      <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Profesional activo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="accepts_online_bookings"
                      checked={formData.accepts_online_bookings}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Aceptar reservas online</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  {editingProfessional ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Professionals;
