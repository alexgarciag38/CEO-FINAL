import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

const formatCurrency = (value: any): string => {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  return numValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
};

interface TopListCardProps {
  title: string;
  data?: any[];
  labelKey: string;
  valueKey: string;
}

export const TopListCard: React.FC<TopListCardProps> = ({ title, data, labelKey, valueKey }) => {
  const topItems = data?.slice(0, 5) || []; // Mostrar solo el Top 5

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {topItems.map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-sm p-2">
                  {item[labelKey] || 'N/A'}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold p-2">
                  {formatCurrency(item[valueKey])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}; 