# Nostr Profile Explorer

A web application that visualizes your Nostr network using an interactive bubble chart. Each bubble represents a profile you follow, with the size indicating their activity level.

## Features

- NIP-07 authentication for secure login
- Interactive bubble chart visualization using D3.js
- Real-time profile data fetching from Nostr relays
- Responsive design that adapts to screen size
- Click on bubbles to view profiles in external clients

## Prerequisites

- Node.js 18.x or later
- A Nostr client with NIP-07 support (e.g., Alby, nos2x)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nostr-bubble-explorer.git
cd nostr-bubble-explorer
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. When you first visit the app, it will request permission to access your Nostr public key through NIP-07.
2. Once authenticated, it fetches your following list and their recent activity.
3. The bubble chart displays each profile as a bubble, with size indicating their activity level.
4. Hover over bubbles to see profile names and click to view them in an external client.

## Technical Details

- Built with Next.js and TypeScript
- Uses the Nostr Development Kit (NDK) for Nostr protocol interaction
- D3.js for interactive data visualization
- Responsive design using Tailwind CSS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 