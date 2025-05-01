'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailToUpdate, setEmailToUpdate] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdate = async () => {
    setLoading(true);
    const res = await fetch('/api/user/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success('Profile updated');
    } else {
      toast.error(result.error || 'Update failed');
    }
    setLoading(false);
  };

  const handleAdminPasswordReset = async () => {
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToUpdate, password: newPassword }),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success('Password updated');
      setEmailToUpdate('');
      setNewPassword('');
    } else {
      toast.error(result.error || 'Failed to update password');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <input
        type="password"
        placeholder="New Password (optional)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <button
        onClick={handleUpdate}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mb-6"
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Save Changes'}
      </button>

      {(session?.user as { role?: string })?.role === 'ADMIN' && (
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-3">Reset Another User's Password</h2>
          <input
            type="email"
            placeholder="User Email"
            value={emailToUpdate}
            onChange={(e) => setEmailToUpdate(e.target.value)}
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />
          <button
            onClick={handleAdminPasswordReset}
            className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700"
          >
            Reset Password
          </button>
        </div>
      )}
    </div>
  );
}