import React from 'react';
import tinycolor from 'tinycolor2';

interface ColorChipProps {
  label?: string;
  colorHex: string;
  variant?: 'default' | 'background-only';
  className?: string;
  textColor?: string;
}

const hexToPastel = (hex: string): string => {
  if (!hex || !tinycolor(hex).isValid()) {
    return '#E5E7EB';
  }
  return tinycolor(hex).lighten(30).saturate(10).toHexString();
};

const ColorChip: React.FC<ColorChipProps> = ({
  label = '',
  colorHex,
  variant = 'default',
  className = '',
  textColor = '#1F2937',
}) => {
  const pastelBg = hexToPastel(colorHex);

  if (variant === 'background-only') {
    return (
      <span
        className={`inline-block rounded-md ${className}`}
        style={{ backgroundColor: pastelBg }}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium max-w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${className}`}
      style={{ backgroundColor: pastelBg, color: textColor }}
      title={label}
    >
      <svg className="h-1.5 w-1.5" viewBox="0 0 6 6" aria-hidden="true" fill={colorHex}><circle cx={3} cy={3} r={3} /></svg>
      <span className="truncate min-w-0">{label}</span>
    </span>
  );
};

export default React.memo(ColorChip);

export { hexToPastel };


