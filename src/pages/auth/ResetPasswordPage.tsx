import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  });

function parseAuthParams() {
  const result: Record<string, string> = {};
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.substring(1)
    : window.location.hash;
  const search = window.location.search.startsWith('?')
    ? window.location.search.substring(1)
    : window.location.search;

  const collect = (str: string) => {
    if (!str) return;
    new URLSearchParams(str).forEach((value, key) => {
      result[key] = value;
    });
  };

  collect(hash);
  collect(search);
  return result;
}

export const ResetPasswordPage: React.FC = () => {
  const params = useMemo(() => parseAuthParams(), []);
  const hasTokens = Boolean(params['access_token'] && params['refresh_token']);
  const isRecovery = params['type'] === 'recovery' || hasTokens || Boolean(params['code']);

  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form: request reset email
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<{ email: string }>({ resolver: zodResolver(emailSchema) });

  // Form: set new password
  const {
    register: registerPass,
    handleSubmit: handleSubmitPass,
    formState: { errors: passErrors },
  } = useForm<{ password: string; confirm: string }>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (hasTokens) {
          // Establecer la sesión usando los tokens del enlace
          const { access_token, refresh_token } = params as any;
          const { error } = await supabase.auth.setSession({
            access_token: String(access_token),
            refresh_token: String(refresh_token),
          });
          if (error) throw error;
          // Limpiar el fragmento sensible de la URL
          try {
            const newUrl = `${window.location.origin}/reset-password?type=recovery`;
            window.history.replaceState({}, '', newUrl);
          } catch {}
          setInfo('Sesión verificada. Define tu nueva contraseña.');
          return;
        }
        if (isRecovery) {
          setInfo('Ingresa tu nueva contraseña para continuar.');
        }
      } catch (err: any) {
        setError(err?.message || 'No pudimos validar el enlace.');
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRequestReset = async (data: { email: string }) => {
    try {
      setLoading(true);
      setError(null);
      setInfo(null);
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo,
      });
      if (error) throw error;
      setInfo('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.');
    } catch (err: any) {
      setError(err?.message || 'No pudimos enviar el enlace. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const onSetNewPassword = async (data: { password: string; confirm: string }) => {
    try {
      setLoading(true);
      setError(null);
      setInfo(null);
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      setInfo('Contraseña actualizada. Ahora puedes iniciar sesión.');
    } catch (err: any) {
      setError(err?.message || 'No pudimos actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Recuperar acceso</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRecovery
              ? 'Define una nueva contraseña para tu cuenta.'
              : 'Te enviaremos un enlace para restablecer tu contraseña.'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          {info && (
            <div className="mb-6 p-3 rounded-md bg-green-50 text-green-700 text-sm">{info}</div>
          )}
          {error && (
            <div className="mb-6 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          {!isRecovery ? (
            <form onSubmit={handleSubmitEmail(onRequestReset)} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="mt-1">
                  <Input id="email" type="email" placeholder="tu@email.com" {...registerEmail('email')} />
                  {emailErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{emailErrors.email.message}</p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmitPass(onSetNewPassword)} className="space-y-6">
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Nueva contraseña
                </Label>
                <div className="mt-1">
                  <Input id="password" type="password" placeholder="••••••••" {...registerPass('password')} />
                  {passErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{passErrors.password.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
                  Confirmar contraseña
                </Label>
                <div className="mt-1">
                  <Input id="confirm" type="password" placeholder="••••••••" {...registerPass('confirm')} />
                  {passErrors.confirm && (
                    <p className="mt-1 text-sm text-red-600">{passErrors.confirm.message}</p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Actualizando…' : 'Actualizar contraseña'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;


