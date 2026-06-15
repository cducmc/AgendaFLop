/**
 * =============================================================================
 * CLIENTS PAGE - Gestión de Clientes
 * =============================================================================
 * 
 * CRUD completo de clientes:
 * - Listar clientes
 * - Crear nuevo cliente
 * - Editar cliente
 * - Eliminar cliente
 * - Marcar como VIP
 * - Búsqueda por nombre/teléfono/email
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { clientsAPI } from '../services/api';
import { Plus, Edit, Trash2, Star, Phone, Mail, Search, Crown } from 'lucide-react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVIP, setFilterVIP] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    is_vip: false,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getAll({ search: searchTerm });
      // El backend puede devolver un array directo o un objeto con results (paginación)
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        notes: client.notes || '',
        is_vip: client.is_vip,
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
        is_vip: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      notes: '',
      is_vip: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await clientsAPI.update(editingClient.id, formData);
      } else {
        await clientsAPI.create(formData);
      }
      fetchClients();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar el cliente');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    
    try {
      await clientsAPI.delete(id);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar el cliente');
    }
  };

  const handleToggleVIP = async (id) => {
    try {
      await clientsAPI.toggleVip(id);
      fetchClients();
    } catch (error) {
      console.error('Error toggling VIP:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClients();
  };

  const filteredClients = filterVIP 
    ? clients.filter(client => client.is_vip)
    : clients;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
          <p className="text-gray-600">Gestiona tu base de clientes</p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </form>

          <div className="flex gap-3">
            {/* VIP filter */}
            <button
              onClick={() => setFilterVIP(!filterVIP)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                filterVIP
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              <Crown className="w-4 h-4" />
              Solo VIP
            </button>

            {/* Add button */}
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              <Plus className="w-5 h-5" />
              Nuevo Cliente
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-2xl font-bold text-primary">{clients.length}</p>
            <p className="text-sm text-gray-600">Total clientes</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-2xl font-bold text-secondary">
              {clients.filter(c => c.is_vip).length}
            </p>
            <p className="text-sm text-gray-600">Clientes VIP</p>
          </div>
        </div>

        {/* Clients Table */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No hay clientes registrados</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{client.name}</div>
                            {client.notes && (
                              <div className="text-sm text-gray-500">{client.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleVIP(client.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            client.is_vip
                              ? 'bg-secondary/10 text-secondary border-2 border-secondary/30'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Star className="w-3 h-3" fill={client.is_vip ? 'currentColor' : 'none'} />
                          {client.is_vip ? 'VIP' : 'Regular'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenModal(client)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={handleCloseModal}
            title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Preferencias, alergias, etc."
                />
              </div>

              {/* VIP checkbox */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_vip"
                    checked={formData.is_vip}
                    onChange={handleChange}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Cliente VIP
                  </span>
                </label>
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
                  {editingClient ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Clients;
