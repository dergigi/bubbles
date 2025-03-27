import { useEffect, useState } from 'react';
import { BubbleChart } from '@/components/BubbleChart';
import { LoginButton } from '@/components/LoginButton';
import { getNDK, loginWithNip07 } from '@/utils/ndk';
import { NDKUser, NDKEvent } from '@nostr-dev-kit/ndk';

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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.8,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the improved login utility
      const user = await loginWithNip07();

      // Fetch following list
      const following = await user.follows();
      
      // Fetch profiles and their activity
      const ndk = getNDK();
      const profilePromises = Array.from(following).map(async (followedUser: NDKUser) => {
        const profile = await followedUser.fetchProfile();
        const events = await ndk.fetchEvents({
          kinds: [1, 3, 7], // Text notes, contacts, reactions
          authors: [followedUser.pubkey],
          limit: 100,
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
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (npub: string) => {
    window.open(`https://snort.social/p/${npub}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-3xl font-bold mb-8">Nostr Profile Explorer</h1>
        <p className="text-lg mb-8 text-center max-w-md">
          Connect your Nostr account to explore your network in an interactive bubble chart.
          Each bubble represents a profile you follow, with size indicating their activity level.
        </p>
        <LoginButton onLogin={handleLogin} />
        <p className="mt-4 text-sm text-gray-500">
          You'll need a Nostr extension like{' '}
          <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="underline">
            Alby
          </a>{' '}
          or{' '}
          <a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer" className="underline">
            nos2x
          </a>
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading profiles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8">Nostr Profile Explorer</h1>
      <BubbleChart
        data={profiles}
        width={dimensions.width}
        height={dimensions.height}
        onProfileClick={handleProfileClick}
      />
    </main>
  );
} 