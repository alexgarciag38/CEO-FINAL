import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Check } from 'lucide-react'

interface MesDisponible {
  mes: number
  anio: number
  fecha_carga: string
  label: string
}

interface MonthSelectorProps {
  mesesDisponibles: MesDisponible[]
  mesActual: MesDisponible | null
  onMonthChange: (mes: number, anio: number) => void
  loading?: boolean
  className?: string
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  mesesDisponibles,
  mesActual,
  onMonthChange,
  loading = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cerrar dropdown al presionar Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleMonthSelect = (mes: number, anio: number) => {
    onMonthChange(mes, anio)
    setIsOpen(false)
  }

  const formatFechaCarga = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={`flex items-center px-3 py-2 bg-gray-100 text-gray-500 rounded-md text-sm font-medium ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
        Cargando...
      </div>
    )
  }

  if (!mesActual) {
    return (
      <div className={`flex items-center px-3 py-2 bg-gray-100 text-gray-500 rounded-md text-sm font-medium ${className}`}>
        <Calendar className="w-4 h-4 mr-2" />
        Sin datos disponibles
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={mesesDisponibles.length === 0}
        className={`
          flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium
          hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
          transition-colors duration-200
          ${mesesDisponibles.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Calendar className="w-4 h-4 mr-2" />
        <span className="flex-1 text-left">{mesActual.label}</span>
        <ChevronDown 
          className={`w-4 h-4 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && mesesDisponibles.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">
              Períodos disponibles ({mesesDisponibles.length})
            </div>
            
            {mesesDisponibles.map((mes) => {
              const isSelected = mesActual.mes === mes.mes && mesActual.anio === mes.anio
              
              return (
                <button
                  key={`${mes.anio}-${mes.mes}`}
                  onClick={() => handleMonthSelect(mes.mes, mes.anio)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-md text-sm
                    transition-colors duration-150
                    ${isSelected 
                      ? 'bg-green-50 text-green-800 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{mes.label}</span>
                    <span className="text-xs text-gray-500">
                      Cargado: {formatFechaCarga(mes.fecha_carga)}
                    </span>
                  </div>
                  
                  {isSelected && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Footer con información adicional */}
          <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              Selecciona un período para ver su análisis
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

