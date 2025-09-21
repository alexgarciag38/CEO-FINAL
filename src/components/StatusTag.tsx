import React from 'react';
import { DB_TO_STATUS_KEY, STATUS_CONFIG, StatusKey, PRIORITY_CONFIG } from '@/config/incidentConfig';

type TagType = 'status' | 'priority' | 'type';

interface Props {
  type: TagType;
  value: string; // db value for status/priority, or label for type
  customColorHex?: string; // for type tags
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusTag: React.FC<Props> = ({ type, value, customColorHex, className, size = 'sm' }) => {
  const sizeClasses = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-1 text-xs';
  if (type === 'status') {
    const key = (DB_TO_STATUS_KEY[value] || 'PENDIENTE') as StatusKey;
    const cfg = STATUS_CONFIG[key];
    return <span className={`${sizeClasses} font-medium rounded-full ${cfg.colorClasses} ${className || ''}`.trim()}>{cfg.label}</span>;
  }
  if (type === 'priority') {
    const cfg = (PRIORITY_CONFIG as any)[value] || PRIORITY_CONFIG.medium;
    return <span className={`${sizeClasses} font-medium rounded-full ${cfg.colorClasses} ${className || ''}`.trim()}>{cfg.label}</span>;
  }
  // type tag
  const color = customColorHex || '#3B82F6';
  return (
    <span
      className={`${sizeClasses} font-medium rounded-full border ${className || ''}`.trim()}
      style={{ backgroundColor: color + '20', color, borderColor: color }}
    >{value}</span>
  );
};

export default StatusTag;


