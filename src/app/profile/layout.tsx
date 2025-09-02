import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import ProfileNavigation from './components/ProfileNavigation';

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings, AI integrations, and social media
            connections.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <ProfileNavigation />
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
