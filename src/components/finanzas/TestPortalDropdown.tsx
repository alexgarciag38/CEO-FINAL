import React, { useState } from 'react';
import TableCustomSelect from '@/components/ui/TableCustomSelect';

// Componente de prueba para verificar que el Portal funciona correctamente
const TestPortalDropdown: React.FC = () => {
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [subcategoriaId, setSubcategoriaId] = useState<string | null>(null);

  // Datos de prueba con muchas opciones para probar el scroll
  const categorias = [
    { id: '1', nombre: 'Alimentación y Bebidas', color: '#EF4444' },
    { id: '2', nombre: 'Transporte y Movilidad', color: '#3B82F6' },
    { id: '3', nombre: 'Servicios Públicos', color: '#10B981' },
    { id: '4', nombre: 'Entretenimiento y Ocio', color: '#F59E0B' },
    { id: '5', nombre: 'Salud y Bienestar', color: '#8B5CF6' },
    { id: '6', nombre: 'Educación y Formación', color: '#06B6D4' },
    { id: '7', nombre: 'Tecnología y Comunicaciones', color: '#84CC16' },
    { id: '8', nombre: 'Ropa y Accesorios', color: '#F97316' },
    { id: '9', nombre: 'Hogar y Decoración', color: '#EC4899' },
    { id: '10', nombre: 'Deportes y Fitness', color: '#6366F1' }
  ];

  const subcategorias = [
    { id: '1', nombre: 'Supermercado y Abarrotes', color: '#EF4444', categoria_id: '1' },
    { id: '2', nombre: 'Restaurantes y Comida Rápida', color: '#EF4444', categoria_id: '1' },
    { id: '3', nombre: 'Bebidas y Licores', color: '#EF4444', categoria_id: '1' },
    { id: '4', nombre: 'Gasolina y Combustibles', color: '#3B82F6', categoria_id: '2' },
    { id: '5', nombre: 'Transporte Público', color: '#3B82F6', categoria_id: '2' },
    { id: '6', nombre: 'Mantenimiento Vehicular', color: '#3B82F6', categoria_id: '2' },
    { id: '7', nombre: 'Internet y Telecomunicaciones', color: '#10B981', categoria_id: '3' },
    { id: '8', nombre: 'Luz y Electricidad', color: '#10B981', categoria_id: '3' },
    { id: '9', nombre: 'Agua y Servicios Básicos', color: '#10B981', categoria_id: '3' },
    { id: '10', nombre: 'Cine y Espectáculos', color: '#F59E0B', categoria_id: '4' },
    { id: '11', nombre: 'Streaming y Entretenimiento Digital', color: '#F59E0B', categoria_id: '4' },
    { id: '12', nombre: 'Videojuegos y Gaming', color: '#F59E0B', categoria_id: '4' }
  ];

  const subcategoriasFiltradas = subcategorias.filter(
    sub => sub.categoria_id === categoriaId
  );

  return (
    <div className="p-6 space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">
          🧪 Prueba de Portal Dropdown
        </h2>
        <p className="text-yellow-700 text-sm">
          Este componente prueba que el dropdown se renderice correctamente con Portal,
          sin recortarse por contenedores de la tabla.
        </p>
      </div>
      
      {/* Simular una tabla con scroll para probar el posicionamiento */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-4">
          <h3 className="font-medium">Simulación de Tabla con Scroll</h3>
          <p className="text-sm text-gray-600">Haz scroll hacia abajo y prueba los dropdowns</p>
        </div>
        
        {/* Contenido con altura para forzar scroll */}
        <div className="p-4 space-y-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Fila {i + 1} - Contenido de prueba</p>
            </div>
          ))}
          
          {/* Dropdowns de prueba en medio del contenido */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">Categoría (Portal)</label>
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
              <label className="block text-sm font-medium mb-2">Subcategoría (Portal)</label>
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
          
          {/* Más contenido después de los dropdowns */}
          {Array.from({ length: 5 }, (_, i) => (
            <div key={`after-${i}`} className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Contenido después de dropdowns - Fila {i + 1}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">✅ Valores seleccionados:</h3>
        <p className="text-green-700 text-sm">
          Categoría: {categoriaId ? categorias.find(c => c.id === categoriaId)?.nombre : 'Ninguna'}
        </p>
        <p className="text-green-700 text-sm">
          Subcategoría: {subcategoriaId ? subcategorias.find(s => s.id === subcategoriaId)?.nombre : 'Ninguna'}
        </p>
      </div>
    </div>
  );
};

export default TestPortalDropdown;



