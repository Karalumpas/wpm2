import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function Page() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  return <ProfileClient user={session.user} />;
}

export const metadata = {
  title: 'Profile - WooCommerce Product Manager',
};
