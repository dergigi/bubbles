import React from 'react';

interface FilterToggleProps {
  showOnlyActive: boolean;
  onToggle: () => void;
}

export const FilterToggle: React.FC<FilterToggleProps> = ({
  showOnlyActive,
  onToggle,
}) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 bg-gray-800 bg-opacity-80 p-2 rounded-lg shadow-lg backdrop-blur-sm">
      <label className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={showOnlyActive}
            onChange={onToggle}
          />
          <div className={`block w-10 h-6 rounded-full transition-colors ${
            showOnlyActive ? 'bg-blue-600' : 'bg-gray-600'
          }`}></div>
          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
            showOnlyActive ? 'transform translate-x-4' : ''
          }`}></div>
        </div>
        <div className="ml-3 text-white text-sm">
          {showOnlyActive ? 'Showing active only' : 'Showing all profiles'}
        </div>
      </label>
    </div>
  );
}; 