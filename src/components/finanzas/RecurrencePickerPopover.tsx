import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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

export interface RecurrencePickerPopoverRef {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
}

export const RecurrencePickerPopover = forwardRef(({ value, onChange, className = '' }: RecurrencePickerPopoverProps, ref: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Exponer métodos imperativos
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    isOpen: () => isOpen
  }), [isOpen]);

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
    const { frecuencia, finalizacion } = value;

    // Abreviar frecuencia a una letra
    const freqMap: Record<string, string> = {
      mensual: 'M',
      semanal: 'S',
      quincenal: 'Q',
      anual: 'A'
    } as any;

    let right = 'indef';
    if (finalizacion === 'fecha' && value.fecha_fin) {
      right = 'fecha';
    } else if (finalizacion === 'repeticiones' && value.numero_repeticiones) {
      // 6 repeticiones -> 6x
      right = `${value.numero_repeticiones}x`;
    }

    return `${freqMap[frecuencia] || '?'} | ${right}`;
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
    const todayStr = new Date().toISOString().split('T')[0];
    if (finalizacion === 'indefinido') {
      newConfig.fecha_fin = undefined;
      newConfig.numero_repeticiones = undefined;
    } else if (finalizacion === 'fecha') {
      newConfig.numero_repeticiones = undefined;
      // Inicializar fecha_fin si no existe para que el padre infiera correctamente
      if (!newConfig.fecha_fin) newConfig.fecha_fin = todayStr;
    } else if (finalizacion === 'repeticiones') {
      newConfig.fecha_fin = undefined;
      if (!newConfig.numero_repeticiones || newConfig.numero_repeticiones < 1) newConfig.numero_repeticiones = 1;
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

  // Navegación por teclado dentro del popover
  useEffect(() => {
    if (!isOpen) return;
    const el = popoverRef.current;
    if (!el) return;
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>('select, input, button'));
    // Enfocar el primer control
    const fs = focusables();
    if (fs.length > 0) setTimeout(() => fs[0].focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      const keys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'];
      if (!keys.includes(e.key)) return;
      const list = focusables();
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? list.indexOf(active) : -1;
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
      if (e.key === 'Enter') {
        // Aplicar y cerrar (los cambios ya se reflejan vía onChange de cada control)
        e.preventDefault();
        setIsOpen(false);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (list.length === 0) return;
        let next = idx;
        if (e.key === 'ArrowDown') next = (idx + 1 + list.length) % list.length;
        else next = (idx - 1 + list.length) % list.length;
        list[next]?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef} data-recurrence>
      {/* Campo de resumen */}
      <div 
        className="
          w-full px-2 py-1 text-xs border border-gray-300 rounded
          bg-white hover:border-gray-400 cursor-pointer
          flex items-center
        "
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          width: '100px'
        }}
      >
        <span 
          className="text-gray-700"
          style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            flex: '1',
            minWidth: '0'
          }}
          title={getSummaryText()}
        >
          {getSummaryText()}
        </span>
        <span className="w-3 h-3 ml-1 inline-flex items-center justify-center">
          <CogIcon />
        </span>
      </div>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-1 z-[1000] w-[100px] bg-white border border-gray-300 rounded-md shadow-lg p-1 overflow-auto max-h-[60vh]"
        >
          <div className="space-y-1.5">
            {/* Frecuencia */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5 whitespace-normal break-words">
                Frecuencia
              </label>
              <select
                value={value.frecuencia}
                onChange={(e) => handleFrecuenciaChange(e.target.value as RecurrenceConfig['frecuencia'])}
                className="w-full px-1 py-0.5 border border-gray-300 rounded-md text-[11px]"
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
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 whitespace-normal break-words">
                  Día del mes
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={value.dia_especifico || 1}
                  onChange={(e) => onChange({ ...value, dia_especifico: parseInt(e.target.value) })}
                  className="w-full px-1 py-0.5 border border-gray-300 rounded-md text-[11px]"
                />
              </div>
            )}

            {/* Día de la semana */}
            {value.frecuencia === 'semanal' && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 whitespace-normal break-words">
                  Día de la semana
                </label>
                <select
                  value={value.dia_semana || 'lunes'}
                  onChange={(e) => onChange({ ...value, dia_semana: e.target.value })}
                  className="w-full px-1 py-0.5 border border-gray-300 rounded-md text-[11px]"
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
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5 whitespace-normal break-words">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={value.fecha_inicio}
                onChange={(e) => onChange({ ...value, fecha_inicio: e.target.value })}
                className="w-full px-1 py-0.5 border border-gray-300 rounded-md text-[11px]"
              />
            </div>

            {/* Finalización */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5 whitespace-normal break-words">
                Finalización
              </label>
              <select
                value={value.finalizacion}
                onChange={(e) => handleFinalizacionChange(e.target.value as RecurrenceConfig['finalizacion'])}
                className="w-full px-1 py-0.5 border border-gray-300 rounded-md text-[11px]"
              >
                <option value="indefinido">Indefinido</option>
                <option value="fecha">Hasta fecha específica</option>
                <option value="repeticiones">Después de X ocurrencias</option>
              </select>
            </div>

            {/* Fecha fin */}
            {value.finalizacion === 'fecha' && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 whitespace-normal break-words">
                  Fecha de finalización
                </label>
                <input
                  type="date"
                  value={value.fecha_fin || ''}
                  onChange={(e) => onChange({ ...value, fecha_fin: e.target.value })}
                  className="w-full px-1 py-0.5 border border-gray-300 rounded-md text-[11px]"
                />
              </div>
            )}

            {/* Número de repeticiones */}
            {value.finalizacion === 'repeticiones' && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5 whitespace-normal break-words">
                  Número de repeticiones
                </label>
                <input
                  type="number"
                  min="1"
                  value={value.numero_repeticiones || 1}
                  onChange={(e) => onChange({ ...value, numero_repeticiones: parseInt(e.target.value) })}
                  className="w-full px-1 py-0.5 border border-gray-300 rounded-md text-[11px]"
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-between space-x-1 pt-1 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="px-1 py-0.5 text-[10px] text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-1 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default RecurrencePickerPopover;
