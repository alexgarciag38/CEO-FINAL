import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-white">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      {children}
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}

export const ProcessNode: React.FC<NodeProps<any>> = ({ data }) => {
  const nombre = data?.nombre || 'Proceso';
  const tc = Math.round(Number(data?.tiempo_ciclo_seg ?? 0));
  const wip = Number(data?.inventario_piezas ?? 0);
  return (
    <Container>
      <div className="px-3 py-2 rounded border border-gray-400 bg-white shadow-sm min-w-[160px]">
        <div className="text-xs font-semibold text-gray-900">{nombre}</div>
        <div className="text-[10px] text-gray-600">TC: {tc}s · WIP: {wip}</div>
      </div>
    </Container>
  );
};

export const InventoryNode: React.FC<NodeProps<any>> = ({ data }) => {
  const cantidad = Number(data?.cantidad ?? 0);
  const unidad = data?.unidad || '';
  const esperaDias = Number(data?.espera_dias ?? 0);
  return (
    <Container>
      <div className="flex items-center justify-center">
        <svg width="120" height="60" viewBox="0 0 120 60" className="text-gray-700">
          <polygon points="60,52 10,10 110,10" fill="#FFF7ED" stroke="#9CA3AF" strokeWidth="2" />
        </svg>
      </div>
      <div className="-mt-6 text-[10px] text-gray-700 text-center">
        Inv: {cantidad} {unidad} · Espera: {esperaDias}d
      </div>
    </Container>
  );
};

export const SupplierNode: React.FC<NodeProps<any>> = ({ data }) => {
  const nombre = data?.nombre || 'Proveedor';
  return (
    <Container>
      <div className="px-3 py-2 rounded border border-gray-400 bg-white shadow-sm min-w-[140px] flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-gray-600" />
        <div className="text-xs font-semibold text-gray-900">{nombre}</div>
      </div>
    </Container>
  );
};

export const CustomerNode: React.FC<NodeProps<any>> = ({ data }) => {
  const nombre = data?.nombre || 'Cliente';
  return (
    <Container>
      <div className="px-3 py-2 rounded border border-gray-400 bg-white shadow-sm min-w-[140px] flex items-center gap-2">
        <div className="text-xs font-semibold text-gray-900">{nombre}</div>
        <div className="w-5 h-5 border-2 border-gray-600" />
      </div>
    </Container>
  );
};

export const TransportNode: React.FC<NodeProps<any>> = () => {
  return (
    <Container>
      <div className="px-2 py-2 rounded border border-gray-400 bg-white shadow-sm min-w-[120px] flex items-center gap-2 justify-center">
        <svg width="28" height="20" viewBox="0 0 32 24" className="text-gray-700">
          <rect x="4" y="8" width="12" height="8" fill="none" stroke="#374151" strokeWidth="2" />
          <rect x="16" y="10" width="8" height="6" fill="none" stroke="#374151" strokeWidth="2" />
          <circle cx="10" cy="18" r="2" fill="#374151" />
          <circle cx="20" cy="18" r="2" fill="#374151" />
        </svg>
        <span className="text-[10px] text-gray-700">Transporte</span>
      </div>
    </Container>
  );
};

export const InfoFlowNode: React.FC<NodeProps<any>> = () => {
  return (
    <Container>
      <div className="px-2 py-2 rounded border border-dashed border-gray-400 bg-white shadow-sm min-w-[120px] flex items-center gap-2 justify-center">
        <svg width="32" height="20" viewBox="0 0 32 24" className="text-gray-700">
          <path d="M2 12 Q8 4, 16 12 T30 12" stroke="#374151" strokeWidth="2" strokeDasharray="4 3" fill="none" />
          <path d="M28 10 L32 12 L28 14 Z" fill="#374151" />
        </svg>
        <span className="text-[10px] text-gray-700">Info</span>
      </div>
    </Container>
  );
};

export const DataBoxNode: React.FC<NodeProps<any>> = ({ data }) => {
  const titulo = data?.titulo || 'Datos';
  return (
    <Container>
      <div className="px-2 py-2 rounded border border-gray-400 bg-white shadow-sm min-w-[100px] text-center">
        <div className="mx-auto w-4 h-4 border-2 border-gray-600 mb-1" />
        <div className="text-[10px] text-gray-700">{titulo}</div>
      </div>
    </Container>
  );
};

export const VSM_NODE_TYPES = {
  process: ProcessNode,
  inventory: InventoryNode,
  supplier: SupplierNode,
  customer: CustomerNode,
  transport: TransportNode,
  info_flow: InfoFlowNode,
  info_flow_manual: InfoFlowNode,
  info_flow_electronic: InfoFlowNode,
  data_box: DataBoxNode,
  kaizen_burst: DataBoxNode,
};


