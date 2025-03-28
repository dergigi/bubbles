import React from 'react';

interface StatsPanelProps {
  profiles: {
    pubkey: string;
    name: string;
    activity: number;
    npub: string;
  }[];
  timeframe: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ 
  profiles, 
  timeframe 
}) => {
  if (!profiles.length) return null;

  // Calculate statistics
  const totalProfiles = profiles.length;
  const activeProfiles = profiles.filter(p => p.activity > 0).length;
  const totalEvents = profiles.reduce((sum, profile) => sum + profile.activity, 0);
  const averageEvents = totalEvents / totalProfiles;
  const mostActiveProfile = [...profiles].sort((a, b) => b.activity - a.activity)[0];
  
  // Format timeframe for display
  let timeframeLabel = '';
  if (timeframe <= 8 * 60 * 60) {
    timeframeLabel = '8 hours';
  } else if (timeframe <= 24 * 60 * 60) {
    timeframeLabel = '24 hours';
  } else if (timeframe <= 48 * 60 * 60) {
    timeframeLabel = '48 hours';
  } else if (timeframe <= 7 * 24 * 60 * 60) {
    timeframeLabel = '1 week';
  } else {
    timeframeLabel = '1 month';
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 bg-opacity-90 p-3 rounded-lg shadow-lg backdrop-blur-sm max-w-xs">
      <div className="text-xs text-gray-300 mb-2">Statistics (last {timeframeLabel})</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-gray-300">Total Profiles:</div>
        <div className="text-white font-medium">{totalProfiles}</div>
        
        <div className="text-gray-300">Active Profiles:</div>
        <div className="text-white font-medium">
          {activeProfiles} ({Math.round(activeProfiles / totalProfiles * 100)}%)
        </div>
        
        <div className="text-gray-300">Total Events:</div>
        <div className="text-white font-medium">{totalEvents}</div>
        
        <div className="text-gray-300">Average Events:</div>
        <div className="text-white font-medium">{averageEvents.toFixed(1)}</div>
        
        <div className="text-gray-300">Most Active:</div>
        <div className="text-white font-medium truncate" title={mostActiveProfile.name}>
          {mostActiveProfile.name} ({mostActiveProfile.activity})
        </div>
      </div>
    </div>
  );
}; 