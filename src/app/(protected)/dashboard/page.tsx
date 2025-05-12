'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSession, signOut } from 'next-auth/react';

interface Case {
  id: string;
  customerName: string;
  projectDetails: string;
  status: string;
  createdAt: string;
  updatedAt: string;
    // Add these fields from your Prisma schema
  schoolName: string;
  contactPerson: string;
  emailAddress: string;
  phoneNumber: string;
  schoolAddress: string;
    
    // You might also need these fields for search functionality
  lightingPurpose?: string;
  facilitiesUsedIn?: string;
  installationService?: string;

  user: {
    name: string | null;
    email: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();

  const { data: session, status } = useSession();

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Basic information
  const [customerName, setCustomerName] = useState('');
  const [projectDetails, setProjectDetails] = useState('');

  // Contact information
  const [organizationName, setOrganizationName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  // Form section visibility
  const [showContactInfo, setShowContactInfo] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const [sortKey, setSortKey] = useState<
    'customerName' | 'projectDetails' | 'status' | 'createdAt' | 'updatedAt'
  >('createdAt');

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const searchFields = [
    'customerName',
    'projectDetails',
    'contactPerson',
    'schoolName',
    'emailAddress',
    'phoneNumber',
    'schoolAddress',
    'lightingPurpose',
    'facilitiesUsedIn',
    'installationService',
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      fetch('/api/cases')
        .then((res) => res.json())
        .then(setCases)
        .catch(console.error);
    }
  }, [status]);

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
      toast.error('Customer name and project details are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          projectDetails,
          schoolName: organizationName,
          contactPerson,
          emailAddress,
          phoneNumber,
          schoolAddress: address,
          // Additional required fields with defaults
          lightingPurpose: '',
          facilitiesUsedIn: '',
          installationService: 'Not Sure',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create case.');
      }

      // Reset form fields
      setCustomerName('');
      setProjectDetails('');
      setOrganizationName('');
      setContactPerson('');
      setEmailAddress('');
      setPhoneNumber('');
      setAddress('');
      setShowContactInfo(false);

      // Collapse form and refresh cases
      setIsFormExpanded(false);
      toast.success('Case created successfully!');
      await fetchCases();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create case.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases
    .filter((c) => filterStatus === 'all' || c.status.toLowerCase() === filterStatus)
    .filter((c) => {
      const search = searchTerm.toLowerCase();
      return (
        (c.customerName && c.customerName.toLowerCase().includes(search)) ||
        (c.projectDetails && c.projectDetails.toLowerCase().includes(search)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(search)) ||
        (c.schoolName && c.schoolName.toLowerCase().includes(search)) ||
        (c.emailAddress && c.emailAddress.toLowerCase().includes(search)) ||
        (c.user?.name && c.user.name.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];

      if (sortKey === 'createdAt' || sortKey === 'updatedAt') {
        // convert to timestamps for date fields
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        // lowercase strings for comparison
        aVal = aVal?.toLowerCase();
        bVal = bVal?.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Get counts for dashboard stats
  const totalCases = cases.length;
  const activeCases = cases.filter((c) => c.status.toLowerCase() === 'active').length;
  const completedCases = cases.filter((c) => c.status.toLowerCase() === 'completed').length;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Checking session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    // Router.replace already handles redirect, just return null
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-700 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Internal Dashboard - Cases</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              className="bg-white text-indigo-700 px-4 py-2 rounded-md shadow-sm hover:bg-indigo-50 transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Case
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full bg-indigo-100 p-3 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cases</p>
                <p className="text-2xl font-bold text-gray-800">{totalCases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Cases</p>
                <p className="text-2xl font-bold text-gray-800">{activeCases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Cases</p>
                <p className="text-2xl font-bold text-gray-800">{completedCases}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create New Case Form (Collapsible) */}
        {isFormExpanded && (
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4 border-l-4 border-indigo-500 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800">Create New Case</h2>

            <div className="space-y-5">
              {/* Basic Information */}
              <div>
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-700">Basic Information</h3>
                  <p className="text-sm text-gray-500">Required case information</p>
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <textarea
                    placeholder="Project Details *"
                    value={projectDetails}
                    onChange={(e) => setProjectDetails(e.target.value)}
                    className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[100px]"
                  />
                </div>
              </div>

              {/* Contact Information Toggle */}
              <button
                type="button"
                onClick={() => setShowContactInfo(!showContactInfo)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {showContactInfo ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    Hide Contact Information
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    Add Contact Information (Optional)
                  </>
                )}
              </button>

              {/* Contact Information (Expandable) */}
              {showContactInfo && (
                <div className="pt-2 pb-2 animate-fadeIn">
                  <div className="mb-4">
                    <h3 className="text-md font-medium text-gray-700">Contact Information</h3>
                    <p className="text-sm text-gray-500">Optional contact details</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Organization Name"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Contact Person"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={createCase}
                  disabled={loading}
                  className="bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium flex-1"
                >
                  {loading ? 'Creating...' : 'Create Case'}
                </button>
                <button
                  onClick={() => setIsFormExpanded(false)}
                  className="border border-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cases List with Filters */}
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Existing Cases</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as 'createdAt' | 'updatedAt')}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="createdAt">Created At</option>
                  <option value="updatedAt">Updated At</option>
                  <option value="customerName">Customer Name</option>
                  <option value="projectDetails">Project Details</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 transition"
                >
                  {sortOrder === 'asc' ? 'Asc ↑' : 'Desc ↓'}
                </button>
              </div>
              <div className="flex border border-gray-300 rounded-md overflow-hidden divide-x divide-gray-300">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 text-sm font-medium ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 text-sm font-medium ${filterStatus === 'active' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('new')}
                  className={`px-3 py-1.5 text-sm font-medium ${filterStatus === 'new' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  New
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-1.5 text-sm font-medium ${filterStatus === 'completed' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {filteredCases.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-500 text-lg">No cases found with the selected filter.</p>
              {filterStatus !== 'all' && (
                <button
                  onClick={() => setFilterStatus('all')}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View all cases
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-gray-800">{c.customerName}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.status.toLowerCase() === 'active'
                            ? 'bg-green-100 text-green-800'
                            : c.status.toLowerCase() === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : c.status.toLowerCase() === 'new'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-gray-600">{c.projectDetails.slice(0, 100)}...</p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(c.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">User: {c.user?.name || 'Unknown'}</p>
                    <button
                      onClick={() => router.push(`/dashboard/${c.id}`)}
                      className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
