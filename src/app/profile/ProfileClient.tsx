'use client';

import { signOut } from 'next-auth/react';

type ProfileClientProps = {
  user: {
    email?: string | null;
  };
};

export default function ProfileClient({ user }: ProfileClientProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100/50 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
          
          <div className="space-y-8">
            <div className="p-6 bg-gray-50 rounded-xl">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Email Address</h2>
              <p className="text-gray-700 font-medium">{user.email}</p>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
