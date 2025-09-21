export const STATUS_CONFIG = {
  PENDIENTE: { label: 'Pendiente', colorClasses: 'bg-orange-100 text-orange-800 border border-orange-200' },
  EN_PROGRESO: { label: 'En Progreso', colorClasses: 'bg-blue-100 text-blue-800 border border-blue-200' },
  RESUELTA: { label: 'Resuelta', colorClasses: 'bg-green-100 text-green-800 border border-green-200' },
  CERRADA: { label: 'Cerrada', colorClasses: 'bg-gray-100 text-gray-800 border border-gray-200' },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;

export const ALL_INCIDENT_STATUS: string[] = Object.keys(STATUS_CONFIG).map((k) => (STATUS_CONFIG as any)[k].label);

export const STATUS_ORDER: StatusKey[] = ['PENDIENTE','EN_PROGRESO','RESUELTA','CERRADA'];

export const DB_TO_STATUS_KEY: Record<string, StatusKey> = {
  open: 'PENDIENTE',
  in_progress: 'EN_PROGRESO',
  resolved: 'RESUELTA',
  closed: 'CERRADA',
};

export const STATUS_KEY_TO_DB: Record<StatusKey,'open'|'in_progress'|'resolved'|'closed'> = {
  PENDIENTE:'open', EN_PROGRESO:'in_progress', RESUELTA:'resolved', CERRADA:'closed'
};

export const STATUS_CHART_COLORS_HEX: Record<StatusKey, { fill: string; stroke: string }> = {
  PENDIENTE:{ fill:'#FFEDD5', stroke:'#FDBA74' },
  EN_PROGRESO:{ fill:'#DBEAFE', stroke:'#93C5FD' },
  RESUELTA:{ fill:'#DCFCE7', stroke:'#86EFAC' },
  CERRADA:{ fill:'#F3F4F6', stroke:'#D1D5DB' },
};

export const PRIORITY_LABELS: Record<'low'|'medium'|'high'|'critical', string> = {
  low:'Baja', medium:'Media', high:'Alta', critical:'Crítica'
};

export const PRIORITY_HEX: Record<'low'|'medium'|'high'|'critical', { fill: string; stroke: string }> = {
  low: { fill: '#DCFCE7', stroke: '#86EFAC' },      // green-100 / green-300
  medium: { fill: '#DBEAFE', stroke: '#93C5FD' },   // blue-100 / blue-300
  high: { fill: '#FFEDD5', stroke: '#FDBA74' },     // orange-100 / orange-300
  critical: { fill: '#FEE2E2', stroke: '#FCA5A5' }, // red-100 / red-300
};

export const PRIORITY_CONFIG = {
  low: { label: 'Baja',   colorClasses: 'bg-green-100 text-green-800 border border-green-200' },
  medium: { label: 'Media',  colorClasses: 'bg-blue-100 text-blue-800 border border-blue-200' },
  high: { label: 'Alta',   colorClasses: 'bg-orange-100 text-orange-800 border border-orange-200' },
  critical: { label: 'Crítica', colorClasses: 'bg-red-100 text-red-800 border border-red-200' }
} as const;

// Note: Keep single export name to avoid duplication conflicts
export const ALL_INCIDENT_PRIORITIES: string[] = Object.values(PRIORITY_CONFIG).map((p) => p.label);

export function getStatusOptions() {
  return STATUS_ORDER.map(k => ({ key: k, label: STATUS_CONFIG[k].label, dbValue: STATUS_KEY_TO_DB[k] }));
}


