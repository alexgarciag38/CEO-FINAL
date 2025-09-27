import React from 'react';

interface MovimientoCardProps {
  movimiento: {
    id: string;
    tipo: 'Ingreso' | 'Egreso';
    monto: number;
    proveedor_cliente?: string;
    descripcion?: string;
    categoria?: { nombre: string; color?: string | null };
    subcategoria?: { nombre: string };
    fecha_programada?: string;
    forma_pago?: string;
    fiscal?: boolean;
    notas?: string;
    estado: string;
    origen?: 'unico' | 'recurrente';
    created_at: string;
  };
  onEditar: (movimiento: any) => void;
  onCompletar: (id: string) => void;
  onEliminar: (id: string) => void;
}

const MovimientoCard: React.FC<MovimientoCardProps> = ({
  movimiento,
  onEditar,
  onCompletar,
  onEliminar
}) => {
  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    const diffTime = fechaObj.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Vencido hace ${Math.abs(diffDays)} días`;
    } else if (diffDays === 0) {
      return 'Vence hoy';
    } else if (diffDays <= 7) {
      return `Vence en ${diffDays} días`;
    } else {
      return fechaObj.toLocaleDateString('es-MX', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const getUrgenciaColor = (fecha: string) => {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    const diffTime = fechaObj.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'border-red-500'; // Vencido
    } else if (diffDays <= 7) {
      return 'border-orange-500'; // Próximos 7 días
    } else {
      return 'border-gray-300'; // Neutro
    }
  };

  const getUrgenciaIcon = (fecha: string) => {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    const diffTime = fechaObj.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return '🔴'; // Vencido
    } else if (diffDays <= 7) {
      return '🟠'; // Próximos 7 días
    } else {
      return '⚪'; // Neutro
    }
  };

  const esVencido = () => {
    const fechaObj = new Date(movimiento.fecha_programada || '');
    const hoy = new Date();
    return fechaObj.getTime() < hoy.getTime();
  };

  const categoriaColor = movimiento.categoria?.color || undefined;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow`} style={{ borderLeft: `4px solid ${categoriaColor || '#E5E7EB'}` }}>
      {/* Header con urgencia y tipo */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getUrgenciaIcon(movimiento.fecha_programada || '')}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            movimiento.tipo === 'Ingreso' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {movimiento.tipo}
          </span>
          {movimiento.fiscal && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Fiscal
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {formatearMoneda(movimiento.monto)}
          </div>
          <div className="text-sm text-gray-500">
            {movimiento.fecha_programada && formatearFecha(movimiento.fecha_programada)}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {movimiento.proveedor_cliente || 'Sin proveedor/cliente'}
        </h3>
        {movimiento.descripcion && (
          <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
            {movimiento.origen === 'recurrente' ? (
              <span className="text-blue-500" title="Movimiento Recurrente">🔄</span>
            ) : (
              <span className="text-yellow-500" title="Movimiento Único">⚡</span>
            )}
            {movimiento.descripcion}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
          {movimiento.categoria && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {movimiento.categoria.nombre}
            </span>
          )}
          {movimiento.subcategoria && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {movimiento.subcategoria.nombre}
            </span>
          )}
          {movimiento.forma_pago && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {movimiento.forma_pago}
            </span>
          )}
        </div>
      </div>

      {/* Notas si existen */}
      {movimiento.notas && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 italic">"{movimiento.notas}"</p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-400">
          Creado: {new Date(movimiento.created_at).toLocaleDateString('es-MX')}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCompletar(movimiento.id)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            {movimiento.tipo === 'Ingreso' ? 'Marcar como Cobrado' : 'Marcar como Pagado'}
          </button>
          
          <button
            onClick={() => onEditar(movimiento)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={() => onEliminar(movimiento.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovimientoCard;




