import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for consistent responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types for the validation response
interface ValidationSuccess {
  user: any;
}

interface ValidationError {
  status: number;
  body: {
    error: string;
    code: string;
    message?: string;
  };
}

type ValidationResult = ValidationSuccess | ValidationError;

/**
 * Helper function to validate user authentication and role authorization
 * 
 * @param req - The incoming request object
 * @param allowedRoles - Array of roles that are permitted to access the function
 * @returns Promise<ValidationResult> - Either user object on success or error response
 * 
 * @example
 * ```typescript
 * // In your Edge Function:
 * const validation = await validateUserRole(req, ['admin', 'manager']);
 * if ('status' in validation) {
 *   return new Response(JSON.stringify(validation.body), { 
 *     status: validation.status, 
 *     headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
 *   });
 * }
 * const { user } = validation;
 * // Continue with your logic using the validated user
 * ```
 */
export async function validateUserRole(
  req: Request, 
  allowedRoles: string[]
): Promise<ValidationResult> {
  
  // STEP 1: VERIFICATION OF AUTHENTICATION
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return {
      status: 401,
      body: {
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
        message: 'No authorization header provided'
      }
    };
  }

  // Initialize Supabase client with environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[VALIDATION ERROR] Missing Supabase environment variables');
    return {
      status: 500,
      body: {
        error: 'Error de configuración',
        code: 'CONFIG_ERROR',
        message: 'Missing Supabase configuration'
      }
    };
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  // Get user from token
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError || !user) {
    console.log(`[EDGE ACCESS DENIED] Usuario: N/A - Rol: N/A - Roles requeridos: ${allowedRoles.join(', ')} - Razón: Invalid authentication - Fecha: ${new Date().toISOString()}`);
    
    return {
      status: 401,
      body: {
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token'
      }
    };
  }

  // STEP 2: ROLE VALIDATION
  const userRole = user.user_metadata?.role;
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log(`[EDGE ACCESS DENIED] Usuario: ${user.email} - Rol: ${userRole || 'N/A'} - Roles requeridos: ${allowedRoles.join(', ')} - Razón: Insufficient role - Fecha: ${new Date().toISOString()}`);
    
    return {
      status: 403,
      body: {
        error: 'Acceso denegado',
        code: 'FORBIDDEN',
        message: `Role '${userRole || 'N/A'}' is not authorized. Required roles: ${allowedRoles.join(', ')}`
      }
    };
  }

  // STEP 3: SUCCESS - Log access and return user
  console.log(`[EDGE ACCESS GRANTED] Usuario: ${user.email} - Rol: ${userRole} - Fecha: ${new Date().toISOString()}`);
  
  return { user };
}

/**
 * Helper function to create standardized error responses
 * 
 * @param validationResult - The result from validateUserRole
 * @returns Response object with proper headers and status
 */
export function createErrorResponse(validationResult: ValidationError): Response {
  return new Response(
    JSON.stringify(validationResult.body),
    { 
      status: validationResult.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Helper function to handle CORS preflight requests
 * 
 * @param req - The incoming request object
 * @returns Response for OPTIONS requests or null if not a preflight
 */
export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
} 