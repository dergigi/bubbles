import NDK, { NDKNip07Signer, NDKUser } from '@nostr-dev-kit/ndk';

let ndk: NDK | null = null;
let currentUser: NDKUser | null = null;

export const initializeNDK = async () => {
  if (!ndk) {
    ndk = new NDK({
      explicitRelayUrls: [
        'wss://relay.damus.io',
        'wss://nostr.bitcoiner.social',
        'wss://relay.nostr.band'
      ]
    });

    await ndk.connect();
  }
  return ndk;
};

export const getNDK = () => {
  if (!ndk) {
    throw new Error('NDK not initialized');
  }
  return ndk;
};

export const disconnectNDK = async () => {
  if (ndk) {
    // Simply reset the NDK instance
    ndk = null;
    currentUser = null;
  }
};

export const loginWithNip07 = async (): Promise<NDKUser> => {
  if (!window.nostr) {
    throw new Error('NIP-07 extension not found. Please install a Nostr extension like Alby or nos2x.');
  }

  await initializeNDK();
  const ndk = getNDK();

  try {
    // Create a NIP-07 signer
    const signer = new NDKNip07Signer();
    
    // Set the signer on the NDK instance
    ndk.signer = signer;
    
    // Get the user's public key using window.nostr (NIP-07)
    const pubkey = await window.nostr.getPublicKey();
    
    // Create and return the user
    currentUser = ndk.getUser({ hexpubkey: pubkey });
    ndk.activeUser = currentUser;
    
    return currentUser;
  } catch (error) {
    console.error('Error during NIP-07 login:', error);
    throw new Error('Failed to connect with Nostr extension. Make sure you have approved the connection.');
  }
};

export const getCurrentUser = (): NDKUser | null => {
  return currentUser;
}; 