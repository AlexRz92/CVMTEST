import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { 
  Package, Users, Settings, Calendar, TrendingUp, Plus, Edit, Trash2, 
  UserPlus, UserMinus, Search, Filter, DollarSign, Clock, CheckCircle,
  AlertCircle, X, Eye, Download, Upload, Save, RefreshCw 
} from 'lucide-react';

interface Modulo {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fecha_creacion: string;
  duracion_dias?: number;
  precio_base?: number;
  porcentaje_ganancia?: number;
  max_usuarios?: number;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  fecha_registro: string;
  activo: boolean;
}

interface AsignacionModulo {
  id: string;
  usuario_id: string;
  modulo_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'activo' | 'pausado' | 'completado' | 'cancelado';
  monto_pagado: number;
  usuario: Usuario;
}

interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  tipo: 'inicio' | 'fin' | 'pago' | 'evento';
  modulo_id: string;
  usuario_id?: string;
}

interface GananciaProcesada {
  id: string;
  modulo_id: string;
  usuario_id: string;
  monto_base: number;
  porcentaje_ganancia: number;
  ganancia_calculada: number;
  fecha_procesamiento: string;
  estado: 'pendiente' | 'procesada' | 'pagada';
  usuario: Usuario;
}

interface ModuloAdministracionProps {
  onUpdate: () => void;
}

const ModuloAdministracion: React.FC<ModuloAdministracionProps> = ({ onUpdate }) => {
  const { admin } = useAdmin();
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [moduloSeleccionado, setModuloSeleccionado] = useState<Modulo | null>(null);
  const [activeTab, setActiveTab] = useState('lista');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracion_dias: 90,
    precio_base: 0,
    porcentaje_ganancia: 10,
    max_usuarios: 100
  });

  useEffect(() => {
    fetchModulos();
  }, []);

  const fetchModulos = async () => {
    try {
      const { data, error } = await supabase
        .from('modulos_independientes')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setModulos(data || []);
      
      if (data && data.length > 0 && !moduloSeleccionado) {
        setModuloSeleccionado(data[0]);
      }
    } catch (error) {
      console.error('Error fetching modulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModulo = async () => {
    if (!formData.nombre.trim()) {
      alert('El nombre del módulo es requerido');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('modulos_independientes')
        .insert([{
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || null,
          duracion_dias: formData.duracion_dias,
          precio_base: formData.precio_base,
          porcentaje_ganancia: formData.porcentaje_ganancia,
          max_usuarios: formData.max_usuarios,
          activo: true
        }])
        .select()
        .single();

      if (error) throw error;

      setShowCreateModal(false);
      setFormData({ 
        nombre: '', 
        descripcion: '', 
        duracion_dias: 90, 
        precio_base: 0, 
        porcentaje_ganancia: 10, 
        max_usuarios: 100 
      });
      fetchModulos();
      onUpdate();
      alert('Módulo creado exitosamente');
    } catch (error) {
      console.error('Error creating modulo:', error);
      alert('Error al crear el módulo');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const tabs = [
    { id: 'lista', label: 'Lista de Módulos', icon: Package },
    { id: 'asignaciones', label: 'Gestión de Asignaciones', icon: Users },
    { id: 'calendario', label: 'Calendario del Módulo', icon: Calendar },
    { id: 'ganancias', label: 'Procesar Ganancias', icon: TrendingUp },
    { id: 'configuracion', label: 'Configuración', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-cyan-200/30">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Package className="w-6 h-6 mr-3" />
            Administración de Módulos Independientes
          </h3>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-400/50"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Módulo</span>
          </button>
        </div>

        {/* Selector de Módulo */}
        {modulos.length > 0 && (
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              Módulo Seleccionado
            </label>
            <select
              value={moduloSeleccionado?.id || ''}
              onChange={(e) => {
                const modulo = modulos.find(m => m.id === e.target.value);
                setModuloSeleccionado(modulo || null);
              }}
              className="w-full p-3 bg-white/10 border border-white/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {modulos.map((modulo) => (
                <option key={modulo.id} value={modulo.id} className="text-black">
                  {modulo.nombre} {modulo.descripcion && `- ${modulo.descripcion}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navegación de tabs */}
        <div className="flex flex-wrap gap-4 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={!moduloSeleccionado && tab.id !== 'lista'}
              className={`flex items-center space-x-3 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              } ${!moduloSeleccionado && tab.id !== 'lista' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de las tabs */}
      {activeTab === 'lista' && (
        <ListaModulos modulos={modulos} onUpdate={fetchModulos} formatDate={formatDate} formatCurrency={formatCurrency} />
      )}

      {activeTab === 'asignaciones' && moduloSeleccionado && (
        <GestionAsignaciones 
          moduloId={moduloSeleccionado.id} 
          moduloNombre={moduloSeleccionado.nombre} 
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />
      )}

      {activeTab === 'calendario' && moduloSeleccionado && (
        <CalendarioModulo 
          moduloId={moduloSeleccionado.id} 
          moduloNombre={moduloSeleccionado.nombre} 
          formatDate={formatDate}
        />
      )}

      {activeTab === 'ganancias' && moduloSeleccionado && (
        <ProcesarGananciasModulo 
          moduloId={moduloSeleccionado.id} 
          moduloNombre={moduloSeleccionado.nombre} 
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />
      )}

      {activeTab === 'configuracion' && moduloSeleccionado && (
        <ConfiguracionModulo 
          modulo={moduloSeleccionado} 
          onUpdate={fetchModulos}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Modal de crear módulo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Crear Nuevo Módulo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Nombre del Módulo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 3 Meses, 6 Meses, etc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  placeholder="Descripción del módulo..."
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Duración (días)
                </label>
                <input
                  type="number"
                  value={formData.duracion_dias}
                  onChange={(e) => setFormData({...formData, duracion_dias: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Precio Base (CLP)
                </label>
                <input
                  type="number"
                  value={formData.precio_base}
                  onChange={(e) => setFormData({...formData, precio_base: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Porcentaje de Ganancia (%)
                </label>
                <input
                  type="number"
                  value={formData.porcentaje_ganancia}
                  onChange={(e) => setFormData({...formData, porcentaje_ganancia: parseFloat(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Máximo de Usuarios
                </label>
                <input
                  type="number"
                  value={formData.max_usuarios}
                  onChange={(e) => setFormData({...formData, max_usuarios: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleCreateModulo}
                disabled={!formData.nombre.trim()}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Módulo
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ 
                    nombre: '', 
                    descripcion: '', 
                    duracion_dias: 90, 
                    precio_base: 0, 
                    porcentaje_ganancia: 10, 
                    max_usuarios: 100 
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para lista de módulos
const ListaModulos: React.FC<{ 
  modulos: Modulo[]; 
  onUpdate: () => void; 
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}> = ({ modulos, onUpdate, formatDate, formatCurrency }) => {
  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const toggleModuloStatus = async (moduloId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('modulos_independientes')
        .update({ activo: !currentStatus })
        .eq('id', moduloId);

      if (error) throw error;
      
      onUpdate();
      alert(`Módulo ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error('Error updating modulo status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const filteredAsignaciones = asignaciones.filter(asignacion => {
    const matchesSearch = asignacion.usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asignacion.usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'todos' || asignacion.estado === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const usuariosDisponibles = usuarios.filter(usuario => 
    !asignaciones.some(asignacion => 
      asignacion.usuario_id === usuario.id && 
      ['activo', 'pausado'].includes(asignacion.estado)
    )
  );

  if (loading) {
    return (
      <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-white">
          Gestión de Asignaciones - {moduloNombre}
        </h4>
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center space-x-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-400/50"
        >
          <UserPlus className="w-4 h-4" />
          <span>Asignar Usuario</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/50 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2 bg-white/10 border border-white/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="todos" className="text-black">Todos los estados</option>
            <option value="activo" className="text-black">Activo</option>
            <option value="pausado" className="text-black">Pausado</option>
            <option value="completado" className="text-black">Completado</option>
            <option value="cancelado" className="text-black">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Lista de asignaciones */}
      <div className="space-y-4">
        {filteredAsignaciones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70">No hay asignaciones para este módulo</p>
          </div>
        ) : (
          filteredAsignaciones.map((asignacion) => (
            <div key={asignacion.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="text-white font-semibold">{asignacion.usuario.nombre}</h5>
                  <p className="text-white/70 text-sm">{asignacion.usuario.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-white/60">
                    <span>Inicio: {formatDate(asignacion.fecha_inicio)}</span>
                    <span>Fin: {formatDate(asignacion.fecha_fin)}</span>
                    <span>Pagado: {formatCurrency(asignacion.monto_pagado)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={asignacion.estado}
                    onChange={(e) => updateAssignmentStatus(asignacion.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      asignacion.estado === 'activo' 
                        ? 'bg-green-500/20 text-green-300 border-green-500/50'
                        : asignacion.estado === 'pausado'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                        : asignacion.estado === 'completado'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                        : 'bg-red-500/20 text-red-300 border-red-500/50'
                    }`}
                  >
                    <option value="activo" className="text-black">ACTIVO</option>
                    <option value="pausado" className="text-black">PAUSADO</option>
                    <option value="completado" className="text-black">COMPLETADO</option>
                    <option value="cancelado" className="text-black">CANCELADO</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de asignación */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Asignar Usuario al Módulo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Usuario *
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar usuario...</option>
                  {usuariosDisponibles.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre} - {usuario.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={assignmentData.fecha_inicio}
                  onChange={(e) => setAssignmentData({...assignmentData, fecha_inicio: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Monto Pagado (CLP)
                </label>
                <input
                  type="number"
                  value={assignmentData.monto_pagado}
                  onChange={(e) => setAssignmentData({...assignmentData, monto_pagado: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleAssignUser}
                disabled={!selectedUser}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Asignar Usuario
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUser('');
                  setAssignmentData({
                    fecha_inicio: new Date().toISOString().split('T')[0],
                    monto_pagado: 0
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para calendario del módulo
const CalendarioModulo: React.FC<{ 
  moduloId: string; 
  moduloNombre: string; 
  formatDate: (date: string) => string;
}> = ({ moduloId, moduloNombre, formatDate }) => {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventData, setEventData] = useState({
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'evento' as 'inicio' | 'fin' | 'pago' | 'evento'
  });

  useEffect(() => {
    fetchEventos();
  }, [moduloId, selectedMonth, selectedYear]);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      
      // Fetch eventos del calendario
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_calendario')
        .select('*')
        .eq('modulo_id', moduloId)
        .gte('fecha', `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`)
        .lt('fecha', `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`);

      if (eventosError) throw eventosError;

      // Fetch asignaciones para generar eventos automáticos
      const { data: asignacionesData, error: asignacionesError } = await supabase
        .from('asignaciones_modulo')
        .select(`
          *,
          usuario:usuarios(nombre)
        `)
        .eq('modulo_id', moduloId);

      if (asignacionesError) throw asignacionesError;

      const eventosAsignaciones: EventoCalendario[] = [];
      asignacionesData?.forEach(asignacion => {
        // Evento de inicio
        eventosAsignaciones.push({
          id: `inicio-${asignacion.id}`,
          titulo: `Inicio: ${asignacion.usuario.nombre}`,
          descripcion: 'Inicio del módulo',
          fecha: asignacion.fecha_inicio,
          tipo: 'inicio',
          modulo_id: moduloId,
          usuario_id: asignacion.usuario_id
        });

        // Evento de fin
        eventosAsignaciones.push({
          id: `fin-${asignacion.id}`,
          titulo: `Finalización: ${asignacion.usuario.nombre}`,
          descripcion: 'Finalización del módulo',
          fecha: asignacion.fecha_fin,
          tipo: 'fin',
          modulo_id: moduloId,
          usuario_id: asignacion.usuario_id
        });
      });

      const todosEventos = [...(eventosData || []), ...eventosAsignaciones];
      setEventos(todosEventos);
    } catch (error) {
      console.error('Error fetching eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventData.titulo.trim()) {
      alert('El título del evento es requerido');
      return;
    }

    try {
      const { error } = await supabase
        .from('eventos_calendario')
        .insert([{
          titulo: eventData.titulo,
          descripcion: eventData.descripcion || null,
          fecha: eventData.fecha,
          tipo: eventData.tipo,
          modulo_id: moduloId
        }]);

      if (error) throw error;

      setShowEventModal(false);
      setEventData({
        titulo: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'evento'
      });
      fetchEventos();
      alert('Evento creado exitosamente');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error al crear el evento');
    }
  };

  const getDaysInMonth = () => {
    const date = new Date(selectedYear, selectedMonth + 1, 0);
    return date.getDate();
  };

  const getFirstDayOfMonth = () => {
    const date = new Date(selectedYear, selectedMonth, 1);
    return date.getDay();
  };

  const getEventosForDay = (day: number) => {
    const fecha = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventos.filter(evento => evento.fecha === fecha);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (loading) {
    return (
      <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-white">
          Calendario - {moduloNombre}
        </h4>
        <button
          onClick={() => setShowEventModal(true)}
          className="flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-400/50"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Evento</span>
        </button>
      </div>

      {/* Navegación del calendario */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            ←
          </button>
          
          <h5 className="text-white font-semibold text-lg">
            {monthNames[selectedMonth]} {selectedYear}
          </h5>
          
          <button
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
        
        <button
          onClick={() => {
            setSelectedMonth(new Date().getMonth());
            setSelectedYear(new Date().getFullYear());
          }}
          className="px-3 py-1 text-sm text-white bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* Calendario */}
      <div className="bg-white/10 rounded-lg p-4">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="p-2 text-center text-white/70 font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espacios vacíos para el primer día del mes */}
          {Array.from({ length: getFirstDayOfMonth() }, (_, i) => (
            <div key={`empty-${i}`} className="p-2 h-24"></div>
          ))}

          {/* Días del mes */}
          {Array.from({ length: getDaysInMonth() }, (_, i) => {
            const day = i + 1;
            const eventosDelDia = getEventosForDay(day);
            const isToday = new Date().getDate() === day && 
                           new Date().getMonth() === selectedMonth && 
                           new Date().getFullYear() === selectedYear;

            return (
              <div
                key={day}
                className={`p-2 h-24 border border-white/20 rounded ${
                  isToday ? 'bg-blue-500/30' : 'bg-white/5'
                } hover:bg-white/10 transition-colors`}
              >
                <div className="text-white text-sm font-semibold mb-1">{day}</div>
                <div className="space-y-1">
                  {eventosDelDia.slice(0, 2).map(evento => (
                    <div
                      key={evento.id}
                      className={`text-xs px-1 py-0.5 rounded truncate ${
                        evento.tipo === 'inicio' 
                          ? 'bg-green-500/30 text-green-200'
                          : evento.tipo === 'fin'
                          ? 'bg-red-500/30 text-red-200'
                          : evento.tipo === 'pago'
                          ? 'bg-yellow-500/30 text-yellow-200'
                          : 'bg-blue-500/30 text-blue-200'
                      }`}
                      title={evento.titulo}
                    >
                      {evento.titulo}
                    </div>
                  ))}
                  {eventosDelDia.length > 2 && (
                    <div className="text-xs text-white/50">
                      +{eventosDelDia.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de crear evento */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Crear Evento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  value={eventData.titulo}
                  onChange={(e) => setEventData({...eventData, titulo: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Reunión de seguimiento"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Descripción
                </label>
                <textarea
                  value={eventData.descripcion}
                  onChange={(e) => setEventData({...eventData, descripcion: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  placeholder="Descripción del evento..."
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={eventData.fecha}
                  onChange={(e) => setEventData({...eventData, fecha: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Tipo de Evento
                </label>
                <select
                  value={eventData.tipo}
                  onChange={(e) => setEventData({...eventData, tipo: e.target.value as any})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="evento">Evento General</option>
                  <option value="pago">Evento de Pago</option>
                  <option value="inicio">Inicio de Módulo</option>
                  <option value="fin">Fin de Módulo</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleCreateEvent}
                disabled={!eventData.titulo.trim()}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Evento
              </button>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEventData({
                    titulo: '',
                    descripcion: '',
                    fecha: new Date().toISOString().split('T')[0],
                    tipo: 'evento'
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para procesar ganancias
const ProcesarGananciasModulo: React.FC<{ 
  moduloId: string; 
  moduloNombre: string; 
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}> = ({ moduloId, moduloNombre, formatDate, formatCurrency }) => {
  const [ganancias, setGanancias] = useState<GananciaProcesada[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAll, setProcessingAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [totalStats, setTotalStats] = useState({
    total_pendiente: 0,
    total_procesada: 0,
    total_pagada: 0,
    count_pendiente: 0,
    count_procesada: 0,
    count_pagada: 0
  });

  useEffect(() => {
    fetchGanancias();
  }, [moduloId]);

  const fetchGanancias = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ganancias_procesadas')
        .select(`
          *,
          usuario:usuarios(*)
        `)
        .eq('modulo_id', moduloId)
        .order('fecha_procesamiento', { ascending: false });

      if (error) throw error;
      
      setGanancias(data || []);
      
      // Calcular estadísticas
      const stats = {
        total_pendiente: 0,
        total_procesada: 0,
        total_pagada: 0,
        count_pendiente: 0,
        count_procesada: 0,
        count_pagada: 0
      };

      data?.forEach(ganancia => {
        if (ganancia.estado === 'pendiente') {
          stats.total_pendiente += ganancia.ganancia_calculada;
          stats.count_pendiente++;
        } else if (ganancia.estado === 'procesada') {
          stats.total_procesada += ganancia.ganancia_calculada;
          stats.count_procesada++;
        } else if (ganancia.estado === 'pagada') {
          stats.total_pagada += ganancia.ganancia_calculada;
          stats.count_pagada++;
        }
      });

      setTotalStats(stats);
    } catch (error) {
      console.error('Error fetching ganancias:', error);
    } finally {
      setLoading(false);
    }
  };

  const procesarGananciasAutomaticas = async () => {
    try {
      setProcessingAll(true);
      
      // Obtener asignaciones completadas sin ganancias procesadas
      const { data: asignaciones, error } = await supabase
        .from('asignaciones_modulo')
        .select(`
          *,
          usuario:usuarios(*),
          modulo:modulos_independientes(*)
        `)
        .eq('modulo_id', moduloId)
        .eq('estado', 'completado');

      if (error) throw error;

      if (!asignaciones || asignaciones.length === 0) {
        alert('No hay asignaciones completadas para procesar');
        return;
      }

      // Procesar cada asignación
      const gananciasAProcesar = [];
      
      for (const asignacion of asignaciones) {
        // Verificar si ya existe una ganancia procesada
        const { data: existingGanancia } = await supabase
          .from('ganancias_procesadas')
          .select('id')
          .eq('modulo_id', moduloId)
          .eq('usuario_id', asignacion.usuario_id)
          .single();

        if (!existingGanancia) {
          const porcentajeGanancia = asignacion.modulo.porcentaje_ganancia || 10;
          const gananciasCalculada = (asignacion.monto_pagado * porcentajeGanancia) / 100;

          gananciasAProcesar.push({
            modulo_id: moduloId,
            usuario_id: asignacion.usuario_id,
            monto_base: asignacion.monto_pagado,
            porcentaje_ganancia: porcentajeGanancia,
            ganancia_calculada: gananciasCalculada,
            estado: 'pendiente'
          });
        }
      }

      if (gananciasAProcesar.length === 0) {
        alert('No hay nuevas ganancias para procesar');
        return;
      }

      const { error: insertError } = await supabase
        .from('ganancias_procesadas')
        .insert(gananciasAProcesar);

      if (insertError) throw insertError;

      fetchGanancias();
      alert('Todas las ganancias procesadas han sido marcadas como pagadas');
    } catch (error) {
      console.error('Error marking all as paid:', error);
      alert('Error al marcar como pagadas');
    }
  };

  const exportarGanancias = () => {
    const csvData = ganancias.map(ganancia => ({
      'Usuario': ganancia.usuario.nombre,
      'Email': ganancia.usuario.email,
      'Monto Base': ganancia.monto_base,
      'Porcentaje': ganancia.porcentaje_ganancia,
      'Ganancia Calculada': ganancia.ganancia_calculada,
      'Estado': ganancia.estado,
      'Fecha Procesamiento': formatDate(ganancia.fecha_procesamiento)
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ganancias_${moduloNombre}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredGanancias = ganancias.filter(ganancia => 
    filterStatus === 'todos' || ganancia.estado === filterStatus
  );

  if (loading) {
    return (
      <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-white">
          Procesar Ganancias - {moduloNombre}
        </h4>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportarGanancias}
            disabled={ganancias.length === 0}
            className="flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-400/50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={procesarGananciasAutomaticas}
            disabled={processingAll}
            className="flex items-center space-x-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-400/50 disabled:opacity-50"
          >
            {processingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            <span>Procesar Automático</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-yellow-300" />
            <div>
              <p className="text-yellow-300 font-semibold">Pendientes</p>
              <p className="text-white text-lg font-bold">{formatCurrency(totalStats.total_pendiente)}</p>
              <p className="text-yellow-200 text-sm">{totalStats.count_pendiente} ganancias</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-blue-300" />
            <div>
              <p className="text-blue-300 font-semibold">Procesadas</p>
              <p className="text-white text-lg font-bold">{formatCurrency(totalStats.total_procesada)}</p>
              <p className="text-blue-200 text-sm">{totalStats.count_procesada} ganancias</p>
            </div>
          </div>
        </div>

        <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-green-300" />
            <div>
              <p className="text-green-300 font-semibold">Pagadas</p>
              <p className="text-white text-lg font-bold">{formatCurrency(totalStats.total_pagada)}</p>
              <p className="text-green-200 text-sm">{totalStats.count_pagada} ganancias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      {totalStats.count_procesada > 0 && (
        <div className="mb-6">
          <button
            onClick={marcarTodasComoPagadas}
            className="flex items-center space-x-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-400/50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Marcar Todas las Procesadas como Pagadas</span>
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-48 p-2 bg-white/10 border border-white/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <option value="todos" className="text-black">Todos los estados</option>
          <option value="pendiente" className="text-black">Pendientes</option>
          <option value="procesada" className="text-black">Procesadas</option>
          <option value="pagada" className="text-black">Pagadas</option>
        </select>
      </div>

      {/* Lista de ganancias */}
      <div className="space-y-4">
        {filteredGanancias.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70">No hay ganancias procesadas para este módulo</p>
          </div>
        ) : (
          filteredGanancias.map((ganancia) => (
            <div key={ganancia.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="text-white font-semibold">{ganancia.usuario.nombre}</h5>
                  <p className="text-white/70 text-sm">{ganancia.usuario.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-white/60">
                    <span>Base: {formatCurrency(ganancia.monto_base)}</span>
                    <span>Ganancia: {ganancia.porcentaje_ganancia}%</span>
                    <span>Total: {formatCurrency(ganancia.ganancia_calculada)}</span>
                    <span>Procesado: {formatDate(ganancia.fecha_procesamiento)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={ganancia.estado}
                    onChange={(e) => updateGananciaStatus(ganancia.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      ganancia.estado === 'pendiente' 
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                        : ganancia.estado === 'procesada'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                        : 'bg-green-500/20 text-green-300 border-green-500/50'
                    }`}
                  >
                    <option value="pendiente" className="text-black">PENDIENTE</option>
                    <option value="procesada" className="text-black">PROCESADA</option>
                    <option value="pagada" className="text-black">PAGADA</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Componente para configuración del módulo
const ConfiguracionModulo: React.FC<{ 
  modulo: Modulo; 
  onUpdate: () => void;
  formatCurrency: (amount: number) => string;
}> = ({ modulo, onUpdate, formatCurrency }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    nombre: modulo.nombre,
    descripcion: modulo.descripcion || '',
    duracion_dias: modulo.duracion_dias || 90,
    precio_base: modulo.precio_base || 0,
    porcentaje_ganancia: modulo.porcentaje_ganancia || 10,
    max_usuarios: modulo.max_usuarios || 100,
    activo: modulo.activo
  });

  const [stats, setStats] = useState({
    total_asignaciones: 0,
    asignaciones_activas: 0,
    total_ingresos: 0,
    total_ganancias: 0
  });

  useEffect(() => {
    fetchStats();
  }, [modulo.id]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Obtener estadísticas de asignaciones
      const { data: asignaciones, error: asignacionesError } = await supabase
        .from('asignaciones_modulo')
        .select('*')
        .eq('modulo_id', modulo.id);

      if (asignacionesError) throw asignacionesError;

      // Obtener estadísticas de ganancias
      const { data: ganancias, error: gananciasError } = await supabase
        .from('ganancias_procesadas')
        .select('*')
        .eq('modulo_id', modulo.id);

      if (gananciasError) throw gananciasError;

      const totalAsignaciones = asignaciones?.length || 0;
      const asignacionesActivas = asignaciones?.filter(a => a.estado === 'activo').length || 0;
      const totalIngresos = asignaciones?.reduce((sum, a) => sum + (a.monto_pagado || 0), 0) || 0;
      const totalGanancias = ganancias?.reduce((sum, g) => sum + (g.ganancia_calculada || 0), 0) || 0;

      setStats({
        total_asignaciones: totalAsignaciones,
        asignaciones_activas: asignacionesActivas,
        total_ingresos: totalIngresos,
        total_ganancias: totalGanancias
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('modulos_independientes')
        .update({
          nombre: config.nombre,
          descripcion: config.descripcion || null,
          duracion_dias: config.duracion_dias,
          precio_base: config.precio_base,
          porcentaje_ganancia: config.porcentaje_ganancia,
          max_usuarios: config.max_usuarios,
          activo: config.activo
        })
        .eq('id', modulo.id);

      if (error) throw error;
      
      onUpdate();
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!confirm(`¿Estás seguro de eliminar el módulo "${modulo.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    if (!confirm('ADVERTENCIA: Se eliminarán todas las asignaciones y ganancias asociadas. ¿Continuar?')) {
      return;
    }

    try {
      setSaving(true);
      
      // Primero eliminar ganancias procesadas
      const { error: gananciasError } = await supabase
        .from('ganancias_procesadas')
        .delete()
        .eq('modulo_id', modulo.id);

      if (gananciasError) throw gananciasError;

      // Luego eliminar asignaciones
      const { error: asignacionesError } = await supabase
        .from('asignaciones_modulo')
        .delete()
        .eq('modulo_id', modulo.id);

      if (asignacionesError) throw asignacionesError;

      // Finalmente eliminar el módulo
      const { error: moduloError } = await supabase
        .from('modulos_independientes')
        .delete()
        .eq('id', modulo.id);

      if (moduloError) throw moduloError;
      
      onUpdate();
      alert('Módulo eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Error al eliminar el módulo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-white">
          Configuración - {modulo.nombre}
        </h4>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-400/50 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración */}
        <div className="space-y-6">
          <div className="bg-white/10 rounded-lg p-4">
            <h5 className="text-white font-semibold mb-4">Configuración General</h5>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Nombre del Módulo
                </label>
                <input
                  type="text"
                  value={config.nombre}
                  onChange={(e) => setConfig({...config, nombre: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Descripción
                </label>
                <textarea
                  value={config.descripcion}
                  onChange={(e) => setConfig({...config, descripcion: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Duración (días)
                  </label>
                  <input
                    type="number"
                    value={config.duracion_dias}
                    onChange={(e) => setConfig({...config, duracion_dias: parseInt(e.target.value) || 0})}
                    className="w-full p-3 bg-white/10 border border-white/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Máx. Usuarios
                  </label>
                  <input
                    type="number"
                    value={config.max_usuarios}
                    onChange={(e) => setConfig({...config, max_usuarios: parseInt(e.target.value) || 0})}
                    className="w-full p-3 bg-white/10 border border-white/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Precio Base (CLP)
                  </label>
                  <input
                    type="number"
                    value={config.precio_base}
                    onChange={(e) => setConfig({...config, precio_base: parseInt(e.target.value) || 0})}
                    className="w-full p-3 bg-white/10 border border-white/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Ganancia (%)
                  </label>
                  <input
                    type="number"
                    value={config.porcentaje_ganancia}
                    onChange={(e) => setConfig({...config, porcentaje_ganancia: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 bg-white/10 border border-white/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={config.activo}
                  onChange={(e) => setConfig({...config, activo: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/50 rounded focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-white text-sm">
                  Módulo activo
                </label>
              </div>
            </div>
          </div>

          {/* Zona de peligro */}
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
            <h5 className="text-red-300 font-semibold mb-4">Zona de Peligro</h5>
            <p className="text-red-200 text-sm mb-4">
              Eliminar este módulo borrará permanentemente todas las asignaciones y ganancias asociadas.
            </p>
            <button
              onClick={handleDeleteModule}
              disabled={saving}
              className="flex items-center space-x-2 bg-red-500/30 text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/40 transition-colors border border-red-400/50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Módulo</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white/10 rounded-lg p-4 flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4">Estadísticas del Módulo</h5>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span className="text-white/70">Total de Asignaciones</span>
                  <span className="text-white font-bold">{stats.total_asignaciones}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span className="text-white/70">Asignaciones Activas</span>
                  <span className="text-green-300 font-bold">{stats.asignaciones_activas}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span className="text-white/70">Total Ingresos</span>
                  <span className="text-blue-300 font-bold">{formatCurrency(stats.total_ingresos)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span className="text-white/70">Total Ganancias</span>
                  <span className="text-yellow-300 font-bold">{formatCurrency(stats.total_ganancias)}</span>
                </div>

                {stats.total_ingresos > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <span className="text-white/70">Margen de Ganancia</span>
                    <span className="text-purple-300 font-bold">
                      {((stats.total_ganancias / stats.total_ingresos) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información del módulo */}
          <div className="bg-white/10 rounded-lg p-4">
            <h5 className="text-white font-semibold mb-4">Información del Módulo</h5>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Fecha de Creación:</span>
                <span className="text-white">{new Date(modulo.fecha_creacion).toLocaleDateString('es-ES')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/70">ID del Módulo:</span>
                <span className="text-white font-mono text-xs">{modulo.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/70">Estado:</span>
                <span className={`font-bold ${modulo.activo ? 'text-green-300' : 'text-red-300'}`}>
                  {modulo.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuloAdministracion;anancias();
      alert(`Se procesaron ${gananciasAProcesar.length} ganancias exitosamente`);
    } catch (error) {
      console.error('Error processing ganancias:', error);
      alert('Error al procesar las ganancias');
    } finally {
      setProcessingAll(false);
    }
  };

  const updateGananciaStatus = async (gananciaId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ganancias_procesadas')
        .update({ estado: newStatus })
        .eq('id', gananciaId);

      if (error) throw error;
      
      fetchGanancias();
      alert('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error updating ganancia status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const marcarTodasComoPagadas = async () => {
    if (!confirm('¿Estás seguro de marcar todas las ganancias procesadas como pagadas?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ganancias_procesadas')
        .update({ estado: 'pagada' })
        .eq('modulo_id', moduloId)
        .eq('estado', 'procesada');

      if (error) throw error;
      
      fetchG estado del módulo');
    }
  };

  const handleEditModulo = async () => {
    if (!editingModulo) return;

    try {
      const { error } = await supabase
        .from('modulos_independientes')
        .update({
          nombre: editingModulo.nombre,
          descripcion: editingModulo.descripcion,
          duracion_dias: editingModulo.duracion_dias,
          precio_base: editingModulo.precio_base,
          porcentaje_ganancia: editingModulo.porcentaje_ganancia,
          max_usuarios: editingModulo.max_usuarios
        })
        .eq('id', editingModulo.id);

      if (error) throw error;
      
      setShowEditModal(false);
      setEditingModulo(null);
      onUpdate();
      alert('Módulo actualizado exitosamente');
    } catch (error) {
      console.error('Error updating modulo:', error);
      alert('Error al actualizar el módulo');
    }
  };

  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
      <h4 className="text-lg font-bold text-white mb-4">Módulos Existentes ({modulos.length})</h4>
      
      {modulos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/70">No hay módulos creados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modulos.map((modulo) => (
            <div key={modulo.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="text-white font-semibold">{modulo.nombre}</h5>
                  {modulo.descripcion && (
                    <p className="text-white/70 text-sm">{modulo.descripcion}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-white/60">
                    <span>Creado: {formatDate(modulo.fecha_creacion)}</span>
                    {modulo.duracion_dias && <span>Duración: {modulo.duracion_dias} días</span>}
                    {modulo.precio_base && <span>Precio: {formatCurrency(modulo.precio_base)}</span>}
                    {modulo.porcentaje_ganancia && <span>Ganancia: {modulo.porcentaje_ganancia}%</span>}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setEditingModulo(modulo);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => toggleModuloStatus(modulo.id, modulo.activo)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      modulo.activo 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/50 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-300 border border-gray-500/50 hover:bg-gray-500/30'
                    }`}
                  >
                    {modulo.activo ? 'ACTIVO' : 'INACTIVO'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && editingModulo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Módulo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Nombre del Módulo *
                </label>
                <input
                  type="text"
                  value={editingModulo.nombre}
                  onChange={(e) => setEditingModulo({...editingModulo, nombre: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Descripción
                </label>
                <textarea
                  value={editingModulo.descripcion || ''}
                  onChange={(e) => setEditingModulo({...editingModulo, descripcion: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Duración (días)
                </label>
                <input
                  type="number"
                  value={editingModulo.duracion_dias || 0}
                  onChange={(e) => setEditingModulo({...editingModulo, duracion_dias: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Precio Base (CLP)
                </label>
                <input
                  type="number"
                  value={editingModulo.precio_base || 0}
                  onChange={(e) => setEditingModulo({...editingModulo, precio_base: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Porcentaje de Ganancia (%)
                </label>
                <input
                  type="number"
                  value={editingModulo.porcentaje_ganancia || 0}
                  onChange={(e) => setEditingModulo({...editingModulo, porcentaje_ganancia: parseFloat(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Máximo de Usuarios
                </label>
                <input
                  type="number"
                  value={editingModulo.max_usuarios || 0}
                  onChange={(e) => setEditingModulo({...editingModulo, max_usuarios: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleEditModulo}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingModulo(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para gestión de asignaciones
const GestionAsignaciones: React.FC<{ 
  moduloId: string; 
  moduloNombre: string; 
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}> = ({ moduloId, moduloNombre, formatDate, formatCurrency }) => {
  const [asignaciones, setAsignaciones] = useState<AsignacionModulo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [assignmentData, setAssignmentData] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0],
    monto_pagado: 0
  });

  useEffect(() => {
    fetchAsignaciones();
    fetchUsuarios();
  }, [moduloId]);

  const fetchAsignaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('asignaciones_modulo')
        .select(`
          *,
          usuario:usuarios(*)
        `)
        .eq('modulo_id', moduloId)
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      setAsignaciones(data || []);
    } catch (error) {
      console.error('Error fetching asignaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUser) {
      alert('Selecciona un usuario');
      return;
    }

    try {
      const fechaInicio = new Date(assignmentData.fecha_inicio);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + 90); // Asumiendo 90 días por defecto

      const { error } = await supabase
        .from('asignaciones_modulo')
        .insert([{
          usuario_id: selectedUser,
          modulo_id: moduloId,
          fecha_inicio: assignmentData.fecha_inicio,
          fecha_fin: fechaFin.toISOString().split('T')[0],
          estado: 'activo',
          monto_pagado: assignmentData.monto_pagado
        }]);

      if (error) throw error;

      setShowAssignModal(false);
      setSelectedUser('');
      setAssignmentData({
        fecha_inicio: new Date().toISOString().split('T')[0],
        monto_pagado: 0
      });
      fetchAsignaciones();
      alert('Usuario asignado exitosamente');
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Error al asignar usuario');
    }
  };

  const updateAssignmentStatus = async (asignacionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('asignaciones_modulo')
        .update({ estado: newStatus })
        .eq('id', asignacionId);

      if (error) throw error;
      
      fetchAsignaciones();
      alert('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el
