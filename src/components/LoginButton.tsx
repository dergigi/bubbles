import { useState } from 'react';

interface LoginButtonProps {
  onLogin: () => Promise<void>;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="relative w-full px-8 py-4 text-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
      >
        <div className="flex items-center justify-center">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a1 1 0 10-2 0 8 8 0 0016 0 1 1 0 10-2 0 5.986 5.986 0 00-.454-2.084A5 5 0 0010 11z" clipRule="evenodd"></path>
              </svg>
              Connect with Nostr
            </>
          )}
        </div>
      </button>
      {error && (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-2">
            Make sure you have a Nostr extension (like Alby or nos2x) installed and unlocked
          </p>
        </div>
      )}
    </div>
  );
}; 