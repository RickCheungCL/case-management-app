'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Case {
  id: string;
  customerName: string;
  projectDetails: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [projectDetails, setProjectDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchCases = async () => {
    const res = await fetch('/api/cases');
    const data = await res.json();
    setCases(data);
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const createCase = async () => {
    if (!customerName || !projectDetails) {
      alert('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerName, projectDetails }),
      });

      if (!res.ok) {
        throw new Error('Failed to create case.');
      }

      setCustomerName('');
      setProjectDetails('');
      await fetchCases();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Internal Dashboard - Cases</h1>

      {/* Create New Case Form */}
      <div className="border p-6 rounded shadow space-y-4 max-w-xl">
        <h2 className="text-xl font-semibold">Create New Case</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="border p-2 rounded"
          />
          <textarea
            placeholder="Project Details"
            value={projectDetails}
            onChange={(e) => setProjectDetails(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={createCase}
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Case'}
          </button>
        </div>
      </div>

      {/* Cases List */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Existing Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <div key={c.id} className="border p-6 rounded shadow space-y-2">
              <h3 className="font-bold text-lg">{c.customerName}</h3>
              <p className="text-gray-700">{c.projectDetails.slice(0, 80)}...</p>
              <p className="text-xs text-gray-500">Status: {c.status}</p>
              <p className="text-xs text-gray-400">
                Created: {new Date(c.createdAt).toLocaleString()}
              </p>
              <button
                onClick={() => router.push(`/dashboard/${c.id}`)}
                className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
