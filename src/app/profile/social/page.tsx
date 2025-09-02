import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import SocialIntegrationsClient from './SocialIntegrationsClient';

export default async function SocialIntegrationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return <SocialIntegrationsClient user={session.user} />;
}

export const metadata = {
  title: 'Social Media - Profile Settings',
};
