import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface MesDisponible {
  mes: number
  anio: number
  fecha_carga: string
  label: string
}

interface DatosMes {
  mes: number
  anio: number
  datos: any
  fecha_carga: string
  label: string
}

interface UseVentasNavigationReturn {
  mesesDisponibles: MesDisponible[]
  mesActual: MesDisponible | null
  datosMesActual: any
  loading: boolean
  error: string | null
  cargarMesDisponibles: () => Promise<void>
  cambiarAMes: (mes: number, anio: number) => Promise<void>
  actualizarMesActual: (mes: number, anio: number) => void
}

export const useVentasNavigation = (): UseVentasNavigationReturn => {
  const [mesesDisponibles, setMesesDisponibles] = useState<MesDisponible[]>([])
  const [mesActual, setMesActual] = useState<MesDisponible | null>(null)
  const [datosMesActual, setDatosMesActual] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener meses disponibles
  const cargarMesDisponibles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No autenticado')
      }

      const response = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/obtener-meses-ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'get_available_months'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Manejo específico de errores de permisos
        if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a los datos de ventas. Contacta al administrador.')
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        } else {
          throw new Error(errorData.error || 'Error al obtener meses disponibles')
        }
      }

      const result = await response.json()
      setMesesDisponibles(result.meses || [])

      // Si hay meses disponibles y no hay mes actual, seleccionar el más reciente
      if (result.meses && result.meses.length > 0 && !mesActual) {
        const mesMasReciente = result.meses[0] // Ya viene ordenado por fecha descendente
        setMesActual(mesMasReciente)
      }

    } catch (err: any) {
      console.error('Error al cargar meses disponibles:', err)
      setError(err.message || 'Error al cargar meses disponibles')
    } finally {
      setLoading(false)
    }
  }, [mesActual])

  // Función para cambiar a un mes específico
  const cambiarAMes = useCallback(async (mes: number, anio: number) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No autenticado')
      }

      const response = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/obtener-meses-ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'get_month_data',
          mes,
          anio
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Manejo específico de errores de permisos
        if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a los datos de ventas. Contacta al administrador.')
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        } else if (response.status === 404) {
          throw new Error('No hay datos disponibles para este período')
        } else {
          throw new Error(errorData.error || 'Error al cargar datos del mes')
        }
      }

      const result = await response.json()
      
      // Actualizar el mes actual
      const nuevoMesActual: MesDisponible = {
        mes: result.mes,
        anio: result.anio,
        fecha_carga: result.fecha_carga,
        label: result.label
      }
      
      setMesActual(nuevoMesActual)
      setDatosMesActual(result.datos)

      // Guardar en localStorage para persistencia
      localStorage.setItem('ventas_current_period', JSON.stringify({
        mes: result.mes,
        anio: result.anio,
        fecha_carga: result.fecha_carga,
        label: result.label
      }))

    } catch (err: any) {
      console.error('Error al cambiar de mes:', err)
      setError(err.message || 'Error al cargar datos del mes')
    } finally {
      setLoading(false)
    }
  }, [])

  // Función para actualizar el mes actual (sin cargar datos)
  const actualizarMesActual = useCallback((mes: number, anio: number) => {
    const nuevoMesActual: MesDisponible = {
      mes,
      anio,
      fecha_carga: new Date().toISOString(),
      label: `${getNombreMes(mes)} ${anio}`
    }
    setMesActual(nuevoMesActual)
    
    // Guardar en localStorage
    localStorage.setItem('ventas_current_period', JSON.stringify({
      mes,
      anio,
      fecha_carga: new Date().toISOString(),
      label: nuevoMesActual.label
    }))
  }, [])

  // Cargar meses disponibles al montar el componente
  useEffect(() => {
    cargarMesDisponibles()
  }, [cargarMesDisponibles])

  // Cargar datos del mes actual cuando cambie
  useEffect(() => {
    if (mesActual) {
      cambiarAMes(mesActual.mes, mesActual.anio)
    }
  }, [mesActual?.mes, mesActual?.anio, cambiarAMes])

  return {
    mesesDisponibles,
    mesActual,
    datosMesActual,
    loading,
    error,
    cargarMesDisponibles,
    cambiarAMes,
    actualizarMesActual
  }
}

// Función auxiliar para obtener el nombre del mes
function getNombreMes(mes: number): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses[mes - 1] || ''
}
