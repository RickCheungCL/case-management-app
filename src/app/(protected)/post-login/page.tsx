'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PostLoginPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <button
        onClick={handleSignOut}
        className="absolute top-4 right-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
      >
        Logout
      </button>
      <div className="bg-white p-6 rounded shadow-md max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">Welcome {session?.user?.name || ''}!</h1>
        <p className="text-gray-600">Where would you like to go?</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.replace('/dashboard')}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/estimate')}
            className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Go to Delivery Planner
          </button>
          <button
            onClick={() => router.push('/financeCalculator')}
            className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
          >
            Go to Finance Calculator
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
          >
            Go to Profile (Change Info)
          </button>
          {(session?.user as { role?: string })?.role === 'ADMIN' && (
            <button
              onClick={() => router.push('/admin/users')}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Go to Admin Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
