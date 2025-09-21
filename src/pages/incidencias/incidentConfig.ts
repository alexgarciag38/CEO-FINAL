export const STATUS_CONFIG = {
  PENDIENTE: {
    label: 'Pendiente',
    colorClasses: 'bg-orange-100 text-orange-800 border border-orange-200',
  },
  EN_PROGRESO: {
    label: 'En Progreso',
    colorClasses: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  RESUELTA: {
    label: 'Resuelta',
    colorClasses: 'bg-green-100 text-green-800 border border-green-200',
  },
  CERRADA: {
    label: 'Cerrada',
    colorClasses: 'bg-gray-100 text-gray-800 border border-gray-200',
  },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;

// Mapeos entre valores de DB y claves del config
export const DB_TO_STATUS_KEY: Record<string, StatusKey> = {
  open: 'PENDIENTE',
  in_progress: 'EN_PROGRESO',
  resolved: 'RESUELTA',
  closed: 'CERRADA',
};

export const STATUS_KEY_TO_DB: Record<StatusKey, 'open' | 'in_progress' | 'resolved' | 'closed'> = {
  PENDIENTE: 'open',
  EN_PROGRESO: 'in_progress',
  RESUELTA: 'resolved',
  CERRADA: 'closed',
};

export const STATUS_ORDER: StatusKey[] = ['PENDIENTE', 'EN_PROGRESO', 'RESUELTA', 'CERRADA'];

// Colores en HEX (para gráficos) alineados con los tonos de Tailwind usados arriba
export const STATUS_CHART_COLORS_HEX: Record<StatusKey, { fill: string; stroke: string }> = {
  PENDIENTE: { fill: '#FFEDD5', stroke: '#FDBA74' }, // orange-100 / orange-300
  EN_PROGRESO: { fill: '#DBEAFE', stroke: '#93C5FD' }, // blue-100 / blue-300
  RESUELTA: { fill: '#DCFCE7', stroke: '#86EFAC' }, // green-100 / green-300
  CERRADA: { fill: '#F3F4F6', stroke: '#D1D5DB' }, // gray-100 / gray-300
};

export function getStatusConfigByDb(dbValue: string) {
  const key = DB_TO_STATUS_KEY[dbValue] ?? 'PENDIENTE';
  return { key, ...STATUS_CONFIG[key] };
}

export function getStatusOptions() {
  return STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_CONFIG[key].label,
    dbValue: STATUS_KEY_TO_DB[key],
  }));
}

export const PRIORITY_LABELS: Record<'low'|'medium'|'high'|'critical', string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};


