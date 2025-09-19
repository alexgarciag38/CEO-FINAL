import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateUserRole, createErrorResponse, handleCorsPreflight } from '../../utils/validateUserRole.ts';

// ROLES CONFIGURATION
// Modify this array to control which roles can access this function
// This function is sensitive as it processes CSV data, so restrict to admin roles only
const allowedRoles = ['admin', 'super_admin'];

interface CSVProcessRequest {
  file: string; // Base64 encoded CSV content
  tableName: string;
  filename: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  try {
    // STEP 1: VALIDATE USER AUTHENTICATION AND ROLE
    const validation = await validateUserRole(req, allowedRoles);
    if ('status' in validation) {
      return createErrorResponse(validation);
    }
    const { user } = validation;

    // STEP 2: EXECUTE MAIN LOGIC (only if authentication and role validation pass)

    // Initialize Supabase client for data operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Parse request body
    const { file, tableName, filename }: CSVProcessRequest = await req.json();

    if (!file || !tableName || !filename) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Missing required fields: file, tableName, filename',
          context: { module: 'csv-processor', payload: { file: !!file, tableName, filename } }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64 CSV content
    const csvContent = atob(file);
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'CSV file must contain at least a header row and one data row',
          context: { module: 'csv-processor', payload: { lines: lines.length } }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse CSV headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Log upload start
    const { data: uploadLog, error: logError } = await supabaseClient
      .from('csv_uploads')
      .insert({
        user_id: user.id,
        filename,
        table_name: tableName,
        status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Failed to create upload log',
          context: { module: 'csv-processor', payload: logError }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedRows = 0;
    let failedRows = 0;
    const errors: string[] = [];

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const rowData: any = { user_id: user.id };

        // Map values to headers
        headers.forEach((header, index) => {
          const value = values[index] || null;
          
          // Data validation and sanitization
          if (header.toLowerCase().includes('revenue') || 
              header.toLowerCase().includes('amount') || 
              header.toLowerCase().includes('value') ||
              header.toLowerCase().includes('salary') ||
              header.toLowerCase().includes('cost')) {
            // Numeric validation
            const numericValue = value ? parseFloat(value.replace(/[^\d.-]/g, '')) : null;
            rowData[header.toLowerCase().replace(/\s+/g, '_')] = isNaN(numericValue!) ? null : numericValue;
          } else if (header.toLowerCase().includes('date')) {
            // Date validation
            const dateValue = value ? new Date(value) : null;
            rowData[header.toLowerCase().replace(/\s+/g, '_')] = 
              dateValue && !isNaN(dateValue.getTime()) ? dateValue.toISOString().split('T')[0] : null;
          } else if (header.toLowerCase().includes('quantity') || 
                     header.toLowerCase().includes('impressions') ||
                     header.toLowerCase().includes('clicks') ||
                     header.toLowerCase().includes('conversions')) {
            // Integer validation
            const intValue = value ? parseInt(value.replace(/[^\d-]/g, '')) : null;
            rowData[header.toLowerCase().replace(/\s+/g, '_')] = isNaN(intValue!) ? null : intValue;
          } else {
            // String sanitization
            rowData[header.toLowerCase().replace(/\s+/g, '_')] = 
              value ? value.substring(0, 1000).replace(/[<>]/g, '') : null;
          }
        });

        // Insert row into specified table
        const { error: insertError } = await supabaseClient
          .from(tableName)
          .insert(rowData);

        if (insertError) {
          failedRows++;
          errors.push(`Row ${i}: ${insertError.message}`);
        } else {
          processedRows++;
        }
      } catch (error) {
        failedRows++;
        errors.push(`Row ${i}: ${error.message}`);
      }
    }

    // Update upload log
    await supabaseClient
      .from('csv_uploads')
      .update({
        rows_processed: processedRows,
        rows_failed: failedRows,
        status: failedRows === 0 ? 'completed' : 'completed',
        error_log: errors.length > 0 ? errors.join('\n') : null,
        completed_at: new Date().toISOString()
      })
      .eq('id', uploadLog.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          processedRows,
          failedRows,
          totalRows: lines.length - 1,
          errors: errors.slice(0, 10) // Limit error messages
        },
        message: `CSV processing completed. ${processedRows} rows processed successfully.`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: true,
        message: 'Internal server error during CSV processing',
        context: { module: 'csv-processor', payload: error.message }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

