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
    if (uploads.length === 0) {
      toast.error('No files to upload');
      return;
    }

    try {
      await Promise.all(
        uploads.map(async (item) => {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('caseId', caseId as string);
          formData.append('uploadedViaLink', 'true');

          if (item.type === 'photo') {
            formData.append('comment', item.commentOrName);
          } else if (item.type === 'document') {
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
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Upload Your Files</h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upload Photos</h2>
        <input type="file" multiple accept="image/*" onChange={(e) => handleFileSelect(e, 'photo')} className="w-full" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upload Documents</h2>
        <input type="file" multiple accept="application/pdf" onChange={(e) => handleFileSelect(e, 'document')} className="w-full" />
      </div>

      {uploads.length > 0 && (
        <div className="space-y-6 mt-6">
          {uploads.map((item, idx) => (
            <div key={idx} className="border p-4 rounded relative">
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
                    className="w-full border p-2 text-sm"
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
                    className="w-full border p-2 text-sm"
                  />
                </>
              )}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="mt-6 w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
          >
            Submit All Files
          </button>
        </div>
      )}
    </div>
  );
}
