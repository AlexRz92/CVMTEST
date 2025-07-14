import React, { useEffect, useState } from 'react';
import { useModulo } from '../../contexts/ModuloContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePartner } from '../../contexts/PartnerContext';
import { Package, ChevronDown, Check } from 'lucide-react';

const ModuloSelector: React.FC = () => {
  const { modulos, moduloActual, setModuloActual, verificarAcceso } = useModulo();
  const { user } = useAuth();
  const { partner } = usePartner();
  const [showDropdown, setShowDropdown] = useState(false);
  const [modulosAccesibles, setModulosAccesibles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ((user || partner) && modulos.length > 0) {
      verificarAccesoModulos();
    }
  }, [user, partner, modulos]);

  const verificarAccesoModulos = async () => {
    if (!user && !partner) return;
    
    setLoading(true);
    try {
      const accesos = await Promise.all(
        modulos.map(async (modulo) => {
          const tieneAcceso = await verificarAcceso(
            modulo.id,
            user?.id || partner?.id || '',
            user ? 'inversor' : 'partner'
          );
          return tieneAcceso ? modulo.id : null;
        })
      );
      
      const modulosConAcceso = accesos.filter(Boolean) as string[];
      setModulosAccesibles(modulosConAcceso);
      
      // Si no hay módulo actual seleccionado y hay módulos accesibles, seleccionar el primero
      if (!moduloActual && modulosConAcceso.length > 0) {
        const primerModulo = modulos.find(m => modulosConAcceso.includes(m.id));
        if (primerModulo) {
          setModuloActual(primerModulo);
        }
      }
    } catch (error) {
      console.error('Error verificando acceso a módulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModulo = (modulo: any) => {
    setModuloActual(modulo);
    setShowDropdown(false);
  };

  // No mostrar el selector si no hay módulos accesibles
  if (loading || modulosAccesibles.length === 0) {
    return null;
  }

  const modulosDisponibles = modulos.filter(m => modulosAccesibles.includes(m.id));

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors border border-white/30"
      >
        <Package className="w-5 h-5" />
        <span className="font-medium">
          {moduloActual ? moduloActual.nombre : 'Seleccionar Módulo'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2 font-medium uppercase tracking-wide">
              Módulos Disponibles
            </div>
            {modulosDisponibles.map((modulo) => (
              <button
                key={modulo.id}
                onClick={() => handleSelectModulo(modulo)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">{modulo.nombre}</div>
                  {modulo.descripcion && (
                    <div className="text-sm text-gray-500">{modulo.descripcion}</div>
                  )}
                </div>
                {moduloActual?.id === modulo.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuloSelector;