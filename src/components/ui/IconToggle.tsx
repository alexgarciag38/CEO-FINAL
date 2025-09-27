import React from 'react';

interface IconToggleProps {
  value: string;
  options: {
    value: string;
    icon: React.ReactNode;
    label: string;
    color: string;
  }[];
  onChange: (value: string) => void;
  className?: string;
}

// Iconos SVG profesionales
const LightningIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LetterIIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 7.586V5a1 1 0 10-2 0v2.586l-.293-.293z" clipRule="evenodd" />
  </svg>
);

const LetterEIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

export const IconToggle: React.FC<IconToggleProps> = ({
  value,
  options,
  onChange,
  className = ''
}) => {
  const currentOption = options.find(opt => opt.value === value) || options[0];

  const handleClick = (e: React.MouseEvent) => {
    // COMPORTAMIENTO EXCEL: Un clic NO debe ejecutar la acción
    // Solo debe seleccionar la celda. La acción se ejecuta con doble clic o Enter
    e.preventDefault();
    e.stopPropagation();
    
    // NO ejecutar onChange automáticamente
    // El cambio se ejecutará desde el doble clic o Enter en la celda padre
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-8 h-8 rounded-full flex items-center justify-center
        transition-all duration-200 hover:scale-110
        ${currentOption.color}
        ${className}
      `}
      title={currentOption.label}
    >
      {currentOption.icon}
    </button>
  );
};

// Exportar iconos para uso en otros componentes
export { LightningIcon, RefreshIcon, LetterIIcon, LetterEIcon };

export default IconToggle;
