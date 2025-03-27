interface NostrWindow extends Window {
  nostr?: {
    getPublicKey(): Promise<string>;
  };
}

declare global {
  interface Window extends NostrWindow {}
} 