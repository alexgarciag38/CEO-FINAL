import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const enableSignup = String(import.meta.env.VITE_ENABLE_SIGNUP || '').toLowerCase() === 'true';
export const inviteOnly = String(import.meta.env.VITE_INVITE_ONLY ?? 'true').toLowerCase() === 'true';



// Check if we're in development mode with placeholder values
const isDevelopmentMode = supabaseUrl === 'https://placeholder.supabase.co' || supabaseUrl === 'TU_URL_DE_SUPABASE_AQUI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

