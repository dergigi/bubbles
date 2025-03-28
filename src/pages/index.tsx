import { useEffect, useState, useMemo } from 'react';
import { BubbleChart } from '@/components/BubbleChart';
import { LoginButton } from '@/components/LoginButton';
import { TimeframeSelector } from '@/components/TimeframeSelector';
import { StatsPanel } from '@/components/StatsPanel';
import { FilterToggle } from '@/components/FilterToggle';
import { getNDK, loginWithNip07 } from '@/utils/ndk';
import { NDKUser, NDKEvent } from '@nostr-dev-kit/ndk';

// Maximum number of events to fetch per profile
const MAX_EVENTS_PER_PROFILE = 210;

// Default timeframe is 1 week in seconds
const DEFAULT_TIMEFRAME = 7 * 24 * 60 * 60;

interface Profile {
  pubkey: string;
  name: string;
  activity: number;
  npub: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timeframe, setTimeframe] = useState<number>(DEFAULT_TIMEFRAME);
  const [currentUser, setCurrentUser] = useState<NDKUser | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Filter profiles based on showOnlyActive toggle
  const filteredProfiles = useMemo(() => {
    if (!showOnlyActive) return profiles;
    return profiles.filter(profile => profile.activity > 0);
  }, [profiles, showOnlyActive]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to fetch data when timeframe changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchProfileData(currentUser, timeframe);
    }
  }, [timeframe, isAuthenticated, currentUser]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the improved login utility
      const user = await loginWithNip07();
      setCurrentUser(user);
      
      // Fetch data with the default timeframe
      await fetchProfileData(user, timeframe);
      
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileData = async (user: NDKUser, selectedTimeframe: number) => {
    try {
      setLoading(true);
      
      // Calculate timestamp for the selected timeframe
      const sinceTimestamp = Math.floor(Date.now() / 1000) - selectedTimeframe;
      
      // Fetch following list
      const following = await user.follows();
      
      // Fetch profiles and their activity
      const ndk = getNDK();
      const profilePromises = Array.from(following).map(async (followedUser: NDKUser) => {
        const profile = await followedUser.fetchProfile();
        const events = await ndk.fetchEvents({
          kinds: [1, 3, 7], // Text notes, contacts, reactions
          authors: [followedUser.pubkey],
          since: sinceTimestamp,
          limit: MAX_EVENTS_PER_PROFILE, // Add a limit to prevent excessive data fetching
        });

        return {
          pubkey: followedUser.pubkey,
          name: profile?.name || followedUser.pubkey.slice(0, 8),
          activity: Array.from(events).length,
          npub: followedUser.npub,
        };
      });

      const profilesData = await Promise.all(profilePromises);
      setProfiles(profilesData);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError(err instanceof Error ? err.message : 'An error fetching profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (newTimeframe: number) => {
    setTimeframe(newTimeframe);
  };

  const handleFilterToggle = () => {
    setShowOnlyActive(!showOnlyActive);
  };

  const handleProfileClick = (npub: string) => {
    window.open(`https://snort.social/p/${npub}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-2xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Nostr Profile Explorer</h1>
          <p className="text-lg mb-8 text-center opacity-80">
            Connect your Nostr account to visualize your network in an interactive bubble chart.
          </p>
          <LoginButton onLogin={handleLogin} />
          <p className="mt-6 text-sm text-center text-gray-400">
            You'll need a Nostr extension like{' '}
            <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              Alby
            </a>{' '}
            or{' '}
            <a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              nos2x
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (loading && profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl flex items-center">
          <svg className="animate-spin mr-3 h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading profiles...
        </div>
      </div>
    );
  }

  if (error && profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-900 w-full h-full">
      {/* The main canvas */}
      <div className="relative w-full h-full">
        <BubbleChart
          data={filteredProfiles}
          width={dimensions.width}
          height={dimensions.height}
          onProfileClick={handleProfileClick}
        />

        {/* UI Elements */}
        <TimeframeSelector 
          selectedTimeframe={timeframe} 
          onTimeframeChange={handleTimeframeChange} 
        />
        
        <FilterToggle
          showOnlyActive={showOnlyActive}
          onToggle={handleFilterToggle}
        />
        
        <StatsPanel 
          profiles={profiles} 
          timeframe={timeframe} 
        />
        
        {/* Loading indicator when refreshing data */}
        {loading && profiles.length > 0 && (
          <div className="fixed top-4 right-4 z-50 bg-gray-800 bg-opacity-90 p-3 rounded-lg shadow-lg">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
} 