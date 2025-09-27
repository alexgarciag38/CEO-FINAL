import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import TableCustomSelect from '@/components/ui/TableCustomSelect';

// Componente de prueba para verificar la selección de categorías
const TestCategoriaSelection: React.FC = () => {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [subcategorias, setSubcategorias] = useState<any[]>([]);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [subcategoriaId, setSubcategoriaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategorias();
    loadSubcategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_financieras')
        .select('id, nombre, color, tipo')
        .order('nombre');

      if (error) throw error;
      setCategorias(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      setLoading(false);
    }
  };

  const loadSubcategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategorias_financieras')
        .select('id, nombre, color, categoria_id')
        .order('nombre');

      if (error) throw error;
      setSubcategorias(data || []);
    } catch (error) {
      console.error('Error cargando subcategorías:', error);
    }
  };

  const subcategoriasFiltradas = subcategorias.filter(
    sub => sub.categoria_id === categoriaId
  );

  const handleCategoriaChange = (value: string | null) => {
    console.log('Categoría seleccionada:', value);
    setCategoriaId(value);
    setSubcategoriaId(null); // Reset subcategoría
  };

  const handleSubcategoriaChange = (value: string | null) => {
    console.log('Subcategoría seleccionada:', value);
    setSubcategoriaId(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Cargando categorías...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          🧪 Prueba de Selección de Categorías
        </h2>
        <p className="text-blue-700 text-sm">
          Prueba la selección de categorías con fondo de color y debug de clics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categorías de Egreso */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Categorías de Egreso</h3>
          <div className="space-y-2">
            {categorias.filter(c => c.tipo === 'Egreso').map(categoria => (
              <div key={categoria.id} className="flex items-center gap-2">
                <TableCustomSelect
                  value={categoriaId}
                  onChange={handleCategoriaChange}
                  options={categorias.filter(c => c.tipo === 'Egreso').map(c => ({
                    value: c.id,
                    label: c.nombre,
                    color: c.color
                  }))}
                  placeholder="Selecciona categoría de egreso"
                  className="flex-1"
                />
                <div 
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: categoria.color }}
                />
                <span className="text-sm text-gray-600">{categoria.nombre}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categorías de Ingreso */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Categorías de Ingreso</h3>
          <div className="space-y-2">
            {categorias.filter(c => c.tipo === 'Ingreso').map(categoria => (
              <div key={categoria.id} className="flex items-center gap-2">
                <TableCustomSelect
                  value={categoriaId}
                  onChange={handleCategoriaChange}
                  options={categorias.filter(c => c.tipo === 'Ingreso').map(c => ({
                    value: c.id,
                    label: c.nombre,
                    color: c.color
                  }))}
                  placeholder="Selecciona categoría de ingreso"
                  className="flex-1"
                />
                <div 
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: categoria.color }}
                />
                <span className="text-sm text-gray-600">{categoria.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subcategorías */}
      {categoriaId && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Subcategorías</h3>
          <TableCustomSelect
            value={subcategoriaId}
            onChange={handleSubcategoriaChange}
            options={subcategoriasFiltradas.map(sub => ({
              value: sub.id,
              label: sub.nombre,
              color: sub.color
            }))}
            placeholder="Selecciona subcategoría"
            className="w-full max-w-md"
          />
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">Debug Info:</h3>
        <p className="text-sm text-gray-600">
          Categoría seleccionada: {categoriaId || 'Ninguna'}
        </p>
        <p className="text-sm text-gray-600">
          Subcategoría seleccionada: {subcategoriaId || 'Ninguna'}
        </p>
        <p className="text-sm text-gray-600">
          Total categorías: {categorias.length}
        </p>
        <p className="text-sm text-gray-600">
          Subcategorías filtradas: {subcategoriasFiltradas.length}
        </p>
      </div>
    </div>
  );
};

export default TestCategoriaSelection;



