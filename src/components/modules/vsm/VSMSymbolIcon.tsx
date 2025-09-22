import React from 'react';

type IconProps = {
  type: 'process' | 'inventory' | 'supplier' | 'customer' | 'transport' | 'info_flow' | 'info_flow_manual' | 'info_flow_electronic' | 'data_box' | 'kaizen_burst';
  size?: number;
};

const VSMSymbolIcon: React.FC<IconProps> = ({ type, size = 28 }) => {
  const s = size;
  const stroke = 'currentColor';
  const strokeWidth = 2;

  switch (type) {
    case 'process':
      return <div style={{ width: s, height: Math.round(s * 0.7) }} className="border-2 rounded-sm border-current" />;
    case 'inventory':
      return (
        <svg width={s} height={Math.round(s * 0.8)} viewBox="0 0 32 24" className="text-gray-700">
          <polygon points="16,20 2,4 30,4" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'supplier':
      return (
        <svg width={s} height={Math.round(s * 0.8)} viewBox="0 0 32 24" className="text-gray-700">
          <rect x="4" y="4" width="18" height="12" fill="none" stroke={stroke} strokeWidth={strokeWidth} rx="2" />
          <path d="M22 10 H28" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M26 8 L30 10 L26 12 Z" fill="currentColor" />
        </svg>
      );
    case 'customer':
      return (
        <svg width={s} height={Math.round(s * 0.8)} viewBox="0 0 32 24" className="text-gray-700">
          <rect x="10" y="4" width="18" height="12" fill="none" stroke={stroke} strokeWidth={strokeWidth} rx="2" />
          <path d="M4 10 H10" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M6 8 L2 10 L6 12 Z" fill="currentColor" />
        </svg>
      );
    case 'transport':
      return (
        <svg width={s} height={Math.round(s * 0.8)} viewBox="0 0 32 24" className="text-gray-700">
          <rect x="4" y="8" width="12" height="8" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="16" y="10" width="8" height="6" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="10" cy="18" r="2" fill="currentColor" />
          <circle cx="20" cy="18" r="2" fill="currentColor" />
        </svg>
      );
    case 'info_flow':
      return (
        <svg width={s} height={Math.round(s * 0.8)} viewBox="0 0 32 24" className="text-gray-700">
          <path d="M2 12 Q8 4, 16 12 T30 12" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="4 3" fill="none" />
          <path d="M28 10 L32 12 L28 14 Z" fill="currentColor" />
        </svg>
      );
    case 'info_flow_manual':
      return (
        <svg width={s} height={Math.round(s * 0.8)} viewBox="0 0 64 24" className="text-gray-700">
          <path d="M2 12 Q12 2, 24 12 T46 12" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="4 3" fill="none" />
          <path d="M44 10 L48 12 L44 14 Z" fill="currentColor" />
          <text x="50" y="15" fontSize="8" fill="currentColor">Manual</text>
        </svg>
      );
    case 'info_flow_electronic':
      return (
        <svg width={s} height={Math.round(s * 0.8)} viewBox="0 0 72 24" className="text-gray-700">
          <path d="M2 12 Q12 2, 24 12 T46 12" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="2 2" fill="none" />
          <path d="M44 10 L48 12 L44 14 Z" fill="currentColor" />
          <text x="50" y="15" fontSize="8" fill="currentColor">Electrónico</text>
        </svg>
      );
    case 'data_box':
      return <div style={{ width: Math.round(s * 0.7), height: Math.round(s * 0.7) }} className="border-2 border-current" />;
    case 'kaizen_burst':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className="text-gray-700">
          <path d="M12 2 L14 8 L20 6 L16 12 L20 18 L14 16 L12 22 L10 16 L4 18 L8 12 L4 6 L10 8 Z" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    default:
      return null;
  }
};

export default VSMSymbolIcon;


