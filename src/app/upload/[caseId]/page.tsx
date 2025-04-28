'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface UploadItem {
  file: File;
  comment: string;
}

export default function PublicUploadPage() {
  const { caseId } = useParams();
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const uploadItems = files.map(file => ({ file, comment: '' }));
    setUploads(uploadItems);
  };

  const handleUpload = async () => {
    if (!uploads.length) return;

    for (const item of uploads) {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('comment', item.comment);
      formData.append('caseId', caseId as string);
      formData.append('uploadedViaLink', 'true');

      const res = await fetch(`/api/photo/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        toast.error('Upload failed!');
        return;
      }
    }

    toast.success('Photos uploaded successfully!');
    setUploads([]);
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Upload Photos for Your Project</h1>

      <input type="file" multiple accept="image/*" onChange={handleFileSelect} />

      {uploads.length > 0 && (
        <div className="space-y-4 mt-6">
          {uploads.map((item, idx) => (
            <div key={idx} className="border p-4 rounded">
              <img
                src={URL.createObjectURL(item.file)}
                alt="Preview"
                className="w-32 h-32 object-cover mb-2 rounded"
              />
              <textarea
                placeholder="Add a comment about this photo..."
                value={item.comment}
                onChange={(e) => {
                  const newUploads = [...uploads];
                  newUploads[idx].comment = e.target.value;
                  setUploads(newUploads);
                }}
                className="w-full border p-2 text-sm"
              />
            </div>
          ))}

          <button
            onClick={handleUpload}
            className="mt-4 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Submit All Photos
          </button>
        </div>
      )}
    </div>
  );
}
