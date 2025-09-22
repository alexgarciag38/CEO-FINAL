import React from 'react';
import VSMSymbolIcon from './VSMSymbolIcon';

type VSMSymbolProps = {
  type: 'process' | 'inventory' | 'supplier' | 'customer' | 'transport' | 'info_flow' | 'data_box';
  label: string;
  onClick?: () => void;
};

const baseClasses = "w-full bg-gray-100 rounded hover:bg-gray-200 cursor-pointer select-none border border-gray-200";

export const VSMSymbol: React.FC<VSMSymbolProps> = ({ type, label, onClick }) => {
  return (
    <div role="button" onClick={onClick} className={`${baseClasses} p-2 flex items-center gap-2`} aria-label={label}>
      <div className="w-8 h-8 flex items-center justify-center text-gray-700">
        <VSMSymbolIcon type={type} />
      </div>
      <div className="text-xs text-gray-800">{label}</div>
    </div>
  );
};

export default VSMSymbol;


