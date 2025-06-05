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
        .then((data) => {
          console.log('Fetched cases:', data); // ✅ Add this for debugging
          setCases(data); // ❌ This assumes `data` is an array
        })
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
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6 border border-gray-100 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>

            {/* Header */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Create New Case</h2>
              </div>
              <p className="text-gray-600">Fill in the details below to create a new case</p>
            </div>

            <div className="space-y-8">
              {/* Basic Information */}
              <div className="relative">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-4">Required case information</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Details <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <textarea
                        placeholder="Describe the project details, requirements, and scope..."
                        value={projectDetails}
                        onChange={(e) => setProjectDetails(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300 min-h-[120px] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Toggle */}
              <div className="border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="group inline-flex items-center px-5 py-3 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
                >
                  <div className={`mr-3 p-1 rounded-full transition-colors duration-200 ${showContactInfo ? 'bg-indigo-100' : 'bg-gray-100 group-hover:bg-indigo-100'}`}>
                    <svg
                      className={`h-4 w-4 transition-all duration-200 ${showContactInfo ? 'text-indigo-600 rotate-90' : 'text-gray-500 group-hover:text-indigo-600'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {showContactInfo ? 'Hide Contact Information' : 'Add Contact Information (Optional)'}
                </button>
              </div>

              {/* Contact Information (Expandable) */}
              {showContactInfo && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-4">Optional contact details for this case</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Company or organization"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Primary contact name"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          placeholder="contact@example.com"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Street address, city, state, zip code"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex gap-4">
                  <button
                    onClick={createCase}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Case
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsFormExpanded(false)}
                    className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cases List with Filters */}
        <div>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Existing Cases</h2>
                <p className="text-sm text-gray-600">Manage and track your project cases</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300"
                />
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as 'createdAt' | 'updatedAt')}
                  className="border-0 bg-transparent text-sm focus:ring-0 focus:outline-none pr-8 text-gray-700 font-medium"
                >
                  <option value="createdAt">Created At</option>
                  <option value="updatedAt">Updated At</option>
                  <option value="customerName">Customer Name</option>
                  <option value="projectDetails">Project Details</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  {sortOrder === 'asc' ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Asc
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Desc
                    </>
                  )}
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {[
                  { key: 'all', label: 'All', color: 'gray' },
                  { key: 'new', label: 'New', color: 'yellow' },
                  { key: 'active', label: 'Active', color: 'green' },
                  { key: 'completed', label: 'Completed', color: 'blue' }
                ].map((filter, index) => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterStatus(filter.key)}
                    className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 relative ${
                      filterStatus === filter.key
                        ? filter.color === 'gray' 
                          ? 'bg-gray-600 text-white shadow-md'
                          : filter.color === 'yellow'
                          ? 'bg-yellow-500 text-white shadow-md'
                          : filter.color === 'green'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    } ${index > 0 ? 'border-l border-gray-200' : ''}`}
                  >
                    {filter.label}
                    {filterStatus === filter.key && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white opacity-75"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredCases.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-white rounded-full shadow-lg inline-block mb-6">
                  <svg
                    className="h-16 w-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No cases found</h3>
                <p className="text-gray-600 mb-6">
                  {filterStatus !== 'all' 
                    ? `No cases match the "${filterStatus}" filter criteria.`
                    : "You haven't created any cases yet. Start by creating your first case."
                  }
                </p>
                {filterStatus !== 'all' && (
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    View all cases
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="group bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:transform hover:scale-[1.02]"
                >
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-800 truncate group-hover:text-indigo-600 transition-colors duration-200">
                          {c.customerName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-gray-500">{c.user?.name || 'Unknown'}</span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          c.status.toLowerCase() === 'active'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : c.status.toLowerCase() === 'completed'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : c.status.toLowerCase() === 'new'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-2">
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {c.projectDetails.length > 120 
                          ? `${c.projectDetails.slice(0, 120)}...`
                          : c.projectDetails
                        }
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Created {new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => router.push(`/dashboard/${c.id}`)}
                      className="w-full mt-4 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] group"
                    >
                      <svg
                        className="h-5 w-5 mr-2 group-hover:rotate-3 transition-transform duration-200"
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
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
