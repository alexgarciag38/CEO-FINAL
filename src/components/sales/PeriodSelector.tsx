import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PeriodSelectorProps {
  onPeriodChange: (mes: number, anio: number, tipoComparacion: string) => void;
  currentMes?: number;
  currentAnio?: number;
}

interface Periodo {
  anio: number;
  meses: number[];
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ 
  onPeriodChange, 
  currentMes = new Date().getMonth() + 1, 
  currentAnio = new Date().getFullYear() 
}) => {
  const [periodosDisponibles, setPeriodosDisponibles] = useState<Periodo[]>([]);
  const [selectedMes, setSelectedMes] = useState(currentMes);
  const [selectedAnio, setSelectedAnio] = useState(currentAnio);
  const [tipoComparacion, setTipoComparacion] = useState<'mes_anterior' | 'anio_anterior'>('mes_anterior');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    cargarPeriodos();
  }, []);

  const cargarPeriodos = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('No autenticado');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/obtener-periodos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar períodos');

      const { periodosDisponibles, periodoMasReciente } = await response.json();
      
      setPeriodosDisponibles(periodosDisponibles);
      
      if (periodoMasReciente) {
        setSelectedMes(periodoMasReciente.mes);
        setSelectedAnio(periodoMasReciente.anio);
      }
    } catch (error) {
      console.error('Error cargando períodos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onPeriodChange(selectedMes, selectedAnio, tipoComparacion);
  };

  const getMesesDisponibles = (anio: number) => {
    const periodo = periodosDisponibles.find(p => p.anio === anio);
    return periodo?.meses || [];
  };

  const getAniosDisponibles = () => {
    return periodosDisponibles.map(p => p.anio);
  };

  const getNombreMes = (mes: number) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || '';
  };

  const getComparacionLabel = () => {
    if (tipoComparacion === 'mes_anterior') {
      let mesAnterior = selectedMes - 1;
      let anioAnterior = selectedAnio;
      if (mesAnterior === 0) {
        mesAnterior = 12;
        anioAnterior = selectedAnio - 1;
      }
      return `vs ${getNombreMes(mesAnterior)} ${anioAnterior}`;
    } else {
      return `vs ${getNombreMes(selectedMes)} ${selectedAnio - 1}`;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Selector de Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Selector de Año */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Año</label>
            <Select value={selectedAnio.toString()} onValueChange={(value) => setSelectedAnio(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAniosDisponibles().map((anio) => (
                  <SelectItem key={anio} value={anio.toString()}>
                    {anio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Mes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mes</label>
            <Select value={selectedMes.toString()} onValueChange={(value) => setSelectedMes(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMesesDisponibles(selectedAnio).map((mes) => (
                  <SelectItem key={mes} value={mes.toString()}>
                    {getNombreMes(mes)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Comparación */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Comparar con</label>
            <Select value={tipoComparacion} onValueChange={(value: 'mes_anterior' | 'anio_anterior') => setTipoComparacion(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_anterior">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Mes anterior
                  </div>
                </SelectItem>
                <SelectItem value="anio_anterior">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Año anterior
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botón Aplicar */}
          <div className="space-y-2">
            <label className="text-sm font-medium opacity-0">Aplicar</label>
            <Button 
              onClick={handleApply} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Cargando...' : 'Aplicar'}
            </Button>
          </div>

        </div>

        {/* Preview de la comparación */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Período seleccionado:</strong> {getNombreMes(selectedMes)} {selectedAnio}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Comparación:</strong> {getComparacionLabel()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 