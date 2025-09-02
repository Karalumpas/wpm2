import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return <BillingClient user={session.user} />;
}

export const metadata = {
  title: 'Billing - Profile Settings',
};
