import type { Metadata } from 'next';
import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsProvider } from '@/contexts/SettingsContext';
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
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        <SettingsProvider>
          <MainLayout>{children}</MainLayout>
        </SettingsProvider>
      </body>
    </html>
  );
}
