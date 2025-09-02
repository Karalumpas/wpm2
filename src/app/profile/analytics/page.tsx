import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return <AnalyticsClient user={session.user} />;
}

export const metadata = {
  title: 'Analytics - Profile Settings',
};
