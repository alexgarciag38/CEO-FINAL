import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';

interface CSVUploaderProps {
  onFileProcessed: (data: any[], headers: string[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  className?: string;
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
  value: any;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({
  onFileProcessed,
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 10,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [processedData, setProcessedData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  const validateCSVData = (data: any[], headers: string[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Check for required columns (basic validation)
    const requiredColumns = ['nombre', 'valor', 'fecha']; // Customize based on needs
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
    );
    
    if (missingColumns.length > 0) {
      errors.push({
        row: 0,
        column: 'headers',
        message: `Columnas requeridas faltantes: ${missingColumns.join(', ')}`,
        value: null
      });
    }

    // Validate data rows
    data.forEach((row, index) => {
      Object.entries(row).forEach(([column, value]) => {
        // Check for empty required fields
        if (requiredColumns.some(req => column.toLowerCase().includes(req.toLowerCase()))) {
          if (!value || value.toString().trim() === '') {
            errors.push({
              row: index + 1,
              column,
              message: 'Campo requerido vacío',
              value
            });
          }
        }

        // Validate numeric fields
        if (column.toLowerCase().includes('valor') || column.toLowerCase().includes('precio')) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) && value !== null && value !== '') {
            errors.push({
              row: index + 1,
              column,
              message: 'Valor numérico inválido',
              value
            });
          }
        }

        // Validate date fields
        if (column.toLowerCase().includes('fecha')) {
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime()) && value !== null && value !== '') {
            errors.push({
              row: index + 1,
              column,
              message: 'Formato de fecha inválido',
              value
            });
          }
        }

        // Check for potential security issues
        if (typeof value === 'string') {
          const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i
          ];
          
          if (suspiciousPatterns.some(pattern => pattern.test(value))) {
            errors.push({
              row: index + 1,
              column,
              message: 'Contenido potencialmente peligroso detectado',
              value
            });
          }
        }
      });
    });

    return errors;
  };

  const parseCSV = (text: string): { data: any[], headers: string[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Archivo CSV vacío');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      return row;
    });

    return { data, headers };
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      // File size validation
      if (file.size > maxFileSize * 1024 * 1024) {
        throw new Error(`El archivo excede el tamaño máximo de ${maxFileSize}MB`);
      }

      // File type validation
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        throw new Error(`Tipo de archivo no soportado. Tipos aceptados: ${acceptedTypes.join(', ')}`);
      }

      const text = await file.text();
      const { data, headers } = parseCSV(text);

      // Validate data
      const errors = validateCSVData(data, headers);
      setValidationErrors(errors);

      if (errors.length === 0) {
        setProcessedData(data);
        setHeaders(headers);
        onFileProcessed(data, headers);
      }

    } catch (error) {
      setValidationErrors([{
        row: 0,
        column: 'file',
        message: error instanceof Error ? error.message : 'Error procesando archivo',
        value: null
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      processFile(file);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setProcessedData(null);
    setHeaders([]);
    setValidationErrors([]);
  };

  const downloadTemplate = () => {
    const template = 'nombre,valor,fecha,categoria\nProducto A,1500,2024-01-15,Ventas\nProducto B,2300,2024-01-16,Marketing\nProducto C,890,2024-01-17,Operaciones';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_datos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : uploadedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-gray-600">Procesando archivo...</p>
          </div>
        ) : uploadedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              {validationErrors.length === 0 ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {validationErrors.length === 0 && processedData && (
              <p className="text-sm text-green-600">
                ✓ {processedData.length} filas procesadas correctamente
              </p>
            )}
            <button
              onClick={clearFile}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                Arrastra tu archivo CSV aquí
              </p>
              <p className="text-gray-500">
                o haz clic para seleccionar
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Tipos soportados: {acceptedTypes.join(', ')}</p>
              <p>Tamaño máximo: {maxFileSize}MB</p>
            </div>
          </div>
        )}

        <input
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
      </div>

      {/* Template Download */}
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <p className="font-medium text-blue-900">¿Necesitas una plantilla?</p>
            <p className="text-sm text-blue-700">Descarga un archivo de ejemplo para empezar</p>
          </div>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar Plantilla
        </button>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="font-medium text-red-900">
              Errores de Validación ({validationErrors.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {validationErrors.slice(0, 10).map((error, index) => (
              <div key={index} className="text-sm text-red-700">
                {error.row === 0 ? (
                  <span className="font-medium">Archivo: </span>
                ) : (
                  <span className="font-medium">Fila {error.row}, {error.column}: </span>
                )}
                {error.message}
                {error.value && (
                  <span className="text-red-600"> (valor: "{error.value}")</span>
                )}
              </div>
            ))}
            {validationErrors.length > 10 && (
              <p className="text-sm text-red-600 font-medium">
                ... y {validationErrors.length - 10} errores más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Data Preview */}
      {processedData && validationErrors.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">
            Vista Previa de Datos ({processedData.length} filas)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {headers.map((header, index) => (
                    <th key={index} className="text-left py-2 px-3 font-medium text-gray-900">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className="py-2 px-3 text-gray-600">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {processedData.length > 5 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                ... y {processedData.length - 5} filas más
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

