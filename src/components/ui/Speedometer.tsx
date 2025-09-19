import React from 'react';

interface SpeedometerProps {
  value: number;
  maxValue: number;
  label: string;
  color?: 'red' | 'yellow' | 'green' | 'blue';
  size?: 'small' | 'medium' | 'large';
}

export const Speedometer: React.FC<SpeedometerProps> = ({ 
  value, 
  maxValue, 
  label, 
  color = 'blue',
  size = 'medium' 
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees
  
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };
  
  const colorClasses = {
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    blue: 'text-blue-500'
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Speedometer background */}
        <svg 
          className={`w-full h-full transform -rotate-90 ${colorClasses[color]}`}
          viewBox="0 0 100 50"
        >
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeOpacity="0.2"
          />
          
          {/* Value arc */}
          <path
            d={`M 10 50 A 40 40 0 0 1 ${10 + (percentage / 100) * 80} ${50 - Math.sin((percentage / 100) * Math.PI) * 40}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Needle */}
          <line
            x1="50"
            y1="50"
            x2={50 + Math.cos(angle * Math.PI / 180) * 35}
            y2={50 - Math.sin(angle * Math.PI / 180) * 35}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill="currentColor" />
        </svg>
        
        {/* Value display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${colorClasses[color]}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Label */}
      <div className="text-center mt-2">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className={`text-lg font-bold ${colorClasses[color]}`}>
          {value.toFixed(1)}
        </div>
      </div>
    </div>
  );
}; 