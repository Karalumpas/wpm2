'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

export function ProtectedClient({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Trigger NextAuth sign-in which will redirect to /login
      void signIn(undefined, { callbackUrl: window.location.pathname });
    }
  }, [status]);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return <>{children}</>;
}
