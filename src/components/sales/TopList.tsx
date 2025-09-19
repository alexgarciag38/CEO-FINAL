import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, TrendingUp, DollarSign, Users, Package } from 'lucide-react';

interface TopItem {
  id: string;
  name: string;
  value: number;
  secondaryValue?: number;
  percentage?: number;
  margenGanancia?: number;
  icon?: string;
}

interface TopListProps {
  title: string;
  items: TopItem[];
  icon: React.ReactNode;
  valueFormatter: (value: number) => string;
  secondaryFormatter?: (value: number) => string;
  percentageFormatter?: (percentage: number) => string;
  maxVisible?: number;
}

export const TopList: React.FC<TopListProps> = ({
  title,
  items,
  icon,
  valueFormatter,
  secondaryFormatter,
  percentageFormatter,
  maxVisible = 5
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const visibleItems = isExpanded ? items : items.slice(0, maxVisible);
  const hasMoreItems = items.length > maxVisible;

  const getIconColor = (index: number) => {
    const colors = ['bg-yellow-100 text-yellow-600', 'bg-gray-100 text-gray-600', 'bg-orange-100 text-orange-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600'];
    return colors[index] || 'bg-gray-100 text-gray-600';
  };

  const getRankIcon = (index: number) => {
    const ranks = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    return ranks[index] || `${index + 1}️⃣`;
  };

  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-700 text-lg flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {hasMoreItems && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              title={isExpanded ? "Contraer" : "Expandir"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleItems.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
              hoveredItem === item.id 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getIconColor(index)}`}>
                {getRankIcon(index)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                {item.secondaryValue && secondaryFormatter && (
                  <p className="text-sm text-gray-500">
                    {secondaryFormatter(item.secondaryValue)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {valueFormatter(item.value)}
              </p>
                             {item.percentage && (
                 <div className="text-sm text-gray-500">
                   {percentageFormatter ? percentageFormatter(item.percentage) : `${item.percentage.toFixed(1)}%`}
                 </div>
               )}
            </div>
          </div>
        ))}
        
        {hasMoreItems && !isExpanded && (
          <div className="text-center pt-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver {items.length - maxVisible} más...
            </button>
          </div>
        )}
        
        {isExpanded && hasMoreItems && (
          <div className="text-center pt-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Mostrar menos
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 