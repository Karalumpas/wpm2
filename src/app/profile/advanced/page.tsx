import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import AdvancedClient from './AdvancedClient';

export default async function AdvancedPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return <AdvancedClient user={session.user} />;
}

export const metadata = {
  title: 'Advanced Settings - Profile Settings',
};
