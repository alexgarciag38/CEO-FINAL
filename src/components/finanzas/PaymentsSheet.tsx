import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CustomSelect } from '../ui/CustomSelect';

type Tipo = 'Ingreso' | 'Egreso' | 'Transferencia';
type FormaPago = 'Efectivo' | 'Transferencia' | 'Cheque' | 'Tarjeta';
type Frecuencia = 'Único' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual';

interface Option { id: string; nombre: string; categoria_id?: string; color?: string }

interface RowDraft {
  tipo: Tipo | '';
  categoria_id: string;
  subcategoria_id: string;
  fiscal: 'Sí' | 'No';
  descripcion: string;
  proveedor_id: string;
  forma_pago: FormaPago | '';
  monto: string; // keep as string for easy editing
  fecha_programada: string;
  frecuencia: Frecuencia;
  pagado: boolean;
  fecha_efectiva_pago: string;
  fecha_inicial_serie: string;
  notas: string;
}

const newEmptyRow = (): RowDraft => ({
  tipo: '',
  categoria_id: '',
  subcategoria_id: '',
  fiscal: 'No',
  descripcion: '',
  proveedor_id: '',
  forma_pago: '',
  monto: '',
  fecha_programada: '',
  frecuencia: 'Único',
  pagado: false,
  fecha_efectiva_pago: '',
  fecha_inicial_serie: '',
  notas: ''
});

export const PaymentsSheet: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const [rows, setRows] = useState<RowDraft[]>([newEmptyRow()]);
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [subcategorias, setSubcategorias] = useState<Option[]>([]);
  const [proveedores, setProveedores] = useState<Option[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ row: number; column: keyof RowDraft } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const startEditing = (rowIndex: number, columnName: keyof RowDraft, currentValue: any) => {
    setEditingCell({ row: rowIndex, column: columnName });
    setEditValue(currentValue);
  };

  const updateRow = (index: number, key: keyof RowDraft, value: any) => {
    setRows(prev => {
      const copy = [...prev];
      const current = { ...copy[index] };
      // reset dependent fields
      if (key === 'categoria_id') {
        current.subcategoria_id = '';
      }
      if (key === 'pagado' && !value) {
        current.fecha_efectiva_pago = '';
      }
      if (key === 'frecuencia' && value === 'Único') {
        current.fecha_inicial_serie = '';
      }
      (current as any)[key] = value;
      copy[index] = current;
      return copy;
    });
  };

  const saveEdit = () => {
    if (editingCell) {
      updateRow(editingCell.row, editingCell.column, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const renderEditableCell = (
    rowIndex: number,
    columnName: keyof RowDraft,
    value: any,
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox' = 'text',
    options: Array<{ value: string; label: string }> = []
  ) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.column === columnName;

    if (isEditing) {
      if (type === 'select') {
        return (
          <div className="w-full h-full">
            <CustomSelect
              value={editValue ?? ''}
              onChange={(value) => {
                setEditValue(value);
                // Auto-save on selection
                setTimeout(() => {
                  updateRow(rowIndex, columnName, value);
                  setEditingCell(null);
                  setEditValue('');
                }, 100);
              }}
              options={options}
              placeholder="-"
              className="h-full"
              renderSelected={(selected) => {
                if (!selected) return <span className="text-gray-500">-</span>;
                return (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-gray-300" 
                      style={{ backgroundColor: selected.color || '#6B7280' }}
                    />
                    <span className="text-sm">{selected.label}</span>
                  </div>
                );
              }}
            />
          </div>
        );
      }

      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            checked={!!editValue}
            onChange={(e) => setEditValue(e.target.checked)}
            onBlur={saveEdit}
            autoFocus
          />
        );
      }

      return (
        <input
          type={type}
          className="w-full h-full border-0 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={editValue ?? ''}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          autoFocus
        />
      );
    }

    const getDisplayValue = () => {
      if (type === 'checkbox') return value ? '✓' : '';
      if (type === 'select' && value) {
        const selectedOption = options.find(opt => opt.value === value);
        if (selectedOption) {
          return (
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border-2 border-gray-300" 
                style={{ backgroundColor: selectedOption.color || '#6B7280' }}
              />
              <span className="text-sm">{selectedOption.label}</span>
            </div>
          );
        }
      }
      return value || '-';
    };

    return (
      <div
        className="w-full h-full px-2 py-2 cursor-pointer hover:bg-blue-50 flex items-center"
        onClick={() => startEditing(rowIndex, columnName, value)}
      >
        {getDisplayValue()}
      </div>
    );
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [{ data: cats }, { data: subs }, { data: provs }] = await Promise.all([
          supabase.from('categorias_financieras').select('id,nombre,color').order('nombre', { ascending: true }),
          supabase.from('subcategorias_financieras').select('id,nombre,categoria_id,color').order('nombre', { ascending: true }),
          supabase.from('proveedores').select('id,nombre').order('nombre', { ascending: true })
        ]);
        setCategorias((cats || []) as any);
        setSubcategorias((subs || []) as any);
        setProveedores((provs || []) as any);
      } catch (e: any) {
        setError(e.message || 'Error cargando catálogos');
      }
    };
    loadOptions();
  }, []);

  const addNewRow = () => setRows(prev => [...prev, newEmptyRow()]);
  const clearAll = () => setRows([newEmptyRow()]);
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

  const validateRow = (r: RowDraft, idx: number): string[] => {
    const errs: string[] = [];
    if (!r.tipo) errs.push(`Fila ${idx + 1}: Tipo es requerido`);
    if (!r.categoria_id) errs.push(`Fila ${idx + 1}: Categoría es requerida`);
    if (!r.descripcion || r.descripcion.trim().length < 10) errs.push(`Fila ${idx + 1}: Descripción mínimo 10 caracteres`);
    const montoNum = Number(r.monto);
    if (!r.monto || isNaN(montoNum) || montoNum <= 0) errs.push(`Fila ${idx + 1}: Monto inválido`);
    if (!r.forma_pago) errs.push(`Fila ${idx + 1}: Forma de Pago es requerida`);
    if (!r.fecha_programada) errs.push(`Fila ${idx + 1}: Fecha Programada es requerida`);
    if (r.pagado && !r.fecha_efectiva_pago) errs.push(`Fila ${idx + 1}: Fecha Efectiva requerida si está pagado`);
    if (r.frecuencia !== 'Único' && !r.fecha_inicial_serie) errs.push(`Fila ${idx + 1}: Fecha Inicial Serie requerida para pagos recurrentes`);
    return errs;
  };

  const saveAllRows = async () => {
    setSaving(true);
    setError(null);
    try {
      const allErrors = rows.flatMap((r, idx) => validateRow(r, idx));
      if (allErrors.length > 0) {
        setError(allErrors.join('\n'));
        setSaving(false);
        return;
      }
      const payloads = rows.map(r => ({
        tipo: r.tipo,
        categoria_id: r.categoria_id || null,
        subcategoria_id: r.subcategoria_id || null,
        fiscal: r.fiscal === 'Sí',
        descripcion: r.descripcion.trim(),
        proveedor_id: r.proveedor_id || null,
        forma_pago: r.forma_pago,
        monto: Number(r.monto),
        fecha_programada: r.fecha_programada,
        frecuencia: r.frecuencia,
        pagado: r.pagado,
        fecha_efectiva_pago: r.pagado ? r.fecha_efectiva_pago || null : null,
        fecha_inicial_serie: r.frecuencia !== 'Único' ? r.fecha_inicial_serie || null : null,
        notas: r.notas || null
      }));

      const { error } = await supabase.from('financial_payments').insert(payloads);
      if (error) throw error;
      if (onSaved) onSaved();
      setRows([newEmptyRow()]);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const subOptionsByCat = useMemo(() => {
    const map = new Map<string, Option[]>();
    for (const s of subcategorias) {
      const key = s.categoria_id || '';
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [subcategorias]);

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border-b border-red-200 whitespace-pre-wrap">{error}</div>
      )}
      <table className="min-w-full table-auto">
        <thead className="bg-blue-600 text-white sticky top-0 z-10">
          <tr>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">TIPO</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Categoría</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Subcategoría</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">FISCAL</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Descripción</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Proveedor</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Forma de Pago</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Monto</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Fecha Programada</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Frecuencia</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">¿Pagado?</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Fecha Efectiva Pago</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider border-r border-blue-500">Fecha Inicial Serie</th>
            <th className="px-2 py-3 text-xs font-medium uppercase tracking-wider">Notas</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'tipo', row.tipo, 'select', [
                  { value: 'Ingreso', label: 'Ingreso' },
                  { value: 'Egreso', label: 'Egreso' },
                  { value: 'Transferencia', label: 'Transferencia' },
                ])}
              </td>
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'categoria_id', row.categoria_id, 'select', [
                  ...categorias.map(c => ({ value: c.id, label: c.nombre, color: c.color }))
                ])}
              </td>
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'subcategoria_id', row.subcategoria_id, 'select', [
                  ...((subOptionsByCat.get(row.categoria_id) || []).map(s => ({ value: s.id, label: s.nombre, color: s.color })))
                ])}
              </td>
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'fiscal', row.fiscal, 'select', [
                  { value: 'No', label: 'No' },
                  { value: 'Sí', label: 'Sí' },
                ])}
              </td>
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'descripcion', row.descripcion, 'text')}
              </td>
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'proveedor_id', row.proveedor_id, 'select', [
                  ...proveedores.map(p => ({ value: p.id, label: p.nombre }))
                ])}
              </td>
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'forma_pago', row.forma_pago, 'select', [
                  { value: 'Efectivo', label: 'Efectivo' },
                  { value: 'Transferencia', label: 'Transferencia' },
                  { value: 'Cheque', label: 'Cheque' },
                  { value: 'Tarjeta', label: 'Tarjeta' },
                ])}
              </td>
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'monto', row.monto, 'number')}
              </td>
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'fecha_programada', row.fecha_programada, 'date')}
              </td>
              <td className="border-r border-gray-200 h-10">
                {renderEditableCell(index, 'frecuencia', row.frecuencia, 'select', [
                  { value: 'Único', label: 'Único' },
                  { value: 'Semanal', label: 'Semanal' },
                  { value: 'Quincenal', label: 'Quincenal' },
                  { value: 'Mensual', label: 'Mensual' },
                  { value: 'Anual', label: 'Anual' },
                ])}
              </td>
              <td className="border-r border-gray-200 h-10 text-center">
                {renderEditableCell(index, 'pagado', row.pagado, 'checkbox')}
              </td>
              <td className="border-r border-gray-200 h-10">
                {row.pagado
                  ? renderEditableCell(index, 'fecha_efectiva_pago', row.fecha_efectiva_pago, 'date')
                  : <div className="px-2 py-2 text-gray-400">-</div>}
              </td>
              <td className="border-r border-gray-200 h-10">
                {row.frecuencia !== 'Único'
                  ? renderEditableCell(index, 'fecha_inicial_serie', row.fecha_inicial_serie, 'date')
                  : <div className="px-2 py-2 text-gray-400">-</div>}
              </td>
              <td className="h-10">
                <div className="flex items-center gap-2">
                  {renderEditableCell(index, 'notas', row.notas, 'text')}
                  <button type="button" className="text-xs text-red-600" onClick={() => removeRow(index)}>Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-4 bg-gray-50 border-t flex justify-between">
        <button onClick={addNewRow} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">+ Agregar Fila</button>
        <div className="space-x-2">
          <button onClick={saveAllRows} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {saving ? 'Guardando...' : 'Guardar Todo'}
          </button>
          <button onClick={clearAll} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Limpiar</button>
        </div>
      </div>
    </div>
  );
};