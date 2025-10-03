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
  const [typeColorWarning, setTypeColorWarning] = useState<string | null>(null);

  const load = async () => {
    try {
      const [e, t] = await Promise.all([
        invoke('employees-get', { body: { company_id: companyId } }),
        invoke('incident-types-get', { body: { company_id: companyId } })
      ]);
      setEmployees(e?.items ?? []);
      setTypes(t?.items ?? []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error cargando datos: ' + (error as Error).message);
    }
  };

  useEffect(() => { load(); }, [companyId]);

  const addEmployee = async () => {
    if (!empName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      console.log('➕ Creando empleado:', { name: empName.trim(), email: empEmail, company_id: companyId });
      
      const result = await invoke('employees-create', { 
        body: { 
          name: empName.trim(), 
          email: empEmail || undefined, 
          company_id: companyId 
        } 
      });
      
      console.log('✅ Respuesta del servidor:', result);
      
      if (result?.item) {
        toast.success('Empleado agregado exitosamente');
        setEmpName(''); 
        setEmpEmail('');
        await load();
      } else {
        throw new Error('No se recibió confirmación del servidor');
      }
      
    } catch (error) {
      console.error('❌ Error creando empleado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear empleado';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const addType = async () => {
    if (!typeName.trim()) {
      toast.error('El nombre del tipo es requerido');
      return;
    }

    const colorHex = normalizeHex(typeColor);
    if (isReservedAvatarHex(colorHex)) { 
      setTypeColorWarning('Ese color está reservado para avatares. Elige otro.'); 
      return; 
    }

    try {
      console.log('➕ Creando tipo de incidencia:', { name: typeName.trim(), description: typeDesc, color_hex: colorHex, company_id: companyId });
      
      const result = await invoke('incident-types-create', { 
        body: { 
          name: typeName.trim(), 
          description: typeDesc || undefined, 
          color_hex: colorHex, 
          company_id: companyId 
        } 
      });
      
      console.log('✅ Respuesta del servidor:', result);
      
      if (result?.item) {
        toast.success('Tipo de incidencia agregado exitosamente');
        setTypeName(''); 
        setTypeDesc(''); 
        setTypeColor('#3B82F6');
        setTypeColorWarning(null);
        await load();
      } else {
        throw new Error('No se recibió confirmación del servidor');
      }
      
    } catch (error) {
      console.error('❌ Error creando tipo de incidencia:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear tipo de incidencia';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const toggleEmployee = async (id: string, isActive: boolean) => {
    try {
      await invoke('employees-update', { body: { id, is_active: !isActive } });
      toast.success(isActive ? 'Empleado desactivado' : 'Empleado activado');
      await load();
    } catch (error) {
      console.error('Error actualizando empleado:', error);
      toast.error('Error actualizando empleado: ' + (error as Error).message);
    }
  };

  const toggleType = async (id: string, isActive: boolean) => {
    try {
      await invoke('incident-types-update', { body: { id, is_active: !isActive } });
      toast.success(isActive ? 'Tipo desactivado' : 'Tipo activado');
      await load();
    } catch (error) {
      console.error('Error actualizando tipo:', error);
      toast.error('Error actualizando tipo: ' + (error as Error).message);
    }
  };

  const updateEmployee = async () => {
    if (!editEmp?.name?.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      await invoke('employees-update', { 
        body: { 
          id: editEmp.id, 
          name: editEmp.name.trim(), 
          email: editEmp.email || undefined 
        } 
      });
      toast.success('Empleado actualizado');
      setEditEmpOpen(false);
      setEditEmp(null);
      await load();
    } catch (error) {
      console.error('Error actualizando empleado:', error);
      toast.error('Error actualizando empleado: ' + (error as Error).message);
    }
  };

  const updateType = async () => {
    if (!editType?.name?.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      await invoke('incident-types-update', { 
        body: { 
          id: editType.id, 
          name: editType.name.trim(), 
          description: editType.description || undefined,
          color_hex: editType.color_hex || '#3B82F6'
        } 
      });
      toast.success('Tipo actualizado');
      setEditTypeOpen(false);
      setEditType(null);
      await load();
    } catch (error) {
      console.error('Error actualizando tipo:', error);
      toast.error('Error actualizando tipo: ' + (error as Error).message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Empleados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700">Gestión de Empleados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input 
              value={empName} 
              onChange={e => setEmpName(e.target.value)} 
              placeholder="Nombre" 
            />
            <Input 
              value={empEmail} 
              onChange={e => setEmpEmail(e.target.value)} 
              placeholder="Email (opcional)" 
            />
            <Button 
              onClick={addEmployee} 
              disabled={!empName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform"
            >
              Añadir
            </Button>
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
                      <Button 
                        variant="outline" 
                        onClick={() => { setEditEmp({ ...e }); setEditEmpOpen(true); }} 
                        className="active:scale-95 transition-transform"
                      >
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Empleado</DialogTitle>
                        <DialogDescription>
                          Modifica los datos del empleado
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Nombre</Label>
                          <Input
                            id="name"
                            value={editEmp?.name || ''}
                            onChange={e => setEditEmp(prev => ({ ...prev, name: e.target.value }))}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">Email</Label>
                          <Input
                            id="email"
                            value={editEmp?.email || ''}
                            onChange={e => setEditEmp(prev => ({ ...prev, email: e.target.value }))}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={updateEmployee}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Actualizar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    onClick={() => toggleEmployee(e.id, e.is_active)}
                    className={`active:scale-95 transition-transform ${
                      e.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {e.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </li>
            ))}
            {employees.length === 0 && (
              <li className="py-4 text-center text-gray-500">No hay empleados registrados</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Tipos de Incidencia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700">Tipos de Incidencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input 
              value={typeName} 
              onChange={e => setTypeName(e.target.value)} 
              placeholder="Nombre del tipo" 
            />
            <Input 
              value={typeDesc} 
              onChange={e => setTypeDesc(e.target.value)} 
              placeholder="Descripción (opcional)" 
            />
            <div className="flex items-center gap-1">
              <input 
                type="color" 
                value={typeColor} 
                onChange={e => { 
                  setTypeColor(e.target.value); 
                  setTypeColorWarning(isReservedAvatarHex(e.target.value) ? 'Ese color está reservado para avatares. Elige otro.' : null); 
                }} 
                className="h-9 w-10 p-1 rounded border" 
                title="Color"
              />
            </div>
            <Button 
              onClick={addType} 
              disabled={!typeName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform"
            >
              Añadir
            </Button>
          </div>
          {typeColorWarning && <div className="text-xs text-orange-600 mb-2">{typeColorWarning}</div>}
          
          <ul className="divide-y">
            {types.map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="text-gray-800 font-medium flex items-center gap-2">
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
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={editTypeOpen} onOpenChange={setEditTypeOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={() => { setEditType({ ...t }); setEditTypeOpen(true); }} 
                        className="active:scale-95 transition-transform"
                      >
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Tipo de Incidencia</DialogTitle>
                        <DialogDescription>
                          Modifica los datos del tipo de incidencia
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="type-name" className="text-right">Nombre</Label>
                          <Input
                            id="type-name"
                            value={editType?.name || ''}
                            onChange={e => setEditType(prev => ({ ...prev, name: e.target.value }))}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="type-desc" className="text-right">Descripción</Label>
                          <Input
                            id="type-desc"
                            value={editType?.description || ''}
                            onChange={e => setEditType(prev => ({ ...prev, description: e.target.value }))}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="type-color" className="text-right">Color</Label>
                          <input
                            id="type-color"
                            type="color"
                            value={editType?.color_hex || '#3B82F6'}
                            onChange={e => setEditType(prev => ({ ...prev, color_hex: e.target.value }))}
                            className="col-span-3 h-9 w-20 p-1 rounded border"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={updateType}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Actualizar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    onClick={() => toggleType(t.id, t.is_active)}
                    className={`active:scale-95 transition-transform ${
                      t.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {t.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </li>
            ))}
            {types.length === 0 && (
              <li className="py-4 text-center text-gray-500">No hay tipos registrados</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
