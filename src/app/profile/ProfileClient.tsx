'use client';

import { signOut } from 'next-auth/react';

type ProfileClientProps = {
  user: {
    email?: string | null;
  };
};

export default function ProfileClient({ user }: ProfileClientProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-medium text-gray-500">Email</h2>
          <p className="mt-1 text-sm text-gray-900">{user.email}</p>
        </div>
        <div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
