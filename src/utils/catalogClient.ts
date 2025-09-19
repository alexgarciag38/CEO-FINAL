import { supabase } from '@/lib/supabase';

export async function uploadCatalog(file: File): Promise<{ productosCargados: number; errores: number }> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error('No autenticado');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/importar-catalogo`;
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error al importar catálogo');
  }
  return res.json();
}

export async function searchProducts(q: string): Promise<Array<{ sku: string; nombre: string; costo: number }>> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error('No autenticado');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/buscar-productos?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error al buscar productos');
  }
  return res.json();
}

export async function deleteMyCatalog(): Promise<{ deleted: number }> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error('No autenticado');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/borrar-catalogo`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error al borrar catálogo');
  }
  return res.json();
}
