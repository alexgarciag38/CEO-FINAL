export interface VSMProcess {
  id: string;
  nombre: string;
  tiempo_ciclo_seg: number;
  tiempo_cambio_seg: number;
  num_operarios: number;
  inventario_piezas: number;
  tasa_scrap: number; // 0..1
}

export interface VSMData {
  projectId?: string;
  nombre: string;
  procesos: VSMProcess[];
  demanda_cliente_unidades_mes: number;
  kpis?: {
    total_process_time_seg: number;
    total_lead_time_seg: number;
    process_cycle_efficiency_pct: number;
    takt_time_seg: number;
  };
}


