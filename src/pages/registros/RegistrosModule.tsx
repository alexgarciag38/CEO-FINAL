import React from 'react';
import EntradaRapidaMovimientos from '@/components/finanzas/EntradaRapidaMovimientos';

export const RegistrosModule: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header del Centro de Registros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📝 Centro de Registros</h1>
            <p className="text-gray-600 mt-1">
              Crea, edita y elimina Pagos Únicos y Reglas Recurrentes con máxima eficiencia
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Modo de Alta Rápida
            </span>
          </div>
        </div>
      </div>

      {/* Entrada Rápida como vista principal */}
      <EntradaRapidaMovimientos />
    </div>
  );
};

