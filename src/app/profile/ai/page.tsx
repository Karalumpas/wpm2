import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import AIIntegrationsClient from './AIIntegrationsClient';

export default async function AIIntegrationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return <AIIntegrationsClient user={session.user} />;
}

export const metadata = {
  title: 'AI Integrations - Profile Settings',
};
