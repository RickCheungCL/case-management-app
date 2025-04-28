'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface Photo {
  id: string;
  url: string;
  comment?: string;
  customName?: string;
}

interface Document {
  id: string;
  url: string;
  fileName: string;
  customName?: string;
}

interface Case {
  id: string;
  customerName: string;
  projectDetails: string;
  photos: Photo[];
  documents: Document[];
}



export default function CaseDetailsPage() {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'viewDocs' | 'uploadDocs' | 'viewPhotos' | 'uploadPhotos'>('viewDocs');

  const [editedDocNames, setEditedDocNames] = useState<Record<string, string>>({});
  const [docChanged, setDocChanged] = useState(false);
  const [editedPhotoComments, setEditedPhotoComments] = useState<Record<string, string>>({});
  const [photoChanged, setPhotoChanged] = useState(false);

  const fetchCase = async () => {
    const res = await fetch(`/api/cases/${caseId}`);
    const data = await res.json();
    setCaseData(data);
  };

  const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${caseId}`;




  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const handleUpload = async (uploadType: 'photo' | 'document') => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('caseId', caseId as string);

    const res = await fetch(`/api/${uploadType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      toast.success(`${uploadType === 'photo' ? 'Photos' : 'Documents'} uploaded successfully!`);
      setFiles([]);
      fetchCase();
    } else {
      toast.error('Upload failed!');
    }
  };

  if (!caseData) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Case: {caseData.customerName}</h1>





      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Customer Upload Link</h2>
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={uploadUrl}
                readOnly
                className="w-full border p-2 rounded"
            />
        <button
            onClick={() => {
            navigator.clipboard.writeText(uploadUrl);
            toast.success('Upload link copied to clipboard!');
        }}
        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
        Copy
        </button>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('viewDocs')} className={activeTab === 'viewDocs' ? 'font-bold underline' : ''}>View Documents</button>
        <button onClick={() => setActiveTab('uploadDocs')} className={activeTab === 'uploadDocs' ? 'font-bold underline' : ''}>Upload Documents</button>
        <button onClick={() => setActiveTab('viewPhotos')} className={activeTab === 'viewPhotos' ? 'font-bold underline' : ''}>View Photos</button>
        <button onClick={() => setActiveTab('uploadPhotos')} className={activeTab === 'uploadPhotos' ? 'font-bold underline' : ''}>Upload Photos</button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'viewDocs' && (
  <div>
    <ul className="space-y-2">
      {caseData.documents.map((doc) => (
        <li key={doc.id} className="border p-2 rounded flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {doc.customName || doc.fileName} (PDF)
            </a>
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
              className="text-red-600 hover:text-red-800"
            >
              🗑️
            </button>
          </div>

          <input
            type="text"
            value={editedDocNames[doc.id] ?? doc.customName ?? ''}
            onChange={(e) => {
              setEditedDocNames(prev => ({ ...prev, [doc.id]: e.target.value }));
              setDocChanged(true);
            }}
            className="border p-1 text-sm"
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
            })
          );
          toast.success('Documents updated!');
          setEditedDocNames({});
          setDocChanged(false);
          fetchCase();
        }}
        className="mt-4 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save All Document Changes
      </button>
    )}
  </div>
)}


      {activeTab === 'uploadDocs' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upload Documents (Bulk)</h2>
          <input type="file" multiple accept="application/pdf" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <button onClick={() => handleUpload('document')} className="mt-2 bg-green-600 text-white p-2 rounded hover:bg-green-700">
            Upload Documents
          </button>
        </div>
      )}

{activeTab === 'viewPhotos' && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {caseData.photos.map((photo) => (
      <div key={photo.id} className="relative p-2 border rounded">
        <img src={photo.url} alt="Photo" className="rounded shadow mb-2" />
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
          className="absolute top-2 right-2 text-red-600 hover:text-red-800 bg-white rounded-full p-1 shadow"
        >
          🗑️
        </button>

        <textarea
          value={editedPhotoComments[photo.id] ?? photo.comment ?? ''}
          onChange={(e) => {
            setEditedPhotoComments(prev => ({ ...prev, [photo.id]: e.target.value }));
            setPhotoChanged(true);
          }}
          className="border p-1 text-sm w-full"
          placeholder="Add Comment"
        />
      </div>
    ))}

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
            })
          );
          toast.success('Photo comments updated!');
          setEditedPhotoComments({});
          setPhotoChanged(false);
          fetchCase();
        }}
        className="mt-4 p-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save All Photo Comments
      </button>
    )}
  </div>
)}


      {activeTab === 'uploadPhotos' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upload Photos (Bulk)</h2>
          <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <button onClick={() => handleUpload('photo')} className="mt-2 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Upload Photos
        </button>
        </div>
      )}
    </div>
  );
}
