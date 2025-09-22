import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatusOptions } from '@/config/incidentConfig';
import { useCompany } from '@/contexts/CompanyContext';
import { EmployeeAvatar } from '@/components/EmployeeAvatar';
import { invoke } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface Props { onCreated?: () => void; id?: string }

export const IncidentForm: React.FC<Props> = ({ onCreated }) => {
  const { companyId } = useCompany();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'|'critical'>('medium');
  const [status, setStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('open');
  const [dueDate, setDueDate] = useState<string>('');
  const [incidentAt, setIncidentAt] = useState<string>(() => new Date().toISOString().slice(0,16));
  const [incidentTypeId, setIncidentTypeId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [types, setTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, e] = await Promise.all([
          invoke<any>('incident-types-get', { body: { all: true, company_id: companyId } }),
          invoke<any>('employees-get', { body: { all: true, company_id: companyId } })
        ]);
        setTypes(t?.items ?? []);
        setEmployees(e?.items ?? []);
      } catch (err: any) { setError(err.message || 'Error de carga'); }
    };
    load();
  }, [companyId]);
  const statusOptions = getStatusOptions();

  const uploadFiles = async (): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${(await supabase.auth.getUser()).data.user?.id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('incidents-attachments').upload(path, file, { upsert: false });
      if (error) throw error;
      // Guardar el path del objeto (bucket privado); firmar al leer
      uploaded.push(data.path);
    }
    return uploaded;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (!title.trim() || !incidentTypeId || !assigneeId) {
        setError('Completa los campos requeridos');
        setLoading(false);
        return;
      }
      const attachments = await uploadFiles();
      await invoke('incidents-create', {
        body: {
          title: title.trim(),
          description: description || undefined,
          priority,
          due_date: dueDate || undefined,
          incident_at: incidentAt ? new Date(incidentAt).toISOString() : undefined,
          incident_type_id: incidentTypeId,
          assigned_to_employee_id: assigneeId,
          attachments_url: attachments,
          company_id: companyId,
          status
        }
      });
      setTitle(''); setDescription(''); setDueDate(''); setIncidentAt(new Date().toISOString().slice(0,16)); setFiles(null);
      if (onCreated) onCreated();
    } catch (e: any) { setError(e.message || 'Error'); } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="text-red-600">{error}</div>}
          <div>
            <Label className="text-blue-700">Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Describe brevemente" />
          </div>
          <div>
            <Label className="text-blue-700">Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-blue-700">Tipo de Incidencia</Label>
              <Select value={incidentTypeId} onValueChange={setIncidentTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-blue-700">Asignado A</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona responsable" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
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
              <Label className="text-blue-700">Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-blue-700">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(o => (
                    <SelectItem key={o.key} value={o.dbValue}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-blue-700">Fecha/Hora de la Incidencia</Label>
              <Input type="datetime-local" value={incidentAt} onChange={e => setIncidentAt(e.target.value)} />
            </div>
            <div>
              <Label className="text-blue-700">Fecha Límite</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-blue-700">Archivos Adjuntos</Label>
              <Input type="file" multiple onChange={e => setFiles(e.target.files)} />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};


