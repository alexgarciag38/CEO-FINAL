import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FixedCustomSelect from '@/components/ui/FixedCustomSelect';

// Componente de prueba final para verificar que ambos selects funcionen
const TestSelectsFinal: React.FC = () => {
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
    console.log('✅ Categoría seleccionada:', value);
    setCategoriaId(value);
    setSubcategoriaId(null); // Reset subcategoría
  };

  const handleSubcategoriaChange = (value: string | null) => {
    console.log('✅ Subcategoría seleccionada:', value);
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800 mb-2">
          ✅ Prueba Final de Selects
        </h2>
        <p className="text-green-700 text-sm">
          Prueba que tanto categorías como subcategorías funcionen correctamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categorías */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Categorías</h3>
          <FixedCustomSelect
            value={categoriaId}
            onChange={handleCategoriaChange}
            options={categorias.map(cat => ({
              value: cat.id,
              label: cat.nombre,
              color: cat.color
            }))}
            placeholder="Selecciona categoría"
            className="w-full"
          />
        </div>

        {/* Subcategorías */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Subcategorías</h3>
          <FixedCustomSelect
            value={subcategoriaId}
            onChange={handleSubcategoriaChange}
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

      {/* Resultado */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Resultado:</h3>
        <p className="text-blue-700 text-sm">
          <strong>Categoría:</strong> {categoriaId ? categorias.find(c => c.id === categoriaId)?.nombre : 'Ninguna'}
        </p>
        <p className="text-blue-700 text-sm">
          <strong>Subcategoría:</strong> {subcategoriaId ? subcategorias.find(s => s.id === subcategoriaId)?.nombre : 'Ninguna'}
        </p>
        <p className="text-blue-700 text-sm">
          <strong>Subcategorías disponibles:</strong> {subcategoriasFiltradas.length}
        </p>
      </div>

      {/* Instrucciones */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Instrucciones de prueba:</h3>
        <ol className="text-yellow-700 text-sm space-y-1">
          <li>1. Selecciona una categoría</li>
          <li>2. Verifica que la subcategoría se habilite</li>
          <li>3. Selecciona una subcategoría</li>
          <li>4. Verifica que ambos valores se guarden</li>
          <li>5. Cambia de categoría y verifica que la subcategoría se resetee</li>
        </ol>
      </div>
    </div>
  );
};

export default TestSelectsFinal;



