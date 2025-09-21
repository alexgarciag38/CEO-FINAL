import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const enableSignup = String(import.meta.env.VITE_ENABLE_SIGNUP || '').toLowerCase() === 'true';
export const inviteOnly = String(import.meta.env.VITE_INVITE_ONLY ?? 'true').toLowerCase() === 'true';

// Detect configuration state
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
const isPlaceholderUrl = supabaseUrl === 'https://placeholder.supabase.co' || supabaseUrl === 'TU_URL_DE_SUPABASE_AQUI';
const isDevelopmentMode = Boolean(import.meta.env.DEV && (!hasSupabaseEnv || isPlaceholderUrl));

if (!hasSupabaseEnv) {
  // Do NOT throw on import; keep the app usable in local without backend
  console.warn('[Config] Supabase env no definidas. Ejecutando en modo desarrollo sin backend.');
}

// Create Supabase client only when env is present; provide a safe shim otherwise
export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : ({
      auth: {
        async getSession() {
          return { data: { session: null }, error: null } as any;
        },
        async signInWithPassword() {
          throw new Error('Auth no disponible sin configuración de Supabase');
        },
        async signOut() {
          return { error: null } as any;
        },
        async resetPasswordForEmail() {
          throw new Error('Reset no disponible sin Supabase');
        },
        onAuthStateChange() {
          return { data: { subscription: { unsubscribe() {} } } } as any;
        },
        async signInWithOAuth() {
          throw new Error('OAuth no disponible sin Supabase');
        },
      },
    } as any);

// Mock authentication for development
export const mockAuth = {
  isDevelopmentMode,
  mockUser: {
    id: 'dev-user-123',
    email: 'admin@ceofinal.com',
    name: 'Administrador',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

// Development mode authentication functions
export const devAuth = {
  signIn: async (email: string, password: string) => {
    if (!isDevelopmentMode) {
      throw new Error('Development auth only available in development mode');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simple validation for demo
    if (email && password) {
      return {
        data: {
          user: mockAuth.mockUser,
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: mockAuth.mockUser
          }
        },
        error: null
      };
    } else {
      return {
        data: { user: null, session: null },
        error: { message: 'Email y contraseña son requeridos' }
      };
    }
  },
  
  signUp: async (email: string, password: string, name?: string) => {
    if (!isDevelopmentMode) {
      throw new Error('Development auth only available in development mode');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = {
      ...mockAuth.mockUser,
      email,
      name: name || 'Usuario'
    };
    
    return {
      data: {
        user,
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user
        }
      },
      error: null
    };
  },
  
  signOut: async () => {
    if (!isDevelopmentMode) {
      throw new Error('Development auth only available in development mode');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { error: null };
  },
  
  getSession: async () => {
    if (!isDevelopmentMode) {
      throw new Error('Development auth only available in development mode');
    }
    
    // Check if user is "logged in" (stored in localStorage for demo)
    const storedUser = localStorage.getItem('ceo-final-dev-user');
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return {
        data: {
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user
          }
        },
        error: null
      };
    }
    
    return {
      data: { session: null },
      error: null
    };
  }
};

