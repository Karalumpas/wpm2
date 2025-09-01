import type { Metadata } from 'next';
import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SessionProvider } from '@/components/providers/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'WooCommerce Product Manager v2',
  description: 'Advanced product management for WooCommerce',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      data-theme="ocean" 
      data-color-mode="light" 
      data-font="sans"
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning={true}>
        <SessionProvider>
          <SettingsProvider>
            <MainLayout>{children}</MainLayout>
          </SettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
