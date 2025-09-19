import React, { useCallback, useState } from 'react';
import { uploadCatalog, deleteMyCatalog } from '@/utils/catalogClient';

const GestionCatalogo: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ productosCargados: number; errores: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }, []);

  const onUpload = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDeletedCount(null);
    try {
      const res = await uploadCatalog(file);
      setResult(res);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  }, [file]);

  const onDelete = useCallback(async () => {
    const confirmDelete = window.confirm('¿Eliminar todo tu catálogo cargado? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;
    setDeleting(true);
    setError(null);
    setResult(null);
    try {
      const res = await deleteMyCatalog();
      setDeletedCount(res.deleted);
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar el catálogo');
    } finally {
      setDeleting(false);
    }
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-4">Gestionar Mi Catálogo de Productos</h1>
        <p className="text-sm text-slate-600 mb-4">Sube un archivo CSV o Excel con columnas: codigo, descripcion, costo.</p>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <p className="text-slate-700">Arrastra y suelta tu archivo aquí</p>
          <p className="text-xs text-slate-500">(CSV, XLSX, XLS)</p>
          <div className="mt-4">
            <label className="inline-block cursor-pointer px-3 py-2 bg-white border border-slate-300 rounded-md text-sm">
              Seleccionar archivo
              <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={onSelect} />
            </label>
          </div>
        </div>

        {file && (
          <div className="mt-4 text-sm text-slate-700">Archivo seleccionado: <span className="font-medium">{file.name}</span></div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            disabled={!file || loading}
            onClick={onUpload}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >{loading ? 'Cargando…' : 'Cargar Catálogo'}</button>
          <button
            disabled={deleting}
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
          >{deleting ? 'Eliminando…' : 'Eliminar mi catálogo'}</button>
        </div>

        {result && (
          <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
            ¡Listo! Cargados: <span className="font-semibold">{result.productosCargados}</span>. Errores: <span className="font-semibold">{result.errores}</span>.
          </div>
        )}
        {typeof deletedCount === 'number' && (
          <div className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            Catálogo eliminado. Registros borrados: <span className="font-semibold">{deletedCount}</span>.
          </div>
        )}
        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionCatalogo;
