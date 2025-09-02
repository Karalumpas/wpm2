import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import SecurityClient from './SecurityClient';

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return <SecurityClient user={session.user} />;
}

export const metadata = {
  title: 'Security - Profile Settings',
};
