export interface VSMProcess {
  id: string;
  nombre: string;
  tiempo_ciclo_seg: number;
  tiempo_cambio_seg: number;
  num_operarios: number;
  inventario_piezas: number;
  tasa_scrap: number; // 0..1
}

export type TimeUnits = 'seconds' | 'minutes' | 'hours' | 'days';

export type VSMNodeType =
  | 'process'
  | 'inventory'
  | 'customer'
  | 'supplier'
  | 'transport'
  | 'info_flow'
  | 'info_flow_manual'
  | 'info_flow_electronic'
  | 'data_box'
  | 'kaizen_burst';

export interface VSMNodeBase {
  id: string;
  type: VSMNodeType;
  position?: { x: number; y: number };
  label?: string;
}

export interface VSMProcessNodeData {
  nombre: string;
  tiempo_ciclo_seg: number;
  tiempo_cambio_seg: number;
  num_operarios: number;
  inventario_piezas: number;
  tasa_scrap: number; // 0..1
  uptime_pct?: number; // 0..100
  first_pass_yield_pct?: number; // 0..100
}

export interface VSMInventoryNodeData {
  cantidad: number; // unidades en cola/inventario
  unidad?: string; // piezas, cajas, etc.
  espera_segundos?: number; // opcional si se especifica directo
  espera_dias?: number; // opcional si se especifica en días
}

export interface VSMEndpointNodeData {
  rol: 'customer' | 'supplier';
  nombre?: string;
}

export interface VSMTransportNodeData {
  descripcion?: string;
  tiempo_transporte_seg?: number;
  distancia_unidades?: number;
}

export interface VSMInfoFlowNodeData { descripcion?: string; }

export interface VSMDataBoxNodeData {
  titulo?: string;
}

export interface VSMKaizenBurstNodeData { titulo?: string; descripcion?: string; }

export type VSMNodeData =
  | ({ type: 'process' } & VSMProcessNodeData)
  | ({ type: 'inventory' } & VSMInventoryNodeData)
  | ({ type: 'customer' } & VSMEndpointNodeData)
  | ({ type: 'supplier' } & VSMEndpointNodeData)
  | ({ type: 'transport' } & VSMTransportNodeData)
  | ({ type: 'info_flow' } & VSMInfoFlowNodeData)
  | ({ type: 'info_flow_manual' } & VSMInfoFlowNodeData)
  | ({ type: 'info_flow_electronic' } & VSMInfoFlowNodeData)
  | ({ type: 'data_box' } & VSMDataBoxNodeData)
  | ({ type: 'kaizen_burst' } & VSMKaizenBurstNodeData);

export type VSMNode = VSMNodeBase & { data: VSMNodeData };

export interface VSMEdge {
  id?: string;
  source: string;
  target: string;
  flowType?: 'material' | 'information';
}

export interface VSMData {
  projectId?: string;
  nombre: string;
  // Compatibilidad hacia atrás
  procesos?: VSMProcess[];
  // Nuevo modelo basado en nodos
  nodes?: VSMNode[];
  edges?: VSMEdge[];
  demanda_cliente_unidades_mes: number;
  kpis?: {
    total_process_time_seg: number;
    total_lead_time_seg: number;
    process_cycle_efficiency_pct: number;
    takt_time_seg: number;
  };
}


