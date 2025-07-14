import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { Package, Users, Settings, Calendar, TrendingUp, Plus, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';

interface Modulo {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fecha_creacion: string;
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
    descripcion: ''
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
      
      // Seleccionar el primer módulo por defecto
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
      const { data, error } = await supabase.rpc('crear_modulo_independiente', {
        p_nombre: formData.nombre.trim(),
        p_descripcion: formData.descripcion.trim() || null,
        p_admin_id: admin?.id
      });

      if (error) throw error;

      const result = data[0];
      if (result.success) {
        setShowCreateModal(false);
        setFormData({ nombre: '', descripcion: '' });
        fetchModulos();
        onUpdate();
        alert('Módulo creado exitosamente');
      } else {
        alert(result.message);
      }
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
        <ListaModulos modulos={modulos} onUpdate={fetchModulos} />
      )}

      {activeTab === 'asignaciones' && moduloSeleccionado && (
        <GestionAsignaciones moduloId={moduloSeleccionado.id} moduloNombre={moduloSeleccionado.nombre} />
      )}

      {activeTab === 'calendario' && moduloSeleccionado && (
        <CalendarioModulo moduloId={moduloSeleccionado.id} moduloNombre={moduloSeleccionado.nombre} />
      )}

      {activeTab === 'ganancias' && moduloSeleccionado && (
        <ProcesarGananciasModulo moduloId={moduloSeleccionado.id} moduloNombre={moduloSeleccionado.nombre} />
      )}

      {activeTab === 'configuracion' && moduloSeleccionado && (
        <ConfiguracionModulo moduloId={moduloSeleccionado.id} moduloNombre={moduloSeleccionado.nombre} />
      )}

      {/* Modal de crear módulo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
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
                  setFormData({ nombre: '', descripcion: '' });
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
const ListaModulos: React.FC<{ modulos: Modulo[]; onUpdate: () => void }> = ({ modulos, onUpdate }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
                <div>
                  <h5 className="text-white font-semibold">{modulo.nombre}</h5>
                  {modulo.descripcion && (
                    <p className="text-white/70 text-sm">{modulo.descripcion}</p>
                  )}
                  <p className="text-white/60 text-xs mt-1">
                    Creado: {formatDate(modulo.fecha_creacion)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    modulo.activo 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                  }`}>
                    {modulo.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente placeholder para gestión de asignaciones
const GestionAsignaciones: React.FC<{ moduloId: string; moduloNombre: string }> = ({ moduloId, moduloNombre }) => {
  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
      <h4 className="text-lg font-bold text-white mb-4">
        Gestión de Asignaciones - {moduloNombre}
      </h4>
      <p className="text-white/70">
        Funcionalidad de gestión de asignaciones en desarrollo...
      </p>
    </div>
  );
};

// Componente placeholder para calendario
const CalendarioModulo: React.FC<{ moduloId: string; moduloNombre: string }> = ({ moduloId, moduloNombre }) => {
  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
      <h4 className="text-lg font-bold text-white mb-4">
        Calendario - {moduloNombre}
      </h4>
      <p className="text-white/70">
        Funcionalidad de calendario en desarrollo...
      </p>
    </div>
  );
};

// Componente placeholder para procesar ganancias
const ProcesarGananciasModulo: React.FC<{ moduloId: string; moduloNombre: string }> = ({ moduloId, moduloNombre }) => {
  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
      <h4 className="text-lg font-bold text-white mb-4">
        Procesar Ganancias - {moduloNombre}
      </h4>
      <p className="text-white/70">
        Funcionalidad de procesamiento de ganancias en desarrollo...
      </p>
    </div>
  );
};

// Componente placeholder para configuración
const ConfiguracionModulo: React.FC<{ moduloId: string; moduloNombre: string }> = ({ moduloId, moduloNombre }) => {
  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
      <h4 className="text-lg font-bold text-white mb-4">
        Configuración - {moduloNombre}
      </h4>
      <p className="text-white/70">
        Funcionalidad de configuración en desarrollo...
      </p>
    </div>
  );
};

export default ModuloAdministracion;