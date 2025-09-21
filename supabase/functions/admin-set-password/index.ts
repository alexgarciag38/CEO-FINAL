// Deno Edge Function: admin-set-password
// Permite asignar una contraseña a un usuario existente (por email o user_id)
// Seguridad:
// - Requiere cabecera X-Admin-Secret que coincida con ADMIN_SECRET
// - Usa SERVICE_ROLE (solo en servidor) para updateUserById

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

type Json = Record<string, unknown>;

interface RequestBody {
  email?: string;
  user_id?: string;
  new_password: string;
}

function jsonResponse(status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function requiredEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const SUPABASE_URL = requiredEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const ADMIN_SECRET = requiredEnv('ADMIN_SECRET');

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'admin-set-password' } },
});

function isStrongEnough(pwd: string) {
  return typeof pwd === 'string' && pwd.trim().length >= 6;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' });
    }

    const secret = req.headers.get('x-admin-secret') || req.headers.get('X-Admin-Secret');
    if (!secret || secret !== ADMIN_SECRET) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const body = (await req.json()) as RequestBody;
    const { email, user_id, new_password } = body || {};

    if (!isStrongEnough(String(new_password || ''))) {
      return jsonResponse(400, { error: 'Nueva contraseña inválida (mínimo 6 caracteres).' });
    }

    let uid = user_id?.trim();

    if (!uid) {
      const mail = String(email || '').trim().toLowerCase();
      if (!mail) {
        return jsonResponse(400, { error: 'Debe proporcionar user_id o email.' });
      }

      // Buscar el usuario por email en el esquema auth
      const { data, error } = await supabaseAdmin
        .schema('auth')
        .from('users')
        .select('id')
        .eq('email', mail)
        .maybeSingle();

      if (error) {
        return jsonResponse(500, { error: `Error buscando usuario: ${error.message}` });
      }
      if (!data?.id) {
        return jsonResponse(404, { error: 'Usuario no encontrado para ese email.' });
      }
      uid = data.id as string;
    }

    const { error: updError } = await supabaseAdmin.auth.admin.updateUserById(uid!, {
      password: new_password,
    });

    if (updError) {
      return jsonResponse(500, { error: `No se pudo actualizar la contraseña: ${updError.message}` });
    }

    return jsonResponse(200, { success: true, user_id: uid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse(500, { error: msg });
  }
});


