import React from 'react';

export interface TimeframeOption {
  label: string;
  value: number; // in seconds
}

interface TimeframeSelectorProps {
  selectedTimeframe: number; // in seconds
  onTimeframeChange: (timeframe: number) => void;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({ 
  selectedTimeframe, 
  onTimeframeChange 
}) => {
  // Define timeframe options in seconds
  const timeframes: TimeframeOption[] = [
    { label: '8 hours', value: 8 * 60 * 60 },
    { label: '24 hours', value: 24 * 60 * 60 },
    { label: '48 hours', value: 48 * 60 * 60 },
    { label: '1 week', value: 7 * 24 * 60 * 60 },
    { label: '1 month', value: 30 * 24 * 60 * 60 },
  ];

  return (
    <div className="absolute top-4 left-4 z-10 bg-gray-800 bg-opacity-80 p-2 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="text-xs text-gray-300 mb-1">Timeframe</div>
      <div className="flex gap-1">
        {timeframes.map((timeframe) => (
          <button
            key={timeframe.value}
            className={`px-2 py-1 text-xs rounded-md transition-all ${
              selectedTimeframe === timeframe.value
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => onTimeframeChange(timeframe.value)}
          >
            {timeframe.label}
          </button>
        ))}
      </div>
    </div>
  );
}; 