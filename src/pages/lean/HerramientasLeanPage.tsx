import React from 'react';
import ValueStreamMap from '@/components/modules/vsm/ValueStreamMap';

const HerramientasLeanPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Herramientas Lean</h1>
        <p className="text-sm text-gray-600">Sistema 5 · Motor de Optimización de Procesos · Value Stream Mapping</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <ValueStreamMap />
      </div>
    </div>
  );
};

export default HerramientasLeanPage;


