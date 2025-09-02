import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import NotificationsClient from './NotificationsClient';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return <NotificationsClient user={session.user} />;
}

export const metadata = {
  title: 'Notifications - Profile Settings',
};
