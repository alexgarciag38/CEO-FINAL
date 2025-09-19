import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, mockAuth, devAuth, enableSignup, inviteOnly } from '@/lib/supabase';
import { UserSchema, User, logAuthError, getAuthErrorMessage } from '@/utils/validation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        if (mockAuth.isDevelopmentMode) {
          // Development mode - check localStorage
          const { data } = await devAuth.getSession();
          if (data.session) {
            // Validate user data with Zod schema
            const validatedUser = UserSchema.safeParse(data.session.user);
            if (validatedUser.success) {
              setUser(validatedUser.data);
              localStorage.setItem('ceo-final-dev-user', JSON.stringify(validatedUser.data));
            } else {
              logAuthError('Initial session validation failed', validatedUser.error);
              setUser(null);
            }
          }
        } else {
          // Production mode - use Supabase
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Validate user data with Zod schema
            const validatedUser = UserSchema.safeParse(session.user);
            if (validatedUser.success) {
              setUser(validatedUser.data);
            } else {
              logAuthError('Initial session validation failed', validatedUser.error);
              setUser(null);
            }
          }
        }
      } catch (error) {
        logAuthError('Error getting initial session', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes (only in production mode)
    if (!mockAuth.isDevelopmentMode) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            if (session) {
              // Validate user data with Zod schema
              const validatedUser = UserSchema.safeParse(session.user);
              if (validatedUser.success) {
                setUser(validatedUser.data);
              } else {
                logAuthError('Auth state change validation failed', validatedUser.error);
                setUser(null);
              }
            } else {
              setUser(null);
            }
          } catch (error) {
            logAuthError('Auth state change error', error);
            setUser(null);
          } finally {
            setLoading(false);
          }
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      if (mockAuth.isDevelopmentMode) {
        // Development mode
        const { data, error } = await devAuth.signIn(email, password);
        if (error) {
          const userMessage = getAuthErrorMessage(error);
          logAuthError('Development sign in error', error);
          return { error: userMessage };
        }
        if (data.user) {
          // Validate user data with Zod schema
          const validatedUser = UserSchema.safeParse(data.user);
          if (validatedUser.success) {
            setUser(validatedUser.data);
            localStorage.setItem('ceo-final-dev-user', JSON.stringify(validatedUser.data));
            return { error: undefined };
          } else {
            logAuthError('Development sign in validation failed', validatedUser.error);
            return { error: 'Error de validación de usuario' };
          }
        }
        return { error: undefined };
      } else {
        // Production mode
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          const userMessage = getAuthErrorMessage(error);
          logAuthError('Production sign in error', error);
          return { error: userMessage };
        }
        
        if (data.user) {
          // Validate user data with Zod schema
          const validatedUser = UserSchema.safeParse(data.user);
          if (validatedUser.success) {
            setUser(validatedUser.data);
            return { error: undefined };
          } else {
            logAuthError('Production sign in validation failed', validatedUser.error);
            return { error: 'Error de validación de usuario' };
          }
        }
        
        return { error: undefined };
      }
    } catch (error) {
      const userMessage = getAuthErrorMessage(error);
      logAuthError('Sign in unexpected error', error);
      return { error: userMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string, inviteCode?: string) => {
    try {
      setLoading(true);
      
      if (mockAuth.isDevelopmentMode) {
        // Development mode - allow signup for testing
        const { data, error } = await devAuth.signUp(email, password, name);
        if (error) {
          const userMessage = getAuthErrorMessage(error);
          logAuthError('Development sign up error', error);
          return { error: userMessage };
        }
        if (data.user) {
          // Validate user data with Zod schema
          const validatedUser = UserSchema.safeParse(data.user);
          if (validatedUser.success) {
            setUser(validatedUser.data);
            localStorage.setItem('ceo-final-dev-user', JSON.stringify(validatedUser.data));
            return { error: undefined };
          } else {
            logAuthError('Development sign up validation failed', validatedUser.error);
            return { error: 'Error de validación de usuario' };
          }
        }
        return { error: undefined };
      } else {
        // Production mode
        if (!enableSignup) {
          // BLOCK ALL SIGNUP ATTEMPTS when disabled
          const timestamp = new Date().toISOString();
          logAuthError('SIGNUP BLOCKED', {
            message: `Intento de registro bloqueado - Email: ${email} - Timestamp: ${timestamp}`,
            email,
            timestamp,
            userAgent: navigator.userAgent,
            ip: 'Client-side - not available'
          });
          return { error: 'Registro no permitido. Contacte al administrador.' };
        }

        // Enforce invite code if inviteOnly is enabled
        if (inviteOnly) {
          if (!inviteCode || inviteCode.trim().length < 8) {
            return { error: 'Se requiere un código de invitación válido.' };
          }
          // Optional: verify invite code via Edge Function or table
          // For now, only basic client-side length check; server must validate
        }

        // Allowed signup: forward to Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) {
          const userMessage = getAuthErrorMessage(error);
          logAuthError('Production sign up error', error);
          return { error: userMessage };
        }

        if (data.user) {
          const validatedUser = UserSchema.safeParse(data.user);
          if (validatedUser.success) {
            // Do not auto-login; require email confirmation if enabled in Supabase
            return { error: undefined };
          } else {
            logAuthError('Production sign up validation failed', validatedUser.error);
            return { error: 'Error de validación de usuario' };
          }
        }

        return { error: undefined };
      }
    } catch (error) {
      // Even if there's an unexpected error, still block signup in production
      if (!mockAuth.isDevelopmentMode) {
        const timestamp = new Date().toISOString();
        logAuthError('SIGNUP BLOCKED - Unexpected Error', {
          message: `Intento de registro bloqueado (error inesperado) - Email: ${email} - Timestamp: ${timestamp}`,
          originalError: error,
          email,
          timestamp
        });
        return { error: 'Registro no permitido. Contacte al administrador.' };
      }
      
      const userMessage = getAuthErrorMessage(error);
      logAuthError('Sign up unexpected error', error);
      return { error: userMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      if (mockAuth.isDevelopmentMode) {
        // Development mode
        await devAuth.signOut();
        localStorage.removeItem('ceo-final-dev-user');
      } else {
        // Production mode
        await supabase.auth.signOut();
      }
      
      setUser(null);
    } catch (error) {
      logAuthError('Sign out error', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (mockAuth.isDevelopmentMode) {
        // Development mode - simulate password reset
        await new Promise(resolve => setTimeout(resolve, 500));
        return { error: undefined };
      } else {
        // Production mode
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          const userMessage = getAuthErrorMessage(error);
          logAuthError('Reset password error', error);
          return { error: userMessage };
        }
        return { error: undefined };
      }
    } catch (error) {
      const userMessage = getAuthErrorMessage(error);
      logAuthError('Reset password unexpected error', error);
      return { error: userMessage };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

