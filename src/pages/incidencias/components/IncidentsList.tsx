import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { invoke } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DB_TO_STATUS_KEY, STATUS_KEY_TO_DB, getStatusOptions, PRIORITY_LABELS, PRIORITY_HEX, STATUS_CONFIG, PRIORITY_CONFIG } from '@/config/incidentConfig';
import { EmployeeAvatar } from '@/components/EmployeeAvatar';
import { toast } from 'sonner';
import { StatusTag } from '@/components/StatusTag';
import { useCompany } from '@/contexts/CompanyContext';
import { Edit3 } from 'lucide-react';

interface Props { onCreate: () => void; onSelect?: (id: string) => void }

export const IncidentsList: React.FC<Props> = ({ onCreate, onSelect }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [types, setTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const { companyId, setCompanyId } = useCompany();
  // Priority/Status: UI always shows compact Select (no toggle needed)

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await invoke<any>('incidents-get', {
        body: {
          page: 1,
          pageSize: 25,
          status: statusFilter === 'all' ? undefined : statusFilter || undefined,
          type: typeFilter === 'all' ? undefined : typeFilter || undefined,
          assignee: assigneeFilter === 'all' ? undefined : assigneeFilter || undefined,
          priority: priorityFilter === 'all' ? undefined : priorityFilter || undefined,
          company_id: companyId,
        }
      });
      let arr = data?.items ?? [];
      if (priorityFilter !== 'all') arr = arr.filter((x: any) => x.priority === priorityFilter);
      setItems(arr);
    } catch (e: any) { setError(e.message || 'Error'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter, assigneeFilter, priorityFilter, companyId]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [t, e] = await Promise.all([
          invoke<any>('incident-types-get', { body: { all: true, company_id: companyId } }),
          invoke<any>('employees-get', { body: { all: true, company_id: companyId } })
        ]);
        setTypes(t?.items ?? []);
        setEmployees(e?.items ?? []);
      } catch {}
    };
    loadMeta();
  }, [companyId]);

  const updateField = async (id: string, patch: Record<string, unknown>) => {
    try {
      await invoke('incidents-update', { body: { id, ...patch } });
      toast.success('Actualizado');
      setItems((prev) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
    } catch (e: any) {
      toast.error(e?.message || 'Error al actualizar');
    }
  };

  const statusOptions = useMemo(() => getStatusOptions(), []);

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center py-2 gap-2 flex-wrap">
          <div className="text-blue-700 font-medium">Mis Incidencias</div>
          <div className="flex items-center gap-2 ml-auto flex-wrap w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-8 text-xs">
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Estado</SelectItem>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.key} value={opt.dbValue}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-8 text-xs"><SelectValue placeholder="Filtrar tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tipo</SelectItem>
                {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-full sm:w-[190px] h-8 text-xs"><SelectValue placeholder="Filtrar asignado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Asignado</SelectItem>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs"><SelectValue placeholder="Filtrar prioridad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Prioridad</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-8 text-xs">Crear</Button>
          </div>
        </div>
        {loading && <div className="text-gray-500">Cargando...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Asignado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Incidencia</TableHead>
                <TableHead>Fecha Límite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id} className="cursor-pointer hover:bg-blue-50" onClick={() => onSelect?.(it.id)}>
                  <TableCell className="font-medium text-gray-800">{it.title}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      const selType = (types.find(t => t.id === it.incident_type_id) || it.incident_type || {}) as any;
                      const color = selType?.color_hex || '#3B82F6';
                      const name = selType?.name || 'Tipo';
                      return (
                        <div className="min-w-[140px]">
                          <StatusTag type="type" value={name} customColorHex={color} />
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      const selEmp = (employees.find(e => e.id === it.assigned_to_employee_id) || it.assignee || {}) as any;
                      return (
                        <div className="min-w-[150px] h-8 px-2 rounded border inline-flex items-center gap-1 bg-gray-50">
                          <EmployeeAvatar name={selEmp?.name || '—'} />
                          <span className="text-xs">{selEmp?.name || 'Asignado'}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select value={it.priority} onValueChange={(v) => updateField(it.id, { priority: v })}>
                      <SelectTrigger
                        className="min-w-[100px] h-7 px-1 text-xs"
                        style={{ backgroundColor: (PRIORITY_HEX as any)[it.priority]?.fill, borderColor: (PRIORITY_HEX as any)[it.priority]?.stroke }}
                      >
                        <SelectValue placeholder="Prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['low','medium','high','critical'] as const).map(p => (
                          <SelectItem key={p} value={p}>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[p].colorClasses}`}>{PRIORITY_LABELS[p]}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {(() => { const cfg = STATUS_CONFIG[DB_TO_STATUS_KEY[it.status] || 'PENDIENTE']; return (
                    <Select value={it.status} onValueChange={(v) => updateField(it.id, { status: v })}>
                      <SelectTrigger className={`min-w-[110px] h-7 px-1 text-xs ${cfg.colorClasses}`}>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {getStatusOptions().map(o => {
                          const k = DB_TO_STATUS_KEY[o.dbValue as string] || 'PENDIENTE';
                          const c = STATUS_CONFIG[k as keyof typeof STATUS_CONFIG];
                          return (
                            <SelectItem key={o.key} value={o.dbValue}>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.colorClasses}`}>{o.label}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    )})()}
                  </TableCell>
                  <TableCell>{it.incident_at ? new Date(it.incident_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      className="border rounded px-2 py-1 text-sm"
                      value={it.due_date || ''}
                      onChange={(ev) => updateField(it.id, { due_date: ev.target.value || null })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};


