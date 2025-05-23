'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import OnSiteVisitForm from '../../components/onsiteVisitForm';
import Link from 'next/link';
interface Photo {
  id: string;
  url: string;
  comment?: string;
  customName?: string;
  uploadedViaLink?: boolean;
}

interface FixtureType {
  id: string;
  name: string;
  description?: string;
}

interface CaseFixtureCount {
  id: string;
  count: number;
  fixtureType: FixtureType;
}

interface InstallationTag {
  id: string;
  name: string;
}

interface InstallationDetailTag {
  id: string;
  tag: InstallationTag;
}

interface InstallationDetail {
  id: string;
  ceilingHeight?: number;
  notes?: string;
  tags: InstallationDetailTag[];
}

interface Document {
  id: string;
  url: string;
  fileName: string;
  customName?: string;
  uploadedViaLink?: boolean;
}

interface Case {
  id: string;
  customerName: string;
  projectDetails: string;
  photos: Photo[];
  documents: Document[];
  status: string;
  createdAt: string;

  // Organization Info Fields
  schoolName: string;
  contactPerson: string;
  emailAddress: string;
  phoneNumber: string;
  schoolAddress: string;

  // Light Fixture Counts
  num2FtLinearHighBay: number;
  num150WUFOHighBay: number;
  num240WUFOHighBay: number;
  num2x2LEDPanel: number;
  num2x4LEDPanel: number;
  num1x4LEDPanel: number;
  num4FtStripLight: number;

  // Project Details
  lightingPurpose: string;
  facilitiesUsedIn: string;
  installationService: string;

  fixtureCounts: {
    id: string;
    count: number;
    fixtureType: {
      id: string;
      name: string;
      description?: string;
    };
  }[];
  installationDetail?: {
    id: string;
    ceilingHeight?: number;
    notes?: string;
    tags: {
      id: string;
      tag: {
        id: string;
        name: string;
      };
    }[];
  };
}

interface FixtureCount {
  fixtureType: { id: string; name: string;description?: string; };
  fixtureTypeId: string;
  count: number;
}

export default function CaseDetailsPage() {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<
    | 'details'
    | 'viewDocs'
    | 'uploadDocs'
    | 'viewPhotos'
    | 'uploadPhotos'
    | 'contactInfo'
    | 'lightingDetails'
    | 'lightingService'
    | 'onSiteVisitForm'
  >('details');
  const [isLinkExpanded, setIsLinkExpanded] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Document and photo state
  const [editedDocNames, setEditedDocNames] = useState<Record<string, string>>({});
  const [docChanged, setDocChanged] = useState(false);
  const [editedPhotoComments, setEditedPhotoComments] = useState<Record<string, string>>({});
  const [photoChanged, setPhotoChanged] = useState(false);

  // Contact information editing state
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedContactInfo, setEditedContactInfo] = useState({
    schoolName: '',
    contactPerson: '',
    emailAddress: '',
    phoneNumber: '',
    schoolAddress: '',
  });
  const [newFixtureTypeId, setNewFixtureTypeId] = useState<string>('');
  const [newFixtureCount, setNewFixtureCount] = useState<number>(0);
  const [adding, setAdding] = useState(false);
  // Lighting details editing state
  const [isEditingLighting, setIsEditingLighting] = useState(false);
  const [editedFixtureCounts, setEditedFixtureCounts] = useState({
    num2FtLinearHighBay: 0,
    num150WUFOHighBay: 0,
    num240WUFOHighBay: 0,
    num2x2LEDPanel: 0,
    num2x4LEDPanel: 0,
    num1x4LEDPanel: 0,
    num4FtStripLight: 0,
  });
  const [editedLightingSpecs, setEditedLightingSpecs] = useState({
    lightingPurpose: '',
    facilitiesUsedIn: '',
    installationService: 'Not Sure',
  });

  const [isEditingInstallation, setIsEditingInstallation] = useState(false);
  const [editedInstallationDetail, setEditedInstallationDetail] = useState<{
    ceilingHeight: string;
    notes: string;
    tagIds: string[];
  }>({
    ceilingHeight: '',
    notes: '',
    tagIds: [],
  });

  // Tags editing state
  const [newTagId, setNewTagId] = useState('');
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);

  const [fixtureCounts, setFixtureCounts] = useState<FixtureCount[]>([]);
  const [fixtureTypes, setFixtureTypes] = useState<FixtureType[]>([]);

  const [installationTags, setInstallationTags] = useState<InstallationTag[]>([]);
  const [operationHoursPerDay, setOperationHoursPerDay] = useState<number>(0);
  const [operationDaysPerYear, setOperationDaysPerYear] = useState<number>(0);

  const fetchFixtures = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/fixtures`);
      if (!res.ok) {
        throw new Error('Failed to fetch fixtures');
      }
      const data = await res.json();
      console.log('Fetched fixtures:', data); // Log the structure
      setFixtureCounts(data);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      toast.error('Failed to load fixtures');
    }
  };

  const fetchFixtureTypes = async () => {
    const res = await fetch('/api/fixture-types'); // Path may need adjustment
    const data = await res.json();
    setFixtureTypes(data);
  };

  const addFixture = async () => {
    if (!newFixtureTypeId || newFixtureCount <= 0) {
      toast.error('Please select a fixture type and enter a valid count');
      return;
    }

    try {
      setAdding(true);

      console.log('Adding fixture:', { fixtureTypeId: newFixtureTypeId, count: newFixtureCount });

      const res = await fetch(`/api/cases/${caseId}/fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixtureTypeId: newFixtureTypeId,
          count: newFixtureCount,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || 'Failed to add fixture');
      }

      toast.success('Fixture added!');
      setNewFixtureTypeId('');
      setNewFixtureCount(1);
      fetchFixtures(); // Refresh the fixture list
    } catch (err) {
      console.error('Add error:', err);
      // Fix the TypeScript error by safely accessing the message property
      toast.error(`Error adding fixture: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAdding(false);
    }
  };
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const fetchCase = async () => {
    const res = await fetch(`/api/cases/${caseId}`);
    const data = await res.json();
    setCaseData(data);

    // Initialize the editable fields with current values
    if (data) {
      setEditedContactInfo({
        schoolName: data.schoolName,
        contactPerson: data.contactPerson,
        emailAddress: data.emailAddress,
        phoneNumber: data.phoneNumber,
        schoolAddress: data.schoolAddress,
      });

      setEditedFixtureCounts({
        num2FtLinearHighBay: data.num2FtLinearHighBay,
        num150WUFOHighBay: data.num150WUFOHighBay,
        num240WUFOHighBay: data.num240WUFOHighBay,
        num2x2LEDPanel: data.num2x2LEDPanel,
        num2x4LEDPanel: data.num2x4LEDPanel,
        num1x4LEDPanel: data.num1x4LEDPanel,
        num4FtStripLight: data.num4FtStripLight,
      });

      setEditedLightingSpecs({
        lightingPurpose: data.lightingPurpose,
        facilitiesUsedIn: data.facilitiesUsedIn,
        installationService: data.installationService,
      });
    }
  };

  // Add this with your other fetch functions
  const fetchInstallationTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setInstallationTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  const fetchOperationSettings = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/operation`);
      if (!res.ok) throw new Error('Failed to fetch operation settings');
      const data = await res.json();
  
      setOperationHoursPerDay(data.operationHoursPerDay);
      setOperationDaysPerYear(data.operationDaysPerYear);
    } catch (error) {
      console.error('Error loading operation settings:', error);
    }
  };
  const fetchAvailableTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${caseId}`;

  useEffect(() => {
    fetchCase();
    fetchFixtures();
    fetchFixtureTypes();
    fetchAvailableTags();
    fetchInstallationTags();
    fetchOperationSettings();
  }, [caseId]);

  useEffect(() => {
    if (caseData?.installationDetail) {
      setEditedInstallationDetail({
        ceilingHeight: caseData.installationDetail.ceilingHeight?.toString() || '',
        notes: caseData.installationDetail.notes || '',
        tagIds: (caseData.installationDetail.tags?.map((tagWrapper) =>
          tagWrapper.tag.id.toString(),
        ) || []) as string[],
      });
    }
  }, [caseData?.installationDetail]);
  //const handleUpload = async (uploadType: 'photo' | 'document') => {
  //
  //if (!files.length) {
  //  toast.error('Please select files first!');
  //  return;
  //}

  //const formData = new FormData();
  //files.forEach((file) => formData.append('files', file));
  //formData.append('caseId', caseId as string);

  //const res = await fetch(`/api/${uploadType}/upload`, {
  //  method: 'POST',
  //  body: formData,
  //});

  const handleUpload = async (uploadType: 'photo' | 'document') => {
    if (isUploading) return;
    const selectedFiles = uploadType === 'photo' ? photoFiles : documentFiles;

    if (!selectedFiles.length) {
      toast.error('Please select files first!');
      return;
    }

    try {
      setIsUploading(true); // Set uploading state at the beginning

      await Promise.all(
        selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('caseId', caseId as string);
          formData.append('uploadedViaLink', 'true');

          if (uploadType === 'photo') {
            formData.append('comment', ''); // Optional for now
          } else {
            formData.append('customName', file.name);
          }

          const res = await fetch(`/api/${uploadType}/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }
        }),
      );

      toast.success(`${uploadType === 'photo' ? 'Photos' : 'Documents'} uploaded successfully!`);

      // Clear files based on type (removed redundant code)
      if (uploadType === 'photo') {
        setPhotoFiles([]);
      } else {
        setDocumentFiles([]);
      }

      fetchCase(); // Refresh
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  //if (res.ok) {
  //  toast.success(`${uploadType === 'photo' ? 'Photos' : 'Documents'} uploaded successfully!`);
  //  setFiles([]);
  //  fetchCase();
  //} else {
  //  toast.error('Upload failed!');
  //}
  //}}};
  const handleOperationHoursChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedHours = parseInt(e.target.value) || 0;
    setOperationHoursPerDay(updatedHours);
  
    await fetch(`/api/cases/${caseId}/operation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationHoursPerDay: updatedHours,
        operationDaysPerYear, // ✅ use current value
      }),
    });
  };
  
  const handleOperationDaysChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedDays = parseInt(e.target.value) || 0;
    setOperationDaysPerYear(updatedDays);
  
    await fetch(`/api/cases/${caseId}/operation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationHoursPerDay, // ✅ use current value
        operationDaysPerYear: updatedDays,
      }),
    });
  };
  
  
  // Function to update contact information
  const updateContactInfo = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolName: editedContactInfo.schoolName,
          contactPerson: editedContactInfo.contactPerson,
          emailAddress: editedContactInfo.emailAddress,
          phoneNumber: editedContactInfo.phoneNumber,
          schoolAddress: editedContactInfo.schoolAddress,
        }),
      });

      if (res.ok) {
        toast.success('Contact information updated successfully!');
        setIsEditingContact(false);
        fetchCase();
      } else {
        toast.error('Failed to update contact information');
      }
    } catch (error) {
      console.error('Error updating contact information:', error);
      toast.error('An error occurred while updating contact information');
    }
  };

  // Function to update lighting details
  const updateLightingDetails = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editedFixtureCounts,
          ...editedLightingSpecs,
        }),
      });

      if (res.ok) {
        toast.success('Lighting details updated successfully!');
        setIsEditingLighting(false);
        fetchCase();
      } else {
        toast.error('Failed to update lighting details');
      }
    } catch (error) {
      console.error('Error updating lighting details:', error);
      toast.error('An error occurred while updating lighting details');
    }
  };

  if (!caseData) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Close Button */}
      <div className="bg-indigo-700 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Case: {caseData.customerName}</h1>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="rounded-full bg-indigo-800 hover:bg-indigo-900 p-2 transition-colors"
            aria-label="Close and return to dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Collapsible Customer Upload Section */}
        <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden">
          <button
            onClick={() => setIsLinkExpanded(!isLinkExpanded)}
            className="w-full flex items-center justify-between p-4 text-left bg-indigo-50 hover:bg-indigo-100 transition"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-indigo-600 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-800">Customer Upload Link</h2>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-indigo-600 transition-transform ${isLinkExpanded ? 'transform rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {isLinkExpanded && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={uploadUrl}
                  readOnly
                  className="w-full border border-gray-300 p-3 rounded-md bg-gray-50 text-gray-700"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadUrl);
                    toast.success('Upload link copied to clipboard!');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md transition flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex flex-wrap -mb-px">
            {[
              { id: 'details', label: 'Details' },
              { id: 'viewDocs', label: 'View Documents' },
              { id: 'uploadDocs', label: 'Upload Documents' },
              { id: 'viewPhotos', label: 'View Photos' },
              { id: 'uploadPhotos', label: 'Upload Photos' },
              { id: 'contactInfo', label: 'Contact Information' },
              { id: 'lightingDetails', label: 'Lighting Details' },
              { id: 'lightingService', label: 'Lighting & Service Requirement' },
              { id: 'onSiteVisitForm', label: 'onSiteVisitForm' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center px-4 py-3 font-medium text-sm rounded-t-lg ${
                  activeTab === tab.id
                    ? 'border-b-2 border-indigo-600 text-indigo-600 active'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Details Tab */}
          {activeTab === 'details' && (
            // Your existing Details tab code
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Case Details</h3>

              {/* Basic Information */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg flex justify-between items-center">
                  <h4 className="font-medium text-gray-700">Basic Information</h4>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-500">Status:</span>
                    <select
                      value={caseData.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          const res = await fetch(`/api/cases/${caseId}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ status: newStatus }),
                          });

                          if (res.ok) {
                            toast.success(`Case status updated to "${newStatus}"`);
                            fetchCase();
                          } else {
                            toast.error('Failed to update case status');
                          }
                        } catch (error) {
                          console.error('Error updating status:', error);
                          toast.error('An error occurred while updating status');
                        }
                      }}
                      className="border border-gray-300 rounded p-1 text-sm bg-white"
                    >
                      <option value="New">New</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-1">Customer</h5>
                        <p className="text-gray-800 font-medium">{caseData.customerName}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-1">Status</h5>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            caseData.status === 'New'
                              ? 'bg-yellow-100 text-yellow-800'
                              : caseData.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : caseData.status === 'Completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {caseData.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Project Details</h5>
                      <p className="text-gray-700 whitespace-pre-line">{caseData.projectDetails}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Case Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Documents</p>
                    <p className="text-xl font-bold text-gray-800">{caseData.documents.length}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center">
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Photos</p>
                    <p className="text-xl font-bold text-gray-800">{caseData.photos.length}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created On</p>
                    <p className="text-md font-bold text-gray-800">
                      {new Date(caseData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-700 mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab('viewDocs')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    View Documents
                  </button>
                  <button
                    onClick={() => setActiveTab('viewPhotos')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    View Photos
                  </button>
                  <button
                    onClick={() => setIsLinkExpanded(!isLinkExpanded)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Customer Upload Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Documents & Upload Documents tabs remain unchanged */}
          {activeTab === 'viewDocs' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Documents</h3>
              <ul className="space-y-3">
                {caseData.documents.map((doc) => (
                  <li key={doc.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <svg
                          className="w-8 h-8 text-red-500 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {doc.customName || doc.fileName} (PDF)
                        </a>
                        {doc.uploadedViaLink && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Customer Upload
                          </span>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await fetch('/api/document/delete', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ documentId: doc.id }),
                          });
                          toast.success('Document deleted!');
                          fetchCase();
                        }}
                        className="text-gray-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editedDocNames[doc.id] ?? doc.customName ?? ''}
                      onChange={(e) => {
                        setEditedDocNames((prev) => ({ ...prev, [doc.id]: e.target.value }));
                        setDocChanged(true);
                      }}
                      className="w-full border border-gray-300 rounded-md p-2 text-gray-700 text-sm"
                      placeholder="Edit document name"
                    />
                  </li>
                ))}
              </ul>
              {docChanged && (
                <button
                  onClick={async () => {
                    await Promise.all(
                      Object.entries(editedDocNames).map(async ([docId, customName]) => {
                        await fetch('/api/document/update', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ documentId: docId, customName }),
                        });
                      }),
                    );
                    toast.success('Documents updated!');
                    setEditedDocNames({});
                    setDocChanged(false);
                    fetchCase();
                  }}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition"
                >
                  Save All Document Changes
                </button>
              )}
            </div>
          )}

          {/* View Photos tab remains unchanged */}
          {activeTab === 'viewPhotos' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Photos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caseData.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="relative">
                      <img src={photo.url} alt="Case photo" className="w-full h-48 object-cover" />
                      <button
                        onClick={async () => {
                          await fetch('/api/photo/delete', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ photoId: photo.id }),
                          });
                          toast.success('Photo deleted!');
                          fetchCase();
                        }}
                        className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md text-gray-500 hover:text-red-600 transition"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="p-3">
                      {photo.uploadedViaLink && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Customer Upload
                          </span>
                        </div>
                      )}
                      <textarea
                        value={editedPhotoComments[photo.id] ?? photo.comment ?? ''}
                        onChange={(e) => {
                          setEditedPhotoComments((prev) => ({
                            ...prev,
                            [photo.id]: e.target.value,
                          }));
                          setPhotoChanged(true);
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-700 text-sm"
                        placeholder="Add comment"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {photoChanged && (
                <button
                  onClick={async () => {
                    await Promise.all(
                      Object.entries(editedPhotoComments).map(async ([photoId, comment]) => {
                        await fetch('/api/photo/update', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ photoId, comment }),
                        });
                      }),
                    );
                    toast.success('Photo comments updated!');
                    setEditedPhotoComments({});
                    setPhotoChanged(false);
                    fetchCase();
                  }}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition"
                >
                  Save All Photo Comments
                </button>
              )}
            </div>
          )}

          {/* Upload Documents tab remains unchanged */}
          {activeTab === 'uploadDocs' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Upload Documents</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-1 text-sm text-gray-600">Drag and drop files here, or</p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept="application/pdf"
                  onChange={(e) => setDocumentFiles(Array.from(e.target.files || []))}
                  //setFiles(Array.from(e.target.files || []))}
                />
                <label
                  htmlFor="file-upload"
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                >
                  Browse Files
                </label>
                <p className="mt-2 text-xs text-gray-500">PDF files only</p>
              </div>

              {documentFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-600">Files Ready to Upload:</h4>
                  {documentFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border border-gray-200 rounded p-2 bg-gray-50"
                    >
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleUpload('document')}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md font-medium transition"
              >
                Upload Documents
              </button>
            </div>
          )}

          {/* Upload Photos tab remains unchanged */}
          {activeTab === 'uploadPhotos' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Upload Photos</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-1 text-sm text-gray-600">Drag and drop photos here, or</p>
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))} //setFiles(Array.from(e.target.files || []))}
                />
                <label
                  htmlFor="photo-upload"
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                >
                  Browse Photos
                </label>
                <p className="mt-2 text-xs text-gray-500">JPG, PNG, GIF accepted</p>
              </div>

              {photoFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photoFiles.map((file, index) => (
                    <div key={index} className="border p-2 rounded bg-gray-50">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded"
                      />
                      <p className="text-sm mt-2 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => handleUpload('photo')}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md font-medium transition"
              >
                Upload Photos
              </button>
            </div>
          )}

          {/* Contact Information - Enhanced with editing capability */}
          {activeTab === 'contactInfo' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Contact Information</h3>
                {!isEditingContact ? (
                  <button
                    onClick={() => setIsEditingContact(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
                  >
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
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit Information
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={updateContactInfo}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingContact(false);
                        // Reset to original values
                        setEditedContactInfo({
                          schoolName: caseData.schoolName,
                          contactPerson: caseData.contactPerson,
                          emailAddress: caseData.emailAddress,
                          phoneNumber: caseData.phoneNumber,
                          schoolAddress: caseData.schoolAddress,
                        });
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isEditingContact ? (
                    // Editable form
                    <>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-1 block">
                            Organization Name
                          </label>
                          <input
                            type="text"
                            value={editedContactInfo.schoolName}
                            onChange={(e) =>
                              setEditedContactInfo({
                                ...editedContactInfo,
                                schoolName: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-1 block">
                            Contact Person
                          </label>
                          <input
                            type="text"
                            value={editedContactInfo.contactPerson}
                            onChange={(e) =>
                              setEditedContactInfo({
                                ...editedContactInfo,
                                contactPerson: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-1 block">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={editedContactInfo.emailAddress}
                            onChange={(e) =>
                              setEditedContactInfo({
                                ...editedContactInfo,
                                emailAddress: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-1 block">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={editedContactInfo.phoneNumber}
                            onChange={(e) =>
                              setEditedContactInfo({
                                ...editedContactInfo,
                                phoneNumber: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-1 block">
                            Address
                          </label>
                          <textarea
                            value={editedContactInfo.schoolAddress}
                            onChange={(e) =>
                              setEditedContactInfo({
                                ...editedContactInfo,
                                schoolAddress: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                            rows={3}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    // Display mode
                    <>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                            Organization Name
                          </h4>
                          <p className="text-gray-800 font-medium">{caseData.schoolName || '—'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Person</h4>
                          <p className="text-gray-800 font-medium">
                            {caseData.contactPerson || '—'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Email Address</h4>
                          {caseData.emailAddress ? (
                            <p className="text-gray-800 font-medium">
                              <a
                                href={`mailto:${caseData.emailAddress}`}
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                {caseData.emailAddress}
                              </a>
                            </p>
                          ) : (
                            <p className="text-gray-500">—</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h4>
                          {caseData.phoneNumber ? (
                            <p className="text-gray-800 font-medium">
                              <a
                                href={`tel:${caseData.phoneNumber}`}
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                {caseData.phoneNumber}
                              </a>
                            </p>
                          ) : (
                            <p className="text-gray-500">—</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                          <p className="text-gray-800 font-medium whitespace-pre-line">
                            {caseData.schoolAddress || '—'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lighting & Service Requirement Tab */}
          {/* Lighting & Service Requirement Tab */}
          {activeTab === 'onSiteVisitForm' && typeof caseId === 'string' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
              <Link
                href={`/dashboard/${caseId}/summary`}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mt-4 inline-block"
              >
                📄 View Summary
              </Link>
              <Link
                href={`/dashboard/${caseId}/quotation`}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mt-4 inline-block"
              >
                📄 View quotation
              </Link>
                <label>
                  Operation Hours / Day:
                  <input
                    type="number"
                    min="0"
                    value={operationHoursPerDay}
                    onChange={handleOperationHoursChange}
                    className="border rounded p-1 w-full"
                  />
                </label>
                <label>
                  Operation Days / Year:
                  <input
                    type="number"
                    min="0"
                    value={operationDaysPerYear}
                    onChange={handleOperationDaysChange}
                    className="border rounded p-1 w-full"
                  />
                </label>
              </div>

              <OnSiteVisitForm caseId={caseId} />
            </>
          )}


          {activeTab === 'lightingService' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Lighting & Service Requirement
              </h3>

              {/* Lighting Fixtures */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-700">Lighting Fixtures</h4>
                </div>

                {fixtureCounts && fixtureCounts.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fixtureCounts.map((fixture) => (
                        <div
                          key={fixture.fixtureType?.id}
                          className="flex justify-between items-center p-3 bg-white rounded border border-gray-200"
                        >
                          {fixture.fixtureType?.description ? (
                            <a
                              href={fixture.fixtureType?.description||'#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 underline"
                            >
                              {fixture.fixtureType.name}
                            </a>
                          ) : (
                            <span className="text-gray-700">{fixture.fixtureType.name}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-600">{fixture.count}</span>
                            <button
                              onClick={async () => {
                                try {
                                  // Get all current fixtures
                                  const updatedFixtureCounts = fixtureCounts
                                    .filter((f) => f.fixtureType.id !== fixture.fixtureType.id)
                                    .map((f) => ({
                                      fixtureTypeId: f.fixtureType.id,
                                      count: f.count,
                                    }));

                                  console.log(
                                    'Sending these fixtures after deletion:',
                                    updatedFixtureCounts,
                                  );

                                  // Use the PUT endpoint to replace all fixtures
                                  const res = await fetch(`/api/cases/${caseId}/fixtures`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(updatedFixtureCounts),
                                  });

                                  if (!res.ok) {
                                    const errorText = await res.text();
                                    console.error('Error response:', errorText);
                                    let errorData;
                                    try {
                                      errorData = JSON.parse(errorText);
                                    } catch (e) {
                                      // If not valid JSON, use the raw text
                                      errorData = { error: errorText };
                                    }
                                    throw new Error(errorData.error || 'Failed to remove fixture');
                                  }

                                  toast.success('Fixture removed successfully');
                                  fetchFixtures(); // Refresh the list
                                } catch (err) {
                                  console.error('Delete error:', err);
                                  toast.error(
                                    `Error removing fixture: ${err instanceof Error ? err.message : 'Unknown error'}`,
                                  );
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 transition"
                              aria-label="Delete fixture"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No fixtures added yet.</p>
                )}
              </div>

              {/* Add New Fixture Section */}
              <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-700 mb-4">Add New Fixture</h4>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <select
                    value={newFixtureTypeId}
                    onChange={(e) => setNewFixtureTypeId(e.target.value)}
                    className="border p-2 rounded-md w-full md:w-auto"
                  >
                    <option value="">Select Fixture Type</option>
                    {fixtureTypes
                      .filter((ft) => !fixtureCounts.some((fc) => fc.fixtureType.id === ft.id)) // Filter out already selected fixture types
                      .map((ft) => (
                        <option key={ft.id} value={ft.id}>
                          {ft.name}
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={newFixtureCount}
                    onChange={(e) => setNewFixtureCount(parseInt(e.target.value) || 1)}
                    className="border p-2 rounded-md w-full md:w-24 text-center"
                    placeholder="Count"
                  />
                  <button
                    onClick={addFixture}
                    disabled={adding || !newFixtureTypeId}
                    className={`${
                      !newFixtureTypeId
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white px-4 py-2 rounded-md transition w-full md:w-auto`}
                  >
                    {adding ? 'Adding...' : 'Add Fixture'}
                  </button>
                </div>
              </div>

              {/* Installation Details */}
              <div className="mt-8 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-700">Installation Details</h4>
                  {!isEditingInstallation ? (
                    <button
                      onClick={() => setIsEditingInstallation(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
                    >
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
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      Edit Details
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            // Using installation-details API endpoint
                            const res = await fetch(`/api/cases/${caseId}/installation`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                ceilingHeight: editedInstallationDetail.ceilingHeight
                                  ? parseFloat(editedInstallationDetail.ceilingHeight.toString())
                                  : null,
                                notes: editedInstallationDetail.notes,
                                tagIds: editedInstallationDetail.tagIds,
                              }),
                            });

                            if (res.ok) {
                              toast.success('Installation details updated successfully!');
                              setIsEditingInstallation(false);
                              fetchCase(); // Refresh the case data
                            } else {
                              const errorData = await res.json();
                              toast.error(
                                `Failed to update installation details: ${errorData.error || 'Unknown error'}`,
                              );
                            }
                          } catch (error) {
                            console.error('Error updating installation details:', error);
                            toast.error('An error occurred while updating installation details');
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingInstallation(false);
                          // Reset to original values
                          if (caseData.installationDetail) {
                            setEditedInstallationDetail({
                              ceilingHeight:
                                caseData.installationDetail.ceilingHeight?.toString() || '',
                              notes: caseData.installationDetail.notes || '',
                              tagIds:
                                caseData.installationDetail.tags?.map(
                                  (tagWrapper) => tagWrapper.tag.id,
                                ) || [],
                            });
                          } else {
                            setEditedInstallationDetail({
                              ceilingHeight: '',
                              notes: '',
                              tagIds: [],
                            });
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  {isEditingInstallation ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                          Ceiling Height (in meters)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editedInstallationDetail.ceilingHeight}
                          onChange={(e) =>
                            setEditedInstallationDetail({
                              ...editedInstallationDetail,
                              ceilingHeight: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                          placeholder="Enter ceiling height"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                          Notes
                        </label>
                        <textarea
                          value={editedInstallationDetail.notes}
                          onChange={(e) =>
                            setEditedInstallationDetail({
                              ...editedInstallationDetail,
                              notes: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                          rows={3}
                          placeholder="Enter installation notes"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-1">Ceiling Height</h5>
                        <p className="text-gray-800 font-medium">
                          {caseData.installationDetail?.ceilingHeight
                            ? `${caseData.installationDetail?.ceilingHeight} meters`
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-1">Notes</h5>
                        <p className="text-gray-800 font-medium whitespace-pre-line">
                          {caseData.installationDetail?.notes || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {/* Tags Section with Create New Tag Functionality */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-700">Service Requirement Tags</h4>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  {isEditingInstallation ? (
                    <>
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editedInstallationDetail.tagIds.length > 0 ? (
                            editedInstallationDetail.tagIds.map((tagId) => {
                              const tag = installationTags.find((t) => t.id === tagId);
                              return (
                                <div
                                  key={tagId}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 group"
                                >
                                  {tag?.name}
                                  <button
                                    onClick={() => {
                                      setEditedInstallationDetail({
                                        ...editedInstallationDetail,
                                        tagIds: editedInstallationDetail.tagIds.filter(
                                          (id) => id !== tagId,
                                        ),
                                      });
                                    }}
                                    className="ml-1.5 text-indigo-500 hover:text-indigo-800"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3.5 w-3.5"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500 text-sm">No tags selected</p>
                          )}
                        </div>

                        {/* Tag Management Section */}
                        <div className="space-y-3">
                          {/* Select from existing tags */}
                          {installationTags && installationTags.length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                value={newTagId}
                                onChange={(e) => setNewTagId(e.target.value)}
                                className="border border-gray-300 rounded-md p-2 text-gray-700 w-full sm:w-auto"
                              >
                                <option value="">
                                  Select a tag (
                                  {
                                    installationTags.filter(
                                      (tag) => !editedInstallationDetail.tagIds.includes(tag.id),
                                    ).length
                                  }{' '}
                                  available)
                                </option>
                                {installationTags
                                  .filter(
                                    (tag) => !editedInstallationDetail.tagIds.includes(tag.id),
                                  )
                                  .map((tag) => (
                                    <option key={tag.id} value={tag.id}>
                                      {tag.name}
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={() => {
                                  if (newTagId) {
                                    setEditedInstallationDetail({
                                      ...editedInstallationDetail,
                                      tagIds: [...editedInstallationDetail.tagIds, newTagId],
                                    });
                                    setNewTagId('');
                                  }
                                }}
                                disabled={!newTagId}
                                className={`${
                                  !newTagId
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                } text-white px-4 py-2 rounded-md transition`}
                              >
                                Add Tag
                              </button>
                            </div>
                          )}

                          {/* Create new tag */}
                          <div className="pt-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Create New Tag
                            </h5>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={newTagName || ''}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Enter new tag name"
                                className="border border-gray-300 rounded-md p-2 text-gray-700 w-full sm:w-auto"
                              />
                              <button
                                onClick={async () => {
                                  if (newTagName && newTagName.trim()) {
                                    try {
                                      setIsCreatingTag(true);
                                      // Create new tag via API
                                      const res = await fetch('/api/tags', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ name: newTagName.trim() }),
                                      });

                                      if (res.ok) {
                                        const newTag = await res.json();
                                        // Add new tag to available tags
                                        setInstallationTags([...installationTags, newTag]);
                                        // Add new tag to selected tags
                                        setEditedInstallationDetail({
                                          ...editedInstallationDetail,
                                          tagIds: [...editedInstallationDetail.tagIds, newTag.id],
                                        });
                                        setNewTagName('');
                                        toast.success('New tag created successfully');
                                      } else {
                                        const error = await res.json();
                                        // If tag already exists and was returned, let's add it
                                        if (error.tag && error.error === 'Tag already exists') {
                                          const existingTag = error.tag;
                                          // Only add if not already in the array
                                          if (
                                            !installationTags.some((t) => t.id === existingTag.id)
                                          ) {
                                            setInstallationTags([...installationTags, existingTag]);
                                          }
                                          // Add to selected tags if not already selected
                                          if (
                                            !editedInstallationDetail.tagIds.includes(
                                              existingTag.id,
                                            )
                                          ) {
                                            setEditedInstallationDetail({
                                              ...editedInstallationDetail,
                                              tagIds: [
                                                ...editedInstallationDetail.tagIds,
                                                existingTag.id,
                                              ],
                                            });
                                          }
                                          setNewTagName('');
                                          toast.success('Tag already exists and has been added');
                                        } else {
                                          toast.error(
                                            `Failed to create tag: ${error.error || 'Unknown error'}`,
                                          );
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error creating tag:', error);
                                      toast.error('An error occurred while creating the tag');
                                    } finally {
                                      setIsCreatingTag(false);
                                    }
                                  }
                                }}
                                disabled={!newTagName || isCreatingTag}
                                className={`${
                                  !newTagName || isCreatingTag
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                } text-white px-4 py-2 rounded-md transition`}
                              >
                                {isCreatingTag ? 'Creating...' : 'Create & Add Tag'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {caseData.installationDetail?.tags &&
                      caseData.installationDetail?.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {caseData.installationDetail?.tags.map((tagWrapper) => (
                            <span
                              key={tagWrapper.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {tagWrapper.tag.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No tags added yet.</p>
                      )}
                      {!isEditingInstallation && (
                        <button
                          onClick={() => setIsEditingInstallation(true)}
                          className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
                        >
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
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Add/Edit Tags
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lighting Details - Enhanced with editing capability */}
          {activeTab === 'lightingDetails' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Lighting Details</h3>
                {!isEditingLighting ? (
                  <button
                    onClick={() => setIsEditingLighting(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
                  >
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
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit Details
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={updateLightingDetails}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingLighting(false);
                        // Reset to original values
                        setEditedFixtureCounts({
                          num2FtLinearHighBay: caseData.num2FtLinearHighBay,
                          num150WUFOHighBay: caseData.num150WUFOHighBay,
                          num240WUFOHighBay: caseData.num240WUFOHighBay,
                          num2x2LEDPanel: caseData.num2x2LEDPanel,
                          num2x4LEDPanel: caseData.num2x4LEDPanel,
                          num1x4LEDPanel: caseData.num1x4LEDPanel,
                          num4FtStripLight: caseData.num4FtStripLight,
                        });
                        setEditedLightingSpecs({
                          lightingPurpose: caseData.lightingPurpose,
                          facilitiesUsedIn: caseData.facilitiesUsedIn,
                          installationService: caseData.installationService,
                        });
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Light Fixtures */}
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-700 mb-4">Light Fixtures</h4>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: 'num2FtLinearHighBay',
                        label: '2 Ft Linear High Bay',
                        value: caseData.num2FtLinearHighBay,
                      },
                      {
                        id: 'num150WUFOHighBay',
                        label: '150W UFO High Bay',
                        value: caseData.num150WUFOHighBay,
                      },
                      {
                        id: 'num240WUFOHighBay',
                        label: '240W UFO High Bay',
                        value: caseData.num240WUFOHighBay,
                      },
                      {
                        id: 'num2x2LEDPanel',
                        label: '2x2 LED Panel',
                        value: caseData.num2x2LEDPanel,
                      },
                      {
                        id: 'num2x4LEDPanel',
                        label: '2x4 LED Panel',
                        value: caseData.num2x4LEDPanel,
                      },
                      {
                        id: 'num1x4LEDPanel',
                        label: '1x4 LED Panel',
                        value: caseData.num1x4LEDPanel,
                      },
                      {
                        id: 'num4FtStripLight',
                        label: '4 Ft Strip Light',
                        value: caseData.num4FtStripLight,
                      },
                    ].map((fixture) => (
                      <div
                        key={fixture.id}
                        className="flex justify-between p-3 bg-white rounded border border-gray-200"
                      >
                        <span className="text-gray-700">{fixture.label}</span>
                        {isEditingLighting ? (
                          <input
                            type="number"
                            min="0"
                            value={
                              editedFixtureCounts[fixture.id as keyof typeof editedFixtureCounts]
                            }
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setEditedFixtureCounts({
                                ...editedFixtureCounts,
                                [fixture.id]: value >= 0 ? value : 0,
                              });
                            }}
                            className="w-16 text-right border border-gray-300 rounded-md p-1 text-indigo-600 font-bold"
                          />
                        ) : (
                          <span className="font-bold text-indigo-600">{fixture.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Project Specifications */}
              <h4 className="text-lg font-medium text-gray-700 mb-4">Project Specifications</h4>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isEditingLighting ? (
                    // Editable specifications
                    <>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-1 block">
                            Lighting Purpose
                          </label>
                          <input
                            type="text"
                            value={editedLightingSpecs.lightingPurpose}
                            onChange={(e) =>
                              setEditedLightingSpecs({
                                ...editedLightingSpecs,
                                lightingPurpose: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-1 block">
                            Facilities Used In
                          </label>
                          <input
                            type="text"
                            value={editedLightingSpecs.facilitiesUsedIn}
                            onChange={(e) =>
                              setEditedLightingSpecs({
                                ...editedLightingSpecs,
                                facilitiesUsedIn: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                          />
                        </div>
                      </div>
                      <div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-1 block">
                            Installation Service
                          </label>
                          <select
                            value={editedLightingSpecs.installationService}
                            onChange={(e) =>
                              setEditedLightingSpecs({
                                ...editedLightingSpecs,
                                installationService: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-700"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Not Sure">Not Sure</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Display mode
                    <>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                            Lighting Purpose
                          </h4>
                          <p className="text-gray-800 font-medium">
                            {caseData.lightingPurpose || '—'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                            Facilities Used In
                          </h4>
                          <p className="text-gray-800 font-medium">
                            {caseData.facilitiesUsedIn || '—'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                            Installation Service
                          </h4>
                          <p className="text-gray-800 font-medium">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                caseData.installationService === 'Yes'
                                  ? 'bg-green-100 text-green-800'
                                  : caseData.installationService === 'No'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {caseData.installationService}
                            </span>
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
