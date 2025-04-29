'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface UploadItem {
  file: File;
  type: 'photo' | 'document';
  commentOrName: string;
}

export default function CustomerUploadPage() {
  const { caseId } = useParams();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'document') => {
    const files = Array.from(e.target.files || []);
    const newUploads = files.map(file => ({ file, type, commentOrName: '' }));
    setUploads(prev => [...prev, ...newUploads]);
  };

  const handleDelete = (index: number) => {
    const updated = [...uploads];
    updated.splice(index, 1);
    setUploads(updated);
  };

  const handleSubmit = async () => {
    if (isUploading) return;
    if (uploads.length === 0) {
      toast.error('No files to upload');
      return;
    }

    try {
      setIsUploading(true);
      await Promise.all(
        uploads.map(async (item) => {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('caseId', caseId as string);
          formData.append('uploadedViaLink', 'false');

          if (item.type === 'photo') {
            formData.append('comment', item.commentOrName);
          } else {
            formData.append('customName', item.commentOrName);
          }

          const endpoint = item.type === 'photo' ? '/api/photo/upload' : '/api/document/upload';

          const res = await fetch(endpoint, {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Failed to upload ${item.file.name}`);
          }
        })
      );

      toast.success('All files uploaded successfully!');
      setUploads([]);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Upload failed');
    } finally{
        setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-700 text-white p-6 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">Upload Files for Quotation</h1>
          <p className="text-sm text-indigo-100 mt-1">Please upload relevant documents and photos for your case.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 space-y-6">
          {/* Photo upload */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Upload Photos</h2>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'photo')}
              className="mt-2 w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Document upload */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Upload Documents</h2>
            <input
              type="file"
              multiple
              accept="application/pdf"
              onChange={(e) => handleFileSelect(e, 'document')}
              className="mt-2 w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Upload list preview */}
          {uploads.length > 0 && (
            <div className="space-y-4">
              {uploads.map((item, idx) => (
                <div key={idx} className="border p-4 rounded relative bg-gray-50">
                  <button
                    onClick={() => handleDelete(idx)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 bg-white rounded-full p-1 shadow"
                  >
                    🗑️
                  </button>

                  {item.type === 'photo' ? (
                    <>
                      <img
                        src={URL.createObjectURL(item.file)}
                        alt="Preview"
                        className="w-32 h-32 object-cover mb-2 rounded"
                      />
                      <textarea
                        placeholder="Comment about this photo..."
                        value={item.commentOrName}
                        onChange={(e) => {
                          const updated = [...uploads];
                          updated[idx].commentOrName = e.target.value;
                          setUploads(updated);
                        }}
                        className="w-full border p-2 text-sm rounded"
                      />
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">{item.file.name}</p>
                      <input
                        type="text"
                        placeholder="Enter custom document name..."
                        value={item.commentOrName}
                        onChange={(e) => {
                          const updated = [...uploads];
                          updated[idx].commentOrName = e.target.value;
                          setUploads(updated);
                        }}
                        className="w-full border p-2 text-sm rounded"
                      />
                    </>
                  )}
                </div>
              ))}

              <button
                onClick={handleSubmit}
                className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700 font-medium"
              >
                Submit All Files
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
