import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

interface SmartDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  // onDigitInput?: (digit: string) => void; // reservado para futuras integraciones
  mode?: 'overwrite' | 'append';
}

type DateSegment = 'day' | 'month' | 'year';

const SmartDateInput = forwardRef<any, SmartDateInputProps>(({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className = "",
  onFocus,
  onBlur,
  disabled = false,
  mode = 'append'
}, ref) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [activeSegment, setActiveSegment] = useState<DateSegment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // const [isFocused, setIsFocused] = useState(false);
  const [hasClearedInThisSession, setHasClearedInThisSession] = useState(false);
  const clearedInSessionRef = useRef(false); // Ref para mantener el estado a través de focus externo
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Parsear el valor inicial
  useEffect(() => {
    const currentFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log('SmartDateInput - useEffect value change:', { value, currentFormatted, year, month, day });
    
    if (value && value.trim() !== '') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-');
        console.log('SmartDateInput - Actualizando desde formato YYYY-MM-DD:', { y, m, d });
        setDay(d.replace(/^0+/, '') || '');
        setMonth(m.replace(/^0+/, '') || '');
        setYear(y);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [d, m, y] = value.split('/');
        console.log('SmartDateInput - Actualizando desde formato DD/MM/YYYY:', { d, m, y });
        setDay(d.replace(/^0+/, '') || '');
        setMonth(m.replace(/^0+/, '') || '');
        setYear(y);
      }
    } else {
      console.log('SmartDateInput - Limpiando segmentos (valor vacío)');
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  // Actualizar el valor cuando cambien los segmentos
  useEffect(() => {
    // Actualizar el valor incluso si solo hay un segmento lleno
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    if (formattedDate !== value && (day || month || year)) {
      console.log('SmartDateInput - Actualizando valor:', { formattedDate, currentValue: value, day, month, year });
      onChange(formattedDate);
    }
  }, [day, month, year, onChange, value]);

  // Función para manejar dígitos (usada tanto por el input como por eventos externos)
  const handleDigitInput = useCallback((digit: string) => {
    console.log('SmartDateInput - handleDigitInput:', { 
      digit, 
      activeSegment, 
      isEditing, 
      day, 
      month, 
      year, 
      mode, 
      hasClearedInThisSession,
      dayLength: day.length,
      monthLength: month.length,
      yearLength: year.length
    });
    console.log('SmartDateInput - Stack trace:', new Error().stack);
    
    // Si estamos en modo sobrescribir y no hemos limpiado en esta sesión, limpiar y empezar
    if (mode === 'overwrite' && !clearedInSessionRef.current) {
      console.log('SmartDateInput - Modo sobrescribir: limpiando contenido completamente (primer dígito)');
        setIsEditing(true);
      setDay(digit); // Guardar el primer dígito
      setMonth('');
      setYear('');
        setActiveSegment('day');
      setHasClearedInThisSession(true);
      clearedInSessionRef.current = true; // Marcar en el ref también
      console.log('SmartDateInput - Estado actualizado después del primer dígito:', { digit, newDay: digit, newMonth: '', newYear: '', newActiveSegment: 'day' });
      return; // Salir aquí para el primer dígito en modo sobrescribir
    }
    
    // Si no hay segmento activo, empezar con día, pero NO perder el contenido previo si ya limpiamos en overwrite
    if (!activeSegment) {
      console.log('SmartDateInput - Activando día automáticamente, modo:', mode);
        setIsEditing(true);
        setActiveSegment('day');
      setDay(prev => {
        // Si ya limpiamos en esta sesión (overwrite) y existe contenido parcial, continuar agregando
        if (mode === 'overwrite' && clearedInSessionRef.current && prev.length > 0 && prev.length < 2) {
          console.log('SmartDateInput - Continuando agregando al día existente:', prev + digit);
          return prev + digit;
        }
        // En otros casos, iniciar con el dígito actual
        console.log('SmartDateInput - Iniciando nuevo día:', digit);
        return digit;
      });
    } else {
      switch (activeSegment) {
        case 'day':
          console.log('SmartDateInput - Procesando dígito en segmento día:', { digit, currentDay: day, dayLength: day.length });
          // Solo permitir máximo 2 dígitos en día
          if (day.length < 2) {
            const newDay = day + digit;
            setDay(newDay);
            console.log('SmartDateInput - Día actualizado:', { oldDay: day, newDay, newDayLength: newDay.length });
            // Si tiene 2 dígitos, avanzar automáticamente al mes
            if (newDay.length === 2) {
              console.log('SmartDateInput - Avanzando al mes automáticamente');
              setActiveSegment('month');
            }
          } else {
            console.log('SmartDateInput - Día ya tiene 2 dígitos, no acepta más');
          }
          break;
          
        case 'month':
          // Solo permitir máximo 2 dígitos en mes
          if (month.length < 2) {
            const newMonth = month + digit;
            setMonth(newMonth);
            console.log('SmartDateInput - Mes actualizado:', newMonth);
            // Si tiene 2 dígitos, avanzar automáticamente al año
            if (newMonth.length === 2) {
              console.log('SmartDateInput - Avanzando al año automáticamente');
              setActiveSegment('year');
            }
          } else {
            console.log('SmartDateInput - Mes ya tiene 2 dígitos, no acepta más');
          }
          break;
          
        case 'year':
          // Solo permitir máximo 4 dígitos en año
          if (year.length < 4) {
            const newYear = year + digit;
            setYear(newYear);
            console.log('SmartDateInput - Año actualizado:', newYear);
            // Si tiene 4 dígitos, cerrar automáticamente
            if (newYear.length === 4) {
              console.log('SmartDateInput - Año completo, cerrando edición');
              setIsEditing(false);
              setActiveSegment(null);
              inputRef.current?.blur();
            }
          } else {
            console.log('SmartDateInput - Año ya tiene 4 dígitos, no acepta más');
          }
          break;
      }
    }
  }, [activeSegment, day, month, year]);

  // Detectar cuando se inicia la edición externamente
  useEffect(() => {
    console.log('SmartDateInput - useEffect detectando edición externa:', { isEditing, mode, hasClearedInThisSession });
    if (isEditing && mode === 'overwrite' && !hasClearedInThisSession) {
      console.log('SmartDateInput - Edición externa detectada, preparando para sobrescribir');
      // NO resetear hasClearedInThisSession aquí, solo preparar el estado
      setActiveSegment(null);
    }
  }, [isEditing, mode, hasClearedInThisSession]);

  // Resetear el ref cuando se complete la edición o se cambie el valor
  useEffect(() => {
    if (!isEditing) {
      console.log('SmartDateInput - Edición completada, reseteando ref de sesión');
      clearedInSessionRef.current = false;
      setHasClearedInThisSession(false);
    }
  }, [isEditing]);

  // Exponer la función para que el componente padre pueda llamarla
  useImperativeHandle(ref, () => ({
    handleDigitInput,
    focus: () => {
      console.log('SmartDateInput - focus llamado externamente');
      inputRef.current?.focus();
    }
  }), [handleDigitInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    const { key } = e;
    console.log('SmartDateInput - handleKeyDown:', { key, activeSegment, isEditing });

    // Solo manejar teclas relevantes
    if (key === 'Enter' || key === 'Tab' || key === 'ArrowRight' || key === 'ArrowLeft') {
      e.preventDefault();
      
      if (key === 'Enter' || key === 'Tab' || key === 'ArrowRight') {
        // Avanzar al siguiente segmento
        switch (activeSegment) {
          case 'day':
            setActiveSegment('month');
            break;
          case 'month':
            setActiveSegment('year');
            break;
          case 'year':
            // Si estamos en el año, cerrar edición
            setIsEditing(false);
            setActiveSegment(null);
            inputRef.current?.blur();
            break;
        }
      } else if (key === 'ArrowLeft') {
        // Retroceder al segmento anterior
        switch (activeSegment) {
          case 'year':
            setActiveSegment('month');
            break;
          case 'month':
            setActiveSegment('day');
            break;
          case 'day':
            // Si estamos en el día, no hacer nada
            break;
        }
      }
    } else if (key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setActiveSegment(null);
      inputRef.current?.blur();
    } else if (key === 'Backspace') {
      // Manejar borrado
      e.preventDefault();
      
      if (!activeSegment) {
        // Si no hay segmento activo, empezar con año y borrar
        setActiveSegment('year');
        setYear(year.slice(0, -1));
      } else {
      switch (activeSegment) {
        case 'day':
            if (day.length > 0) {
              setDay(day.slice(0, -1));
          } else {
              // Si día está vacío, ir al segmento anterior (no hay anterior, quedarse)
          }
          break;
        case 'month':
            if (month.length > 0) {
              setMonth(month.slice(0, -1));
          } else {
              // Si mes está vacío, ir al día
              setActiveSegment('day');
          }
          break;
        case 'year':
            if (year.length > 0) {
              setYear(year.slice(0, -1));
            } else {
              // Si año está vacío, ir al mes
              setActiveSegment('month');
            }
            break;
        }
      }
    } else if (key.length === 1 && /[0-9]/.test(key)) {
      // Solo números
      e.preventDefault();
      handleDigitInput(key);
    }
  }, [activeSegment, day, month, year, disabled, handleDigitInput]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    console.log('SmartDateInput - handleFocus:', { isEditing, activeSegment, mode });
    // setIsFocused(true);
    
    // NO resetear el estado aquí - esto está causando problemas
    // Solo enfocar, no cambiar el estado interno
    
    onFocus?.(e);
  }, [onFocus, isEditing, activeSegment, mode]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Deferir para detectar blurs transitorios causados por re-render
    setTimeout(() => {
      const regainedFocus = inputRef.current === document.activeElement;
      if (regainedFocus) {
        // Ignorar blur si el input recuperó el foco inmediatamente
        return;
      }
    // setIsFocused(false);
    setIsEditing(false);
      setActiveSegment(null);
      setHasClearedInThisSession(false);
    onBlur?.(e);
    }, 0);
  }, [onBlur]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      console.log('SmartDateInput - handleClick:', { isEditing, activeSegment, mode });
      
      // Resetear el estado de limpieza para una nueva sesión
      setHasClearedInThisSession(false);
      
      // Solo enfocar el input, no activar edición ni segmentos
      // Esto permite que el primer click solo seleccione la celda
      inputRef.current?.focus();
      
      // NO activar ningún segmento aquí - esto se hará en el doble click
      // o cuando el usuario empiece a escribir (type-to-edit)
    }
  }, [disabled, isEditing, activeSegment, mode]);

  // El doble click se maneja mediante onClick de cada segmento (sin función separada)

  // Determinar qué mostrar en el input
  const getDisplayValue = () => {
    if (day && month && year) {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return '';
  };

  return (
    <div className="relative w-full">
      {/* Input principal (invisible) */}
      <input
        ref={inputRef}
        type="text"
        value={getDisplayValue()}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${className}`}
        style={{ color: 'transparent' }}
      />
      
      {/* Overlay visual para mostrar los segmentos */}
      <div className="absolute inset-0 flex items-center">
        <div className="flex w-full px-1">
          {/* Día */}
          <div 
            className={`flex-1 text-center text-xs cursor-pointer ${
              isEditing && activeSegment === 'day' 
                ? 'bg-blue-100 text-blue-800 font-semibold' 
                : 'text-gray-700'
            }`}
            onClick={() => {
              if (!disabled) {
                inputRef.current?.focus();
                setIsEditing(true);
                setActiveSegment('day');
              }
            }}
          >
            {day ? day.padStart(2, '0') : 'dd'}
          </div>
          <div className="text-gray-400 text-xs">/</div>
          
          {/* Mes */}
          <div 
            className={`flex-1 text-center text-xs cursor-pointer ${
              isEditing && activeSegment === 'month' 
                ? 'bg-blue-100 text-blue-800 font-semibold' 
                : 'text-gray-700'
            }`}
            onClick={() => {
              if (!disabled) {
                inputRef.current?.focus();
                setIsEditing(true);
                setActiveSegment('month');
              }
            }}
          >
            {month ? month.padStart(2, '0') : 'mm'}
          </div>
          <div className="text-gray-400 text-xs">/</div>
          
          {/* Año */}
          <div 
            className={`flex-1 text-center text-xs cursor-pointer ${
              isEditing && activeSegment === 'year' 
                ? 'bg-blue-100 text-blue-800 font-semibold' 
                : 'text-gray-700'
            }`}
            onClick={() => {
              if (!disabled) {
                inputRef.current?.focus();
                setIsEditing(true);
                setActiveSegment('year');
              }
            }}
          >
            {year || 'aaaa'}
          </div>
        </div>
      </div>
    </div>
  );
});

SmartDateInput.displayName = 'SmartDateInput';

export default SmartDateInput;
