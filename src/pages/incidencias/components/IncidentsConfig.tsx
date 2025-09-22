import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { invoke } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { isReservedAvatarHex, normalizeHex } from '@/utils/avatarUtils';
import { useCompany } from '@/contexts/CompanyContext';

export const IncidentsConfig: React.FC = () => {
  const { companyId } = useCompany();
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [typeColor, setTypeColor] = useState<string>('#3B82F6');
  const [employees, setEmployees] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [editEmp, setEditEmp] = useState<any | null>(null);
  const [editType, setEditType] = useState<any | null>(null);
  const [editEmpOpen, setEditEmpOpen] = useState(false);
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [savingEmp, setSavingEmp] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [typeColorWarning, setTypeColorWarning] = useState<string | null>(null);

  const load = async () => {
    const [e, t] = await Promise.all([
      invoke<any>('employees-get', { body: { all: true, company_id: companyId } }),
      invoke<any>('incident-types-get', { body: { all: true, company_id: companyId } })
    ]);
    setEmployees(e?.items ?? []);
    setTypes(t?.items ?? []);
  };

  useEffect(() => { load(); }, [companyId]);

  const addEmployee = async () => {
    if (!empName.trim()) return;
    await invoke('employees-create', { body: { name: empName.trim(), email: empEmail || undefined, company_id: companyId } });
    toast.success('Empleado agregado');
    setEmpName(''); setEmpEmail('');
    await load();
  };

  const addType = async () => {
    if (!typeName.trim()) return;
    const colorHex = normalizeHex(typeColor);
    if (isReservedAvatarHex(colorHex)) { setTypeColorWarning('Ese color está reservado para avatares. Elige otro.'); return; }
    await invoke('incident-types-create', { body: { name: typeName.trim(), description: typeDesc || undefined, color_hex: colorHex, company_id: companyId } });
    toast.success('Tipo de incidencia agregado');
    setTypeName(''); setTypeDesc(''); setTypeColor('#3B82F6');
    setTypeColorWarning(null);
    await load();
  };

  const toggleEmployee = async (id: string, isActive: boolean) => {
    await invoke('employees-update', { body: { id, is_active: !isActive } });
    toast.success(isActive ? 'Empleado desactivado' : 'Empleado activado');
    await load();
  };

  const toggleType = async (id: string, isActive: boolean) => {
    await invoke('incident-types-update', { body: { id, is_active: !isActive } });
    toast.success(isActive ? 'Tipo desactivado' : 'Tipo activado');
    await load();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700">Gestionar Empleados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input value={empName} onChange={e => setEmpName(e.target.value)} placeholder="Nombre" />
            <Input value={empEmail} onChange={e => setEmpEmail(e.target.value)} placeholder="Email (opcional)" />
            <Button onClick={addEmployee} className="bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform">Añadir</Button>
          </div>
          <ul className="divide-y">
            {employees.map((e) => (
              <li key={e.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="text-gray-800 font-medium">{e.name}</div>
                  <div className="text-xs text-gray-500">{e.email || '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={editEmpOpen} onOpenChange={setEditEmpOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => { setEditEmp({ ...e }); setEditEmpOpen(true); }} className="active:scale-95 transition-transform">Editar</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Empleado</DialogTitle>
                        <DialogDescription>Cambia los datos del empleado y guarda para aplicar.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-blue-700">Nombre</Label>
                          <Input value={editEmp?.name || ''} onChange={ev => setEditEmp((s: any) => ({ ...s, name: ev.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-blue-700">Email</Label>
                          <Input value={editEmp?.email || ''} onChange={ev => setEditEmp((s: any) => ({ ...s, email: ev.target.value }))} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          className="active:scale-95 transition-transform"
                          disabled={savingEmp}
                          onClick={async () => {
                            if (!editEmp?.id || !editEmp?.name?.trim()) { toast.error('Nombre requerido'); return; }
                            try {
                              setSavingEmp(true);
                              await invoke('employees-update', { body: { id: editEmp.id, name: editEmp.name.trim(), email: editEmp.email || null } });
                              toast.success('Empleado editado correctamente');
                              setEditEmpOpen(false);
                              setEditEmp(null);
                              await load();
                            } finally { setSavingEmp(false); }
                          }}
                        >{savingEmp ? 'Guardando...' : 'Guardar'}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Label className={e.is_active ? 'text-green-700' : 'text-gray-500'}>{e.is_active ? 'Activo' : 'Inactivo'}</Label>
                  <Button variant="outline" onClick={() => toggleEmployee(e.id, e.is_active)}>
                    {e.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </li>
            ))}
            {employees.length === 0 && (
              <li className="py-2 text-sm text-gray-500">Sin registros</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700">Gestionar Tipos de Incidencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 items-center">
            <Input value={typeName} onChange={e => setTypeName(e.target.value)} placeholder="Nombre" />
            <Input value={typeDesc} onChange={e => setTypeDesc(e.target.value)} placeholder="Descripción (opcional)" />
            <div className="flex items-center gap-2">
              <Label className="text-blue-700">Color</Label>
            <input type="color" value={typeColor} onChange={e => { setTypeColor(e.target.value); setTypeColorWarning(isReservedAvatarHex(e.target.value) ? 'Ese color está reservado para avatares. Elige otro.' : null); }} className="h-9 w-10 p-1 rounded border" />
            </div>
          {typeColorWarning && <div className="text-xs text-orange-600">{typeColorWarning}</div>}
            <Button onClick={addType} className="bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform">Añadir</Button>
          </div>
          <ul className="divide-y">
            {types.map((t) => (
              <li key={t.id} className="py-2 grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: (t.color_hex || '#3B82F6') + '20',
                      color: t.color_hex || '#3B82F6',
                      border: `1px solid ${t.color_hex || '#3B82F6'}`
                    }}
                  >{t.name}</span>
                </div>
                <div className="text-xs text-gray-500">{t.description || '—'}</div>
                <div className="flex items-center gap-2 justify-end">
                  <Dialog open={editTypeOpen} onOpenChange={setEditTypeOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => { setEditType({ ...t }); setEditTypeOpen(true); }} className="active:scale-95 transition-transform">Editar</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Tipo de Incidencia</DialogTitle>
                        <DialogDescription>Actualiza nombre, descripción y color del tipo.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-blue-700">Nombre</Label>
                          <Input value={editType?.name || ''} onChange={ev => setEditType((s: any) => ({ ...s, name: ev.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-blue-700">Descripción</Label>
                          <Input value={editType?.description || ''} onChange={ev => setEditType((s: any) => ({ ...s, description: ev.target.value }))} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-blue-700">Color</Label>
                          <input type="color" value={editType?.color_hex || '#3B82F6'} onChange={ev => setEditType((s: any) => ({ ...s, color_hex: ev.target.value }))} className="h-9 w-10 p-1 rounded border" />
                        </div>
                        {editType?.color_hex && isReservedAvatarHex(editType.color_hex) && (
                          <div className="text-xs text-orange-600">Ese color está reservado para avatares. Elige otro.</div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          className="active:scale-95 transition-transform"
                          disabled={savingType || (editType?.color_hex && isReservedAvatarHex(editType.color_hex))}
                          onClick={async () => {
                            if (!editType?.id || !editType?.name?.trim()) { toast.error('Nombre requerido'); return; }
                            try {
                              setSavingType(true);
                              const colorHex = normalizeHex(editType.color_hex || '#3B82F6');
                              if (isReservedAvatarHex(colorHex)) { toast.error('Ese color está reservado para avatares'); return; }
                              await invoke('incident-types-update', { body: { id: editType.id, name: editType.name.trim(), description: editType.description || null, color_hex: colorHex } });
                              toast.success('Tipo de incidencia editado correctamente');
                              setEditTypeOpen(false);
                              setEditType(null);
                              await load();
                            } finally { setSavingType(false); }
                          }}
                        >{savingType ? 'Guardando...' : 'Guardar'}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Label className={t.is_active ? 'text-green-700' : 'text-gray-500'}>{t.is_active ? 'Activo' : 'Inactivo'}</Label>
                  <Button variant="outline" onClick={() => toggleType(t.id, t.is_active)}>
                    {t.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </li>
            ))}
            {types.length === 0 && (
              <li className="py-2 text-sm text-gray-500">Sin registros</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};


