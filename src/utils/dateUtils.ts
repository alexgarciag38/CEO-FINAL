/**
 * Utilidades para manejo de fechas en formato híbrido (texto y calendario)
 */

/**
 * Convierte una fecha en formato dd/mm/yyyy a formato yyyy-mm-dd para input type="date"
 */
export function formatDateForInput(dateString: string): string {
  if (!dateString) return '';
  
  // Si ya está en formato yyyy-mm-dd, devolverlo tal como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Si está en formato dd/mm/yyyy, convertir a yyyy-mm-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Si está en formato dd/mm/yy, convertir a yyyy-mm-dd (asumiendo siglo 20 para años < 50, siglo 21 para >= 50)
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/');
    const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Si no coincide con ningún formato conocido, devolver string vacío
  return '';
}

/**
 * Convierte una fecha en formato yyyy-mm-dd a formato dd/mm/yyyy para mostrar
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';
  
  // Si está en formato yyyy-mm-dd, convertir a dd/mm/yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Si ya está en formato dd/mm/yyyy, devolverlo tal como está
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  return dateString;
}

/**
 * Valida si una fecha en formato dd/mm/yyyy es válida
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return true; // Permitir campo vacío
  
  // Verificar formato dd/mm/yyyy
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return false;
  }
  
  const [day, month, year] = dateString.split('/').map(Number);
  
  // Validar rangos
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Validar fecha real
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
}

/**
 * Convierte una fecha en formato yyyy-mm-dd a formato dd/mm/yyyy para input de texto
 */
export function formatDateForTextInput(dateString: string): string {
  if (!dateString) return '';
  
  // Si está en formato yyyy-mm-dd, convertir a dd/mm/yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
}

/**
 * Aplica máscara automática para formato dd/mm/yyyy mientras el usuario escribe
 */
export function applyDateMask(value: string): string {
  // Remover todos los caracteres que no sean números
  const numbers = value.replace(/\D/g, '');
  
  // Aplicar máscara dd/mm/yyyy
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
}

