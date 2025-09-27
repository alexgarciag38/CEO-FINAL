import React, { useState, useEffect } from 'react';
import AgendaDeFlujo from './AgendaDeFlujo';
import RegistrosRapidos from './RegistrosRapidos';
import { HistorialMovimientos } from './HistorialMovimientos';
import { 
  Calendar, 
  FileText, 
  History 
} from 'lucide-react';

type MovimientosTab = 'agenda' | 'registros' | 'historial';

export const MovimientosContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MovimientosTab>('agenda');
  const [autoAddRow, setAutoAddRow] = useState(false);

  const tabs = [
    { 
      id: 'agenda' as const, 
      label: 'Agenda de Flujo', 
      icon: Calendar,
      description: 'Movimientos pendientes por pagar y cobrar'
    },
    { 
      id: 'registros' as const, 
      label: 'Registros Rápidos', 
      icon: FileText,
      description: 'Creación rápida de pagos únicos y reglas recurrentes'
    },
    { 
      id: 'historial' as const, 
      label: 'Historial', 
      icon: History,
      description: 'Movimientos completados'
    }
  ];

  const handleNavigateToRegistros = () => {
    setAutoAddRow(true);
    setActiveTab('registros');
  };

  // Reset autoAddRow after it's been used
  useEffect(() => {
    if (autoAddRow && activeTab === 'registros') {
      const timer = setTimeout(() => {
        setAutoAddRow(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoAddRow, activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'agenda':
        return <AgendaDeFlujo onNavigateToRegistros={handleNavigateToRegistros} />;
      case 'registros':
        return <RegistrosRapidos autoAddRow={autoAddRow} />;
      case 'historial':
        return <HistorialMovimientos />;
      default:
        return <AgendaDeFlujo onNavigateToRegistros={handleNavigateToRegistros} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navegación de pestañas internas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <IconComponent className={`w-5 h-5 mr-2 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};
