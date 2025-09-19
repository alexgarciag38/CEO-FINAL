import { z } from 'zod';

// Existing schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'La confirmación debe tener al menos 6 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    inviteCode: z.string().min(8, 'Código de invitación inválido'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

// User schema for strict validation
export const UserSchema = z.object({
  id: z.string().uuid('ID de usuario inválido'),
  email: z.string().email('Email inválido'),
  name: z.string().optional(),
  role: z.union([
    z.enum(['admin', 'manager', 'user', 'super_admin']),
    z.string().transform((val) => {
      // Map Supabase's "authenticated" to "user" role
      if (val === 'authenticated') return 'user';
      return val;
    })
  ]).default('user'),
  created_at: z.string().datetime('Fecha de creación inválida'),
  updated_at: z.string().datetime('Fecha de actualización inválida'),
  last_sign_in_at: z.string().datetime().optional(),
  email_confirmed_at: z.string().datetime().optional(),
});

// Auth error logging helper
export const logAuthError = (context: string, error: unknown) => {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : 'No stack available';
  
  console.error(`[AUTH ERROR] Contexto: ${context}`);
  console.error(`Mensaje: ${errorMessage}`);
  console.error(`Stack: ${errorStack}`);
  console.error(`Fecha/Hora: ${timestamp}`);
  console.error('---');
};

// Access attempt logging helper
export const logAccessAttempt = (data: {
  route: string;
  allowedRoles: string[];
  currentUser: string | null;
  success: boolean;
  reason?: string;
}) => {
  const timestamp = new Date().toISOString();
  
  console.warn(`[ACCESS ATTEMPT] ${data.success ? 'SUCCESS' : 'DENIED'}`);
  console.warn(`Ruta: ${data.route}`);
  console.warn(`Roles permitidos: ${data.allowedRoles.join(', ')}`);
  console.warn(`Usuario actual: ${data.currentUser || 'No logueado'}`);
  console.warn(`Razón: ${data.reason || 'N/A'}`);
  console.warn(`Timestamp: ${timestamp}`);
  console.warn('---');
  
  // TODO: Connect to endpoint or Edge Function for production logging
  // await fetch('/api/log-access-attempt', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ ...data, timestamp })
  // });
};

// User-friendly error messages mapping
export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Supabase error mappings
    if (message.includes('invalid login credentials')) {
      return 'Credenciales inválidas. Verifique su email y contraseña.';
    }
    if (message.includes('email not confirmed')) {
      return 'Su email no ha sido confirmado. Revise su bandeja de entrada.';
    }
    if (message.includes('user already registered')) {
      return 'Este email ya está registrado. Intente iniciar sesión.';
    }
    if (message.includes('password should be at least')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (message.includes('invalid email')) {
      return 'Formato de email inválido.';
    }
    if (message.includes('too many requests')) {
      return 'Demasiados intentos. Espere unos minutos antes de intentar nuevamente.';
    }
    if (message.includes('network error') || message.includes('fetch')) {
      return 'Error de conexión. Verifique su conexión a internet.';
    }
  }
  
  return 'Error inesperado. Intente nuevamente.';
};

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type User = z.infer<typeof UserSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const csvUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => {
    return file.type === 'text/csv' || file.name.endsWith('.csv');
  }, 'El archivo debe ser un CSV válido'),
});

// Data Sanitization Functions
export const validateNumeric = (value: any): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Convert to string and clean
  const cleaned = String(value)
    .replace(/[^\d.-]/g, '') // Remove non-numeric characters except dots and hyphens
    .trim();
  
  if (cleaned === '' || cleaned === '-') {
    return null;
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

export const sanitizeString = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  return String(value)
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateDate = (dateString: string): Date | null => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// CSV Processing Utilities
export const processCSVRow = (row: any[], headers: string[]): Record<string, any> => {
  const processed: Record<string, any> = {};
  
  headers.forEach((header, index) => {
    const value = row[index];
    const cleanHeader = sanitizeString(header).toLowerCase();
    
    // Apply appropriate validation based on header name
    if (cleanHeader.includes('email')) {
      processed[header] = sanitizeString(value);
    } else if (cleanHeader.includes('price') || cleanHeader.includes('amount') || cleanHeader.includes('revenue')) {
      processed[header] = validateNumeric(value);
    } else if (cleanHeader.includes('date')) {
      processed[header] = validateDate(sanitizeString(value));
    } else {
      processed[header] = sanitizeString(value);
    }
  });
  
  return processed;
};

// Error Handling Utilities
export const createErrorResponse = (
  message: string,
  module: string,
  payload?: any
): { error: true; message: string; context: { module: string; payload?: any } } => {
  return {
    error: true,
    message,
    context: {
      module,
      payload,
    },
  };
};

export const createSuccessResponse = <T>(
  data: T,
  message?: string
): { success: true; data: T; message?: string } => {
  return {
    success: true,
    data,
    message,
  };
};

// Rate Limiting Utilities
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(private maxAttempts: number, private windowMs: number) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (record.count >= this.maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    
    const remaining = record.resetTime - Date.now();
    return Math.max(0, remaining);
  }
}

