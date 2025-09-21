import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatusOptions } from '@/config/incidentConfig';
import { StatusTag } from '@/components/StatusTag';
import { EmployeeAvatar } from '@/components/EmployeeAvatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { invoke } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface Props { id: string; onBack?: () => void }

export const IncidentDetail: React.FC<Props> = ({ id, onBack }) => {
  const [item, setItem] = useState<any | null>(null);
  const [types, setTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showSolution = useMemo(() => item && (item.status === 'resolved' || item.status === 'closed'), [item]);
  const statusOptions = useMemo(() => getStatusOptions(), []);
  const statusTag = useMemo(() => item ? <StatusTag statusDb={item.status} size="md" /> : null, [item]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [detail, t, e, c] = await Promise.all([
        invoke<any>('incidents-get-details', { body: { id } }),
        invoke<any>('incident-types-get', { body: { all: true } }),
        invoke<any>('employees-get', { body: { all: true } }),
        invoke<any>('incident-comments-get', { body: { incident_id: id } })
      ]);
      setItem(detail?.item);
      setTypes(t?.items ?? []);
      setEmployees(e?.items ?? []);
      setComments(c?.items ?? []);
    } catch (err: any) { setError(err.message || 'Error'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    if (!item) return;
    setSaving(true); setError(null);
    try {
      await invoke('incidents-update', { body: item });
      if (onBack) { onBack(); } else { await load(); }
    } catch (e: any) { setError(e.message || 'Error'); } finally { setSaving(false); }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    await invoke('incident-comments-create', { body: { incident_id: id, comment: comment.trim() } });
    setComment('');
    const c = await invoke<any>('incident-comments-get', { searchParams: { incident_id: id } });
    setComments(c?.items ?? []);
  };

  const signedUrl = async (path: string) => {
    const { data } = await supabase.storage.from('incidents-attachments').createSignedUrl(path, 60);
    return data?.signedUrl;
  };

  if (loading) return <div className="text-gray-500">Cargando...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!item) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-blue-700">Detalle de Incidencia</CardTitle>
          {statusTag}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-blue-700">Título</Label>
            <Input value={item.title} onChange={e => setItem((s: any) => ({ ...s, title: e.target.value }))} />
          </div>
          <div>
            <Label className="text-blue-700">Estado</Label>
            <Select value={item.status} onValueChange={v => setItem((s: any) => ({ ...s, status: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecciona estado" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(o => (
                  <SelectItem key={o.key} value={o.dbValue}>{o.label}</SelectItem>
                ))}
                {item.status === 'cancelled' && (
                  <SelectItem value="cancelled" disabled>Cancelada</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-blue-700">Descripción</Label>
            <Textarea value={item.description || ''} onChange={e => setItem((s: any) => ({ ...s, description: e.target.value }))} rows={4} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-blue-700">Tipo</Label>
            <Select value={item.incident_type_id} onValueChange={v => setItem((s: any) => ({ ...s, incident_type_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-blue-700">Asignado A</Label>
            <Select value={item.assigned_to_employee_id} onValueChange={v => setItem((s: any) => ({ ...s, assigned_to_employee_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    <div className="flex items-center gap-2">
                      <EmployeeAvatar name={e.name} />
                      <span>{e.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-blue-700">Fecha/Hora de la Incidencia</Label>
            <Input type="datetime-local" value={(item.incident_at ? item.incident_at.slice(0,16) : '')} onChange={e => setItem((s: any) => ({ ...s, incident_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
          </div>
          <div>
            <Label className="text-blue-700">Fecha Límite</Label>
            <Input type="date" value={item.due_date || ''} onChange={e => setItem((s: any) => ({ ...s, due_date: e.target.value }))} />
          </div>
        </div>

        {showSolution && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-blue-700">Detalles de Resolución</Label>
              <Textarea value={item.resolution_details || ''} onChange={e => setItem((s: any) => ({ ...s, resolution_details: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label className="text-blue-700">Causa Raíz</Label>
              <Textarea value={item.root_cause || ''} onChange={e => setItem((s: any) => ({ ...s, root_cause: e.target.value }))} rows={3} />
            </div>
          </div>
        )}

        <div>
          <Label className="text-blue-700">Adjuntos</Label>
          <ul className="list-disc pl-5 text-sm text-blue-700">
            {(item.attachments_url || []).map((p: string) => (
              <li key={p}>
                <button className="underline" onClick={async () => { const url = await signedUrl(p); if (url) window.open(url, '_blank'); }}>Abrir adjunto</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">Guardar</Button>
          {onBack && <Button variant="outline" onClick={onBack}>Volver</Button>}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => setDeleteOpen(true)}>Eliminar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar incidencia</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Se eliminará la incidencia y sus comentarios asociados.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleting}
                  onClick={async () => {
                    try {
                      setDeleting(true);
                      await invoke('incidents-delete', { body: { id } });
                      toast.success('Incidencia eliminada');
                      setDeleteOpen(false);
                      onBack?.();
                    } catch (e: any) {
                      toast.error(e?.message || 'No se pudo eliminar');
                    } finally { setDeleting(false); }
                  }}
                >{deleting ? 'Eliminando...' : 'Eliminar definitivamente'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="pt-6">
          <div className="text-blue-700 font-medium mb-2">Comentarios</div>
          <div className="flex gap-2">
            <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Añadir comentario" />
            <Button onClick={addComment} className="bg-blue-600 hover:bg-blue-700 text-white">Enviar</Button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {comments.map(c => (
              <li key={c.id} className="p-2 bg-blue-50 rounded">
                <div className="text-gray-800">{c.comment}</div>
                <div className="text-[11px] text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};


