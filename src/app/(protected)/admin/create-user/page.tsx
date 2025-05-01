'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateUserPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [tempPassword, setTempPassword] = useState('');

  const handleCreateUser = async () => {
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role, password: tempPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      toast.success('User created!');
      router.push('/admin/users');
    } else {
      toast.error(data.error || 'Failed to create user');
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New User</h1>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <input
        type="password"
        placeholder="Temporary Password"
        value={tempPassword}
        onChange={(e) => setTempPassword(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
        className="w-full border p-2 rounded mb-4"
      >
        <option value="USER">User</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button
        onClick={handleCreateUser}
        className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
      >
        Create User
      </button>
    </div>
  );
}