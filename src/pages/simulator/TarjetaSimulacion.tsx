import React from 'react';

export type TarjetaSimulacionProps = {
  item: {
    id: string;
    created_at: string;
    nombre_simulacion: string;
    product_name?: string | null;
    publication_price?: number | null;
    net_profit?: number | null;
    net_margin?: number | null;
  };
  onLoad: (id: string) => void;
  onDelete?: (id: string) => void;
};

const TarjetaSimulacion: React.FC<TarjetaSimulacionProps> = ({ item, onLoad, onDelete }) => {
  const profit = Number(item.net_profit ?? 0);
  const margin = Number(item.net_margin ?? 0);
  const profitCls = profit >= 0 ? 'text-green-600' : 'text-red-600';
  const date = new Date(item.created_at);
  const fecha = date.toLocaleDateString('es-MX');

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border border-gray-200 cursor-pointer" onClick={() => onLoad(item.id)}>
      <h3 className="text-base font-semibold text-gray-800">{item.nombre_simulacion}</h3>
      {item.product_name && (
        <div className="text-sm text-gray-600 mt-1">Producto: {item.product_name}</div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-600">Precio</div>
        <div className="text-right tabular-nums font-medium text-gray-800">${Number(item.publication_price ?? 0).toFixed(2)}</div>
        <div className="text-gray-600">Margen</div>
        <div className="text-right tabular-nums font-medium text-gray-800">{margin.toFixed(1)}%</div>
      </div>
      <div className={`mt-2 text-xl font-bold tabular-nums ${profitCls}`}>${profit.toFixed(2)}</div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Guardada: {fecha}</span>
        <div className="inline-flex gap-2">
          <button className="px-2 py-1 text-xs border border-blue-600 text-blue-600 rounded hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); onLoad(item.id); }}>Cargar</button>
          {onDelete && (
            <button className="px-2 py-1 text-xs border border-red-600 text-red-600 rounded hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>Eliminar</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TarjetaSimulacion;


