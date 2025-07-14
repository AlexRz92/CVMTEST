import React, { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePartner } from '../../contexts/PartnerContext';

interface ModuloStatsCardsProps {
  moduloId: string;
}

const ModuloStatsCards: React.FC<ModuloStatsCardsProps> = ({ moduloId }) => {
  const { user } = useAuth();
  const { partner } = usePartner();
  const [saldoActual, setSaldoActual] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (moduloId && (user || partner)) {
      fetchSaldoActual();
    }
  }, [moduloId, user, partner]);

  const fetchSaldoActual = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('modulo_transacciones')
        .select('monto, tipo')
        .eq('modulo_id', moduloId)
        .eq(user ? 'inversor_id' : 'partner_id', user?.id || partner?.id)
        .eq('usuario_tipo', user ? 'inversor' : 'partner');

      if (error) throw error;

      // Calcular saldo actual
      let saldo = 0;
      transactions?.forEach(transaction => {
        switch (transaction.tipo.toLowerCase()) {
          case 'deposito':
            saldo += Number(transaction.monto);
            break;
          case 'retiro':
            saldo -= Number(transaction.monto);
            break;
          case 'ganancia':
            saldo += Number(transaction.monto);
            break;
        }
      });

      setSaldoActual(saldo);
    } catch (error) {
      console.error('Error fetching module balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const cards = [
    {
      title: 'Saldo en Módulo',
      value: formatCurrency(saldoActual),
      subtitle: 'Saldo disponible en este módulo',
      icon: DollarSign,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-400/20',
      borderColor: 'border-purple-200/50'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center mb-8">
        <div className="w-full max-w-md">
          <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-cyan-200/30">
            <div className="flex items-center justify-center h-24">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-8">
      <div className="w-full max-w-md">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} backdrop-blur-lg rounded-2xl p-6 shadow-2xl border ${card.borderColor} hover:scale-105 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm text-white/90 font-medium">{card.title}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">{card.value}</p>
              {card.subtitle && (
                <p className="text-xs text-white/70">{card.subtitle}</p>
              )}
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${card.color}`}
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuloStatsCards;