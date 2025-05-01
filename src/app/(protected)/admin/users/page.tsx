'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminPortalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '', role: 'USER' });

  useEffect(() => {
    if ((session?.user as { role?: string })?.role !== 'ADMIN'){
      toast.error('Access denied.');
      router.replace('/');
      return;
    }

    fetchUsers();
  }, [session, router]);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (res.ok) {
      setUsers(data);
    } else {
      toast.error(data.error || 'Failed to fetch users');
    }
  };

  const handleCreateUser = async () => {
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });

    const result = await res.json();
    if (res.ok) {
      toast.success('User created!');
      setNewUser({ email: '', name: '', password: '', role: 'USER' });
      fetchUsers();
    } else {
      toast.error(result.error || 'Failed to create user');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Portal</h1>
      <p className="mb-4">Manage users and permissions.</p>

      <div className="mb-6 border p-4 rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Create New User</h2>
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          className="w-full border p-2 rounded mb-2"
        />
        <input
          type="text"
          placeholder="Name"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          className="w-full border p-2 rounded mb-2"
        />
        <input
          type="password"
          placeholder="Temporary Password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          className="w-full border p-2 rounded mb-2"
        />
        <select
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          className="w-full border p-2 rounded mb-2"
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

      <table className="w-full table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left">Email</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.name}</td>
              <td className="border p-2">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
