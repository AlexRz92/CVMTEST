import React, { useEffect, useState } from 'react';
import { useModulo } from '../../contexts/ModuloContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePartner } from '../../contexts/PartnerContext';
import { supabase } from '../../config/supabase';
import Header from '../Layout/Header';
import SocioHeader from '../Socio/SocioHeader';
import ModuloSelector from './ModuloSelector';
import ModuloStatsCards from './ModuloStatsCards';
import ModuloMonthlyChart from './ModuloMonthlyChart';
import ModuloDonutChart from './ModuloDonutChart';
import ModuloTransactionsTable from './ModuloTransactionsTable';
import ModuloSolicitudButtons from './ModuloSolicitudButtons';
import PDFExporter from '../Dashboard/PDFExporter';
import HelpChat from '../Dashboard/HelpChat';

interface Transaction {
  id: string;
  monto: number;
  tipo: string;
  fecha: string;
  descripcion: string;
}

const ModuloDashboard: React.FC = () => {
  const { moduloActual } = useModulo();
  const { user } = useAuth();
  const { partner } = usePartner();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (moduloActual && (user || partner)) {
      fetchTransactions();
    }
  }, [moduloActual, user, partner]);

  const fetchTransactions = async () => {
    if (!moduloActual) return;
    
    try {
      const { data, error } = await supabase
        .from('modulo_transacciones')
        .select('*')
        .eq('modulo_id', moduloActual.id)
        .eq(user ? 'inversor_id' : 'partner_id', user?.id || partner?.id)
        .eq('usuario_tipo', user ? 'inversor' : 'partner')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching module transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!moduloActual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-blue-400 to-blue-800">
        {user ? <Header /> : <SocioHeader />}
        
        <main className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              No tienes acceso a ningún módulo
            </h2>
            <p className="text-white/80">
              Contacta al administrador para ser asignado a un módulo.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-blue-400 to-blue-800">
      {user ? <Header /> : <SocioHeader />}
      
      <main className="container mx-auto px-6 py-8">
        {/* Selector de Módulo */}
        <div className="flex justify-center mb-6">
          <ModuloSelector />
        </div>

        {/* Título del Dashboard */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2 tracking-wide uppercase">
            {moduloActual.nombre} - REPORTE DE GANANCIAS
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-200 to-white mx-auto rounded-full"></div>
          {moduloActual.descripcion && (
            <p className="text-white/80 mt-2">{moduloActual.descripcion}</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Botones de Solicitud */}
            <ModuloSolicitudButtons moduloId={moduloActual.id} />

            {/* Botón de Exportar PDF */}
            <div className="flex justify-center">
              <PDFExporter 
                userId={user?.id || partner?.id || ''} 
                userName={user ? `${user.nombre} ${user.apellido}` : partner?.nombre || ''}
                userType={user ? 'inversor' : 'partner'}
              />
            </div>

            {/* Tarjetas de Estadísticas */}
            <ModuloStatsCards moduloId={moduloActual.id} />

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ModuloMonthlyChart moduloId={moduloActual.id} />
              <ModuloDonutChart moduloId={moduloActual.id} />
            </div>

            {/* Tabla de Transacciones */}
            <ModuloTransactionsTable transactions={transactions} />
          </div>
        )}
      </main>

      {/* Chat de Ayuda */}
      <HelpChat userId={user?.id || partner?.id} userType={user ? 'inversor' : 'partner'} />
    </div>
  );
};

export default ModuloDashboard;