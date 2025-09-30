import React, { useState, useRef, useEffect } from 'react';
import { formatDateForInput, formatDateForTextInput, isValidDate, applyDateMask } from '@/utils/dateUtils';

interface HybridDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const HybridDateInput: React.FC<HybridDateInputProps> = ({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className = "",
  onFocus,
  onBlur,
  disabled = false
}) => {
  const [textValue, setTextValue] = useState('');
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convertir valor inicial para mostrar en modo texto
  useEffect(() => {
    setTextValue(formatDateForTextInput(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Aplicar máscara automática
    const maskedValue = applyDateMask(inputValue);
    setTextValue(maskedValue);
    setHasError(false);

    // Si el usuario ha escrito una fecha completa (10 caracteres), validar y convertir
    if (maskedValue.length === 10) {
      if (isValidDate(maskedValue)) {
        const dateValue = formatDateForInput(maskedValue);
        onChange(dateValue);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } else if (maskedValue.length < 10 && maskedValue.length > 0) {
      // Si no está completa pero tiene contenido, mantener el valor parcial
      // No limpiar el valor hasta que esté completo
    } else if (maskedValue.length === 0) {
      // Solo limpiar si está completamente vacío
      onChange('');
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Si hay error, revertir al valor anterior
    if (hasError) {
      setTextValue(formatDateForTextInput(value));
      setHasError(false);
    }
    
    // Si no está completa pero no hay error, mantener lo que se escribió
    if (!hasError && textValue.length < 10 && textValue.length > 0) {
      // Permitir fechas parciales si son válidas
      if (isValidDate(textValue)) {
        const dateValue = formatDateForInput(textValue);
        onChange(dateValue);
      } else {
        setTextValue(formatDateForTextInput(value));
      }
    }
    
    onBlur?.(e);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e);
  };

  return (
    <div className="relative w-full">
      {/* Input de texto principal */}
      <input
        ref={inputRef}
        type="text"
        value={textValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-1 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
          hasError 
            ? 'border-red-500 bg-red-50' 
            : 'border-gray-300'
        } ${className}`}
        maxLength={10}
        data-cell-input="true"
      />
      
      {/* Input de fecha oculto para funcionalidad del calendario */}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
          }
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ zIndex: 1 }}
        title="Haz clic para usar el calendario"
      />
    </div>
  );
};

export default HybridDateInput;
