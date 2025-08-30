import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const APP_NAME = "TunePocket";
const APP_DESCRIPTION = "A Telegram Mini App for playing and organizing your music, offline.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#A020F0",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Belleza&display=swap" rel="stylesheet" />
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
        <script src="https://cdn.jsdelivr.net/npm/music-metadata-browser@2.5.10/dist/music-metadata-browser.min.js" async></script>
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

const ServiceWorkerRegistration = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('SW registered: ', registration);
              }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
              });
            });
          }
        `,
      }}
    />
  );
};
