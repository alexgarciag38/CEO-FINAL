import { supabase } from '@/lib/supabase';

export async function saveSimulation(name: string, payload: unknown): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { data, error } = await supabase
    .from('simulations')
    .insert({ user_id: user.id, name, payload })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function listSimulations(): Promise<Array<{ id: string; name: string; created_at: string }>> {
  const { data, error, status } = await supabase
    .from('simulations')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    const code = (error as any)?.code;
    if (status === 404 || code === '42P01') return [];
    throw error;
  }
  return (data as any) || [];
}

export async function loadSimulation(id: string): Promise<any> {
  const { data, error } = await supabase
    .from('simulations')
    .select('payload')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data?.payload;
}

// New helpers for Edge Functions powered flows
export async function saveSimulationViaEdge(body: any): Promise<string> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error('No autenticado');
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guardar-simulacion`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.id as string;
}

export async function listSimulationsViaEdge(): Promise<any[]> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error('No autenticado');
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/obtener-simulaciones`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.items as any[];
}

export async function getSimulationViaEdge(id: string): Promise<any> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error('No autenticado');
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/obtener-simulacion?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
