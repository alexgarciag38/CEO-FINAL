import React, { useState, useEffect } from 'react';
import CustomSelect from '@/components/ui/CustomSelect';
import { supabase } from '@/lib/supabase';

interface ModalGestionMovimientoProps {
  isOpen: boolean;
  onClose: () => void;
  movimiento?: any;
  onSave: () => void;
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: 'Ingreso' | 'Egreso';
  color?: string | null;
  subcategorias: Subcategoria[];
}

interface Subcategoria {
  id: string;
  nombre: string;
}

const ModalGestionMovimiento: React.FC<ModalGestionMovimientoProps> = ({
  isOpen,
  onClose,
  movimiento,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  
  const [formData, setFormData] = useState({
    tipo: 'Egreso' as 'Ingreso' | 'Egreso',
    categoria_id: '',
    subcategoria_id: '',
    proveedor_cliente: '',
    descripcion: '',
    monto: '',
    fecha_movimiento: new Date().toISOString().split('T')[0],
    fecha_programada: '',
    fecha_efectiva: '',
    forma_pago: '',
    fiscal: false,
    notas: '',
    estado: 'Registrado'
  });

  // Estados para recurrencia
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [recurrenciaData, setRecurrenciaData] = useState({
    frecuencia: 'Mensual' as 'Diaria' | 'Semanal' | 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual',
    fecha_inicio_serie: new Date().toISOString().split('T')[0],
    fecha_fin_serie: '',
    dia_del_mes: new Date().getDate(),
    dia_de_la_semana: new Date().getDay(),
    activo: true
  });

  useEffect(() => {
    if (isOpen) {
      cargarCategorias();
      if (movimiento) {
        setFormData({
          tipo: movimiento.tipo,
          categoria_id: movimiento.categoria_id || '',
          subcategoria_id: movimiento.subcategoria_id || '',
          proveedor_cliente: movimiento.proveedor_cliente || '',
          descripcion: movimiento.descripcion || '',
          monto: movimiento.monto?.toString() || '',
          fecha_movimiento: movimiento.fecha_movimiento || new Date().toISOString().split('T')[0],
          fecha_programada: movimiento.fecha_programada || '',
          fecha_efectiva: movimiento.fecha_efectiva || '',
          forma_pago: movimiento.forma_pago || '',
          fiscal: movimiento.fiscal || false,
          notas: movimiento.notas || '',
          estado: movimiento.estado || 'Registrado'
        });
      } else {
        // Reset form for new movement
        setFormData({
          tipo: 'Egreso',
          categoria_id: '',
          subcategoria_id: '',
          proveedor_cliente: '',
          descripcion: '',
          monto: '',
          fecha_movimiento: new Date().toISOString().split('T')[0],
          fecha_programada: '',
          fecha_efectiva: '',
          forma_pago: '',
          fiscal: false,
          notas: '',
          estado: 'Registrado'
        });
      }
    }
  }, [isOpen, movimiento]);

  useEffect(() => {
    if (formData.categoria_id) {
      const categoria = categorias.find(c => c.id === formData.categoria_id);
      setSubcategorias(categoria?.subcategorias || []);
      setFormData(prev => ({ ...prev, subcategoria_id: '' }));
    } else {
      setSubcategorias([]);
    }
  }, [formData.categoria_id, categorias]);

  const cargarCategorias = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { data, error } = await supabase.functions.invoke('listar-configuracion-gastos', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {}
      });

      if (error) throw error;
      setCategorias(data.categorias || []);
    } catch (err: any) {
      console.error('Error cargando categorías:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      if (esRecurrente && !movimiento) {
        // Crear regla recurrente
        const reglaData = {
          ...formData,
          monto: parseFloat(formData.monto),
          categoria_id: formData.categoria_id || null,
          subcategoria_id: formData.subcategoria_id || null,
          ...recurrenciaData,
          fecha_fin_serie: recurrenciaData.fecha_fin_serie || null,
          dia_del_mes: recurrenciaData.frecuencia === 'Mensual' || recurrenciaData.frecuencia === 'Trimestral' || recurrenciaData.frecuencia === 'Semestral' || recurrenciaData.frecuencia === 'Anual' ? recurrenciaData.dia_del_mes : null,
          dia_de_la_semana: recurrenciaData.frecuencia === 'Semanal' ? recurrenciaData.dia_de_la_semana : null
        };

        const { error } = await supabase.functions.invoke('crear-regla-recurrente', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: reglaData
        });
        if (error) throw error;
      } else {
        // Crear o actualizar movimiento normal
        const movimientoData = {
          ...formData,
          monto: parseFloat(formData.monto),
          categoria_id: formData.categoria_id || null,
          subcategoria_id: formData.subcategoria_id || null,
          fecha_programada: formData.fecha_programada || null,
          fecha_efectiva: formData.fecha_efectiva || null
        };

        if (movimiento) {
          // Actualizar movimiento existente
          const { error } = await supabase.functions.invoke('actualizar-movimiento', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: {
              id: movimiento.id,
              ...movimientoData
            }
          });
          if (error) throw error;
        } else {
          // Crear nuevo movimiento
          const { error } = await supabase.functions.invoke('registrar-movimiento', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: movimientoData
          });
          if (error) throw error;
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error guardando movimiento:', err);
      alert('Error al guardar el movimiento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!movimiento) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar este movimiento?')) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { error } = await supabase.functions.invoke('eliminar-movimiento', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { id: movimiento.id }
      });

      if (error) throw error;
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error eliminando movimiento:', err);
      alert('Error al eliminar el movimiento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletar = async () => {
    if (!movimiento) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const { error } = await supabase.functions.invoke('actualizar-movimiento', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          id: movimiento.id,
          estado: 'Completado',
          fecha_efectiva: new Date().toISOString().split('T')[0]
        }
      });

      if (error) throw error;
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error completando movimiento:', err);
      alert('Error al completar el movimiento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {movimiento ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo y Categorías */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Movimiento
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as 'Ingreso' | 'Egreso' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Egreso">Egreso</option>
                <option value="Ingreso">Ingreso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <CustomSelect
                value={formData.categoria_id || null}
                onChange={(val) => setFormData(prev => ({ ...prev, categoria_id: val || '' }))}
                options={categorias.filter(c => c.tipo === formData.tipo).map(cat => ({ value: cat.id, label: cat.nombre, color: cat.color || undefined }))}
                placeholder="Seleccionar categoría"
                className="w-full"
                direction="up"
              />
            </div>
          </div>

          {/* Subcategoría */}
          {subcategorias.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategoría
              </label>
              <CustomSelect
                value={formData.subcategoria_id || null}
                onChange={(val) => setFormData(prev => ({ ...prev, subcategoria_id: val || '' }))}
                options={subcategorias.map(sub => ({ value: sub.id, label: sub.nombre }))}
                placeholder="Seleccionar subcategoría"
                className="w-full"
                direction="up"
              />
            </div>
          )}

          {/* Proveedor/Cliente y Descripción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor/Cliente (Opcional)
              </label>
              <input
                type="text"
                value={formData.proveedor_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, proveedor_cliente: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre del proveedor o cliente (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Descripción del movimiento"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Movimiento
              </label>
              <input
                type="date"
                value={formData.fecha_movimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_movimiento: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Programada
              </label>
              <input
                type="date"
                value={formData.fecha_programada}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_programada: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Efectiva
              </label>
              <input
                type="date"
                value={formData.fecha_efectiva}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_efectiva: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Forma de pago y fiscal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pago
              </label>
              <input
                type="text"
                value={formData.forma_pago}
                onChange={(e) => setFormData(prev => ({ ...prev, forma_pago: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Efectivo, Transferencia, etc."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="fiscal"
                checked={formData.fiscal}
                onChange={(e) => setFormData(prev => ({ ...prev, fiscal: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="fiscal" className="ml-2 block text-sm text-gray-700">
                Es fiscal
              </label>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Notas adicionales"
            />
          </div>

          {/* Recurrencia - Solo para nuevos movimientos */}
          {!movimiento && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="esRecurrente"
                  checked={esRecurrente}
                  onChange={(e) => setEsRecurrente(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="esRecurrente" className="ml-2 block text-sm font-medium text-gray-700">
                  Es Recurrente
                </label>
              </div>

              {esRecurrente && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frecuencia
                      </label>
                      <select
                        value={recurrenciaData.frecuencia}
                        onChange={(e) => setRecurrenciaData(prev => ({ ...prev, frecuencia: e.target.value as any }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Diaria">Diaria</option>
                        <option value="Semanal">Semanal</option>
                        <option value="Mensual">Mensual</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Inicio de Serie
                      </label>
                      <input
                        type="date"
                        value={recurrenciaData.fecha_inicio_serie}
                        onChange={(e) => setRecurrenciaData(prev => ({ ...prev, fecha_inicio_serie: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Fin de Serie (Opcional)
                      </label>
                      <input
                        type="date"
                        value={recurrenciaData.fecha_fin_serie}
                        onChange={(e) => setRecurrenciaData(prev => ({ ...prev, fecha_fin_serie: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {(recurrenciaData.frecuencia === 'Mensual' || recurrenciaData.frecuencia === 'Trimestral' || recurrenciaData.frecuencia === 'Semestral' || recurrenciaData.frecuencia === 'Anual') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Día del Mes
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={recurrenciaData.dia_del_mes}
                          onChange={(e) => setRecurrenciaData(prev => ({ ...prev, dia_del_mes: parseInt(e.target.value) }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {recurrenciaData.frecuencia === 'Semanal' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Día de la Semana
                        </label>
                        <select
                          value={recurrenciaData.dia_de_la_semana}
                          onChange={(e) => setRecurrenciaData(prev => ({ ...prev, dia_de_la_semana: parseInt(e.target.value) }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={0}>Domingo</option>
                          <option value={1}>Lunes</option>
                          <option value={2}>Martes</option>
                          <option value={3}>Miércoles</option>
                          <option value={4}>Jueves</option>
                          <option value={5}>Viernes</option>
                          <option value={6}>Sábado</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <strong>ℹ️ Información:</strong> Los movimientos recurrentes se generarán automáticamente según la frecuencia especificada. 
                    Puedes desactivar o modificar esta regla en cualquier momento.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-2">
              {movimiento && (
                <>
                  <button
                    type="button"
                    onClick={handleCompletar}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Completando...' : 'Marcar como Completado'}
                  </button>
                  <button
                    type="button"
                    onClick={handleEliminar}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </>
              )}
            </div>

            {/* Sección de Timestamps de Auditoría */}
            {movimiento && (movimiento.created_at || movimiento.updated_at) && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Información de Auditoría</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-500">
                  {movimiento.created_at && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="font-medium">Creado:</span>
                      <span>{new Date(movimiento.created_at).toLocaleString('es-MX', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                  {movimiento.updated_at && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span className="font-medium">Modificado:</span>
                      <span>{new Date(movimiento.updated_at).toLocaleString('es-MX', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalGestionMovimiento;
