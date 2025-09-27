import React, { useState, useRef, useEffect } from 'react';
import { CogIcon } from '@/components/ui/ProfessionalIcons';

interface RecurrenceConfig {
  frecuencia: 'mensual' | 'semanal' | 'quincenal' | 'anual';
  dia_especifico?: number;
  dia_semana?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  numero_repeticiones?: number;
  finalizacion: 'indefinido' | 'fecha' | 'repeticiones';
}

interface RecurrencePickerPopoverProps {
  value: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
  className?: string;
}

export const RecurrencePickerPopover: React.FC<RecurrencePickerPopoverProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSummaryText = () => {
    const { frecuencia, dia_especifico, dia_semana, finalizacion } = value;
    
    let summary = '';
    
    switch (frecuencia) {
      case 'mensual':
        summary = `Mensual (día ${dia_especifico || 1})`;
        break;
      case 'semanal':
        summary = `Semanal (${dia_semana || 'lunes'})`;
        break;
      case 'quincenal':
        summary = 'Quincenal';
        break;
      case 'anual':
        summary = `Anual (${dia_especifico || 1}/${new Date(value.fecha_inicio).getMonth() + 1})`;
        break;
    }

    if (finalizacion === 'fecha' && value.fecha_fin) {
      summary += ` - Hasta ${new Date(value.fecha_fin).toLocaleDateString()}`;
    } else if (finalizacion === 'repeticiones' && value.numero_repeticiones) {
      summary += ` - ${value.numero_repeticiones} veces`;
    } else {
      summary += ' - Indefinido';
    }

    return summary;
  };

  const handleFrecuenciaChange = (frecuencia: RecurrenceConfig['frecuencia']) => {
    const newConfig = { ...value, frecuencia };
    
    // Resetear campos específicos según la frecuencia
    if (frecuencia === 'semanal') {
      newConfig.dia_especifico = undefined;
      newConfig.dia_semana = 'lunes';
    } else {
      newConfig.dia_semana = undefined;
      newConfig.dia_especifico = 1;
    }
    
    onChange(newConfig);
  };

  const handleFinalizacionChange = (finalizacion: RecurrenceConfig['finalizacion']) => {
    const newConfig = { ...value, finalizacion };
    
    if (finalizacion === 'indefinido') {
      newConfig.fecha_fin = undefined;
      newConfig.numero_repeticiones = undefined;
    }
    
    onChange(newConfig);
  };

  const diasSemana = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miércoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sábado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      {/* Campo de resumen */}
      <div 
        className="
          w-full px-3 py-2 text-sm border border-gray-300 rounded-md
          bg-white hover:border-gray-400 cursor-pointer
          flex items-center justify-between
        "
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate text-gray-700">
          {getSummaryText()}
        </span>
        <CogIcon />
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="
          absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300
          rounded-lg shadow-lg z-50 p-4
        ">
          <div className="space-y-4">
            {/* Frecuencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia
              </label>
              <select
                value={value.frecuencia}
                onChange={(e) => handleFrecuenciaChange(e.target.value as RecurrenceConfig['frecuencia'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="mensual">Mensual</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="anual">Anual</option>
              </select>
            </div>

            {/* Día específico */}
            {value.frecuencia === 'mensual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Día del mes
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={value.dia_especifico || 1}
                  onChange={(e) => onChange({ ...value, dia_especifico: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}

            {/* Día de la semana */}
            {value.frecuencia === 'semanal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Día de la semana
                </label>
                <select
                  value={value.dia_semana || 'lunes'}
                  onChange={(e) => onChange({ ...value, dia_semana: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {diasSemana.map(dia => (
                    <option key={dia.value} value={dia.value}>
                      {dia.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fecha de inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={value.fecha_inicio}
                onChange={(e) => onChange({ ...value, fecha_inicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Finalización */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Finalización
              </label>
              <select
                value={value.finalizacion}
                onChange={(e) => handleFinalizacionChange(e.target.value as RecurrenceConfig['finalizacion'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="indefinido">Indefinido</option>
                <option value="fecha">Hasta fecha específica</option>
                <option value="repeticiones">Después de X ocurrencias</option>
              </select>
            </div>

            {/* Fecha fin */}
            {value.finalizacion === 'fecha' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de finalización
                </label>
                <input
                  type="date"
                  value={value.fecha_fin || ''}
                  onChange={(e) => onChange({ ...value, fecha_fin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}

            {/* Número de repeticiones */}
            {value.finalizacion === 'repeticiones' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de repeticiones
                </label>
                <input
                  type="number"
                  min="1"
                  value={value.numero_repeticiones || 1}
                  onChange={(e) => onChange({ ...value, numero_repeticiones: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurrencePickerPopover;
