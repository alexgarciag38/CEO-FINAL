import React from 'react';
import IconToggle from '@/components/ui/IconToggle';
import TableCustomSelect from '@/components/ui/TableCustomSelect';
import SimpleCustomSelect from '@/components/ui/SimpleCustomSelect';
import FixedCustomSelect from '@/components/ui/FixedCustomSelect';
import UltraSimpleSelect from '@/components/ui/UltraSimpleSelect';
import OverlaySelect from '@/components/ui/OverlaySelect';
import WorkingSelect from '@/components/ui/WorkingSelect';
import RecurrencePickerPopover from './RecurrencePickerPopover';
import { LightningIcon, RefreshIcon, LetterIIcon, LetterEIcon, PencilIcon, TrashIcon } from '@/components/ui/ProfessionalIcons';

interface MovimientoRapido {
  id: string;
  modo: 'Unico' | 'Recurrente';
  tipo: 'Ingreso' | 'Egreso';
  categoriaId: string;
  subcategoriaId: string;
  proveedor_cliente: string;
  descripcion: string;
  monto: number;
  fecha_movimiento: string;
  fecha_programada: string;
  fecha_inicio: string;
  frecuencia: 'mensual' | 'semanal' | 'quincenal' | 'anual';
  dia_especifico: number;
  dia_semana: string;
  fecha_fin: string;
  numero_repeticiones: number;
  estado: 'Pendiente' | 'Completado' | 'Cancelado';
  estado_regla: 'Activa' | 'Pausada' | 'Inactiva';
  fecha_efectiva: string;
  es_fiscal: boolean;
  origen: 'unico' | 'recurrente';
}

interface TableRowProps {
  movimiento: MovimientoRapido;
  categorias: Array<{ id: string; nombre: string; color: string }>;
  subcategorias: Array<{ id: string; nombre: string; color: string; categoria_id: string }>;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  movimiento,
  categorias,
  subcategorias,
  onUpdate,
  onDelete,
  onEdit
}) => {
  // Opciones para el toggle de MODO
  const modoOptions = [
    {
      value: 'Unico',
      icon: <LightningIcon />,
      label: 'Movimiento Único',
      color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
    },
    {
      value: 'Recurrente',
      icon: <RefreshIcon />,
      label: 'Regla Recurrente',
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
    }
  ];

  // Opciones para el toggle de TIPO
  const tipoOptions = [
    {
      value: 'Ingreso',
      icon: <LetterIIcon />,
      label: 'Ingreso',
      color: 'bg-green-100 hover:bg-green-200 text-green-800'
    },
    {
      value: 'Egreso',
      icon: <LetterEIcon />,
      label: 'Egreso',
      color: 'bg-red-100 hover:bg-red-200 text-red-800'
    }
  ];

  // Subcategorías filtradas por categoría seleccionada
  const subcategoriasFiltradas = subcategorias.filter(
    sub => sub.categoria_id === movimiento.categoriaId
  );

  // Configuración de recurrencia para el popover
  const recurrenceConfig = {
    frecuencia: movimiento.frecuencia,
    dia_especifico: movimiento.dia_especifico,
    dia_semana: movimiento.dia_semana,
    fecha_inicio: movimiento.fecha_inicio,
    fecha_fin: movimiento.fecha_fin,
    numero_repeticiones: movimiento.numero_repeticiones,
    finalizacion: movimiento.fecha_fin ? 'fecha' : 
                 movimiento.numero_repeticiones ? 'repeticiones' : 'indefinido'
  };

  const handleRecurrenceChange = (config: any) => {
    onUpdate(movimiento.id, 'frecuencia', config.frecuencia);
    onUpdate(movimiento.id, 'dia_especifico', config.dia_especifico);
    onUpdate(movimiento.id, 'dia_semana', config.dia_semana);
    onUpdate(movimiento.id, 'fecha_inicio', config.fecha_inicio);
    onUpdate(movimiento.id, 'fecha_fin', config.fecha_fin);
    onUpdate(movimiento.id, 'numero_repeticiones', config.numero_repeticiones);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* COLUMNA 1: MODO (IconToggle) */}
      <td className="px-1 py-2 text-center">
        <IconToggle
          value={movimiento.modo}
          options={modoOptions}
          onChange={(value) => onUpdate(movimiento.id, 'modo', value)}
          className="mx-auto"
        />
      </td>

      {/* COLUMNA 2: TIPO (IconToggle I/E) */}
      <td className="px-1 py-2 text-center">
        <IconToggle
          value={movimiento.tipo}
          options={tipoOptions}
          onChange={(value) => onUpdate(movimiento.id, 'tipo', value)}
          className="mx-auto"
        />
      </td>

      {/* COLUMNA 3: CATEGORÍA (TableCustomSelect compacta) */}
      <td className="px-1 py-2">
        <WorkingSelect
          value={movimiento.categoriaId}
          onChange={(value) => {
            console.log('TableRow - Categoría onChange:', { movimientoId: movimiento.id, value, categorias: categorias.length });
            onUpdate(movimiento.id, 'categoriaId', value);
          }}
          options={categorias.map(cat => ({
            value: cat.id,
            label: cat.nombre,
            color: cat.color
          }))}
          placeholder="Categoría"
          className="w-full"
        />
      </td>

      {/* COLUMNA 4: SUBCATEGORÍA (WorkingSelect compacta) */}
      <td className="px-1 py-2">
        <WorkingSelect
          value={movimiento.subcategoriaId}
          onChange={(value) => {
            console.log('TableRow - Subcategoría onChange:', { movimientoId: movimiento.id, value, subcategorias: subcategoriasFiltradas.length });
            onUpdate(movimiento.id, 'subcategoriaId', value);
          }}
          options={subcategoriasFiltradas.map(sub => ({
            value: sub.id,
            label: sub.nombre,
            color: sub.color
          }))}
          placeholder="Subcat."
          className="w-full"
          disabled={!movimiento.categoriaId}
        />
      </td>

      {/* COLUMNA 5: PROVEEDOR/CLIENTE (TextInput con truncado) */}
      <td className="px-1 py-2">
        <input
          type="text"
          value={movimiento.proveedor_cliente}
          onChange={(e) => onUpdate(movimiento.id, 'proveedor_cliente', e.target.value)}
          className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent truncate"
          placeholder="Proveedor/Cliente"
          title={movimiento.proveedor_cliente}
        />
      </td>

      {/* COLUMNA 6: DESCRIPCIÓN (TextInput con truncado) */}
      <td className="px-1 py-2">
        <input
          type="text"
          value={movimiento.descripcion}
          onChange={(e) => onUpdate(movimiento.id, 'descripcion', e.target.value)}
          className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent truncate"
          placeholder="Descripción"
          title={movimiento.descripcion}
        />
      </td>

      {/* COLUMNA 7: MONTO (NumericInput compacta) */}
      <td className="px-1 py-2">
        <input
          type="number"
          value={movimiento.monto}
          onChange={(e) => onUpdate(movimiento.id, 'monto', parseFloat(e.target.value) || 0)}
          className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-right"
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </td>

      {/* COLUMNA 8: FECHA DE VENCIMIENTO (DatePicker compacta) */}
      <td className="px-1 py-2">
        {movimiento.modo === 'Unico' ? (
          <input
            type="date"
            value={movimiento.fecha_movimiento}
            onChange={(e) => onUpdate(movimiento.id, 'fecha_movimiento', e.target.value)}
            className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="Fecha vencimiento"
          />
        ) : (
          <input
            type="date"
            value={movimiento.fecha_inicio}
            onChange={(e) => onUpdate(movimiento.id, 'fecha_inicio', e.target.value)}
            className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="Fecha inicio"
          />
        )}
      </td>

      {/* COLUMNA 9: DETALLES DE RECURRENCIA (Contenido condicional - VACÍO para Único) */}
      <td className="px-1 py-2">
        {movimiento.modo === 'Unico' ? (
          <div className="w-full h-full"></div>
        ) : (
          <RecurrencePickerPopover
            value={recurrenceConfig}
            onChange={handleRecurrenceChange}
            className="w-full"
          />
        )}
      </td>

      {/* COLUMNA 10: ESTADO / FECHA EFECTIVA (Contenido condicional y compacto) */}
      <td className="px-1 py-2">
        {movimiento.modo === 'Unico' ? (
          <div className="flex flex-col space-y-1">
            <select
              value={movimiento.estado}
              onChange={(e) => onUpdate(movimiento.id, 'estado', e.target.value)}
              className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            {movimiento.estado === 'Completado' && (
              <input
                type="date"
                value={movimiento.fecha_efectiva}
                onChange={(e) => onUpdate(movimiento.id, 'fecha_efectiva', e.target.value)}
                className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Fecha efectiva"
              />
            )}
          </div>
        ) : (
          <select
            value={movimiento.estado_regla}
            onChange={(e) => onUpdate(movimiento.id, 'estado_regla', e.target.value)}
            className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Activa">Activa</option>
            <option value="Pausada">Pausada</option>
            <option value="Inactiva">Inactiva</option>
          </select>
        )}
      </td>

      {/* COLUMNA 11: FISCAL (Checkbox compacto) */}
      <td className="px-1 py-2 text-center">
        <input
          type="checkbox"
          checked={movimiento.es_fiscal}
          onChange={(e) => onUpdate(movimiento.id, 'es_fiscal', e.target.checked)}
          className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>

      {/* COLUMNA 12: ACCIONES (Iconos compactos) */}
      <td className="px-1 py-2 text-center">
        <div className="flex justify-center space-x-1">
          <button
            onClick={() => onEdit(movimiento.id)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Editar"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => onDelete(movimiento.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Eliminar"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TableRow;
