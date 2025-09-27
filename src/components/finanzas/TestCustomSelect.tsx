import React, { useState } from 'react';
import TableCustomSelect from '@/components/ui/TableCustomSelect';

// Componente de prueba para verificar la funcionalidad del CustomSelect
const TestCustomSelect: React.FC = () => {
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [subcategoriaId, setSubcategoriaId] = useState<string | null>(null);

  // Datos de prueba
  const categorias = [
    { id: '1', nombre: 'Alimentación', color: '#EF4444' },
    { id: '2', nombre: 'Transporte', color: '#3B82F6' },
    { id: '3', nombre: 'Servicios', color: '#10B981' },
    { id: '4', nombre: 'Entretenimiento', color: '#F59E0B' },
    { id: '5', nombre: 'Salud', color: '#8B5CF6' }
  ];

  const subcategorias = [
    { id: '1', nombre: 'Supermercado', color: '#EF4444', categoria_id: '1' },
    { id: '2', nombre: 'Restaurantes', color: '#EF4444', categoria_id: '1' },
    { id: '3', nombre: 'Gasolina', color: '#3B82F6', categoria_id: '2' },
    { id: '4', nombre: 'Transporte público', color: '#3B82F6', categoria_id: '2' },
    { id: '5', nombre: 'Internet', color: '#10B981', categoria_id: '3' },
    { id: '6', nombre: 'Luz', color: '#10B981', categoria_id: '3' },
    { id: '7', nombre: 'Cine', color: '#F59E0B', categoria_id: '4' },
    { id: '8', nombre: 'Streaming', color: '#F59E0B', categoria_id: '4' },
    { id: '9', nombre: 'Médico', color: '#8B5CF6', categoria_id: '5' },
    { id: '10', nombre: 'Farmacia', color: '#8B5CF6', categoria_id: '5' }
  ];

  const subcategoriasFiltradas = subcategorias.filter(
    sub => sub.categoria_id === categoriaId
  );

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Prueba de CustomSelect</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Categoría</label>
          <TableCustomSelect
            value={categoriaId}
            onChange={setCategoriaId}
            options={categorias.map(cat => ({
              value: cat.id,
              label: cat.nombre,
              color: cat.color
            }))}
            placeholder="Selecciona categoría"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subcategoría</label>
          <TableCustomSelect
            value={subcategoriaId}
            onChange={setSubcategoriaId}
            options={subcategoriasFiltradas.map(sub => ({
              value: sub.id,
              label: sub.nombre,
              color: sub.color
            }))}
            placeholder="Selecciona subcategoría"
            className="w-full"
            disabled={!categoriaId}
          />
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-medium mb-2">Valores seleccionados:</h3>
        <p>Categoría: {categoriaId ? categorias.find(c => c.id === categoriaId)?.nombre : 'Ninguna'}</p>
        <p>Subcategoría: {subcategoriaId ? subcategorias.find(s => s.id === subcategoriaId)?.nombre : 'Ninguna'}</p>
      </div>
    </div>
  );
};

export default TestCustomSelect;



