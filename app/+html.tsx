import { ScrollViewStyleReset } from 'expo-router/html';

/**
 * Root HTML wrapper for the web build (Expo Router convention). Adds the meta tags that make
 * "Add to Home Screen" on iOS Safari open as a standalone app — no browser chrome, custom
 * name and icon — since Expo Go can't be used yet on this SDK version (see AGENTS.md) and this
 * is the fastest way to get something app-like on a phone in the meantime.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>Mufida&apos;s Life Choices</title>
        <meta name="theme-color" content="#332B5C" />
        <link rel="manifest" href="/manifest.json" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mufida" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.png" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
