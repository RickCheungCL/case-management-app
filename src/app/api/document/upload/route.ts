import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to turn Buffer into Stream
const bufferToStream = (buffer: Buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const customName = (formData.get('customName') as string) || '';
  const caseId = formData.get('caseId') as string;
  const uploadedViaLink = formData.get('uploadedViaLink') === 'false';

  if (!file || !caseId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'case_documents', // 📂 Store documents in a separate folder
          resource_type: 'raw', // 📄 Important: Allow uploading non-image files (PDF, DOCX)
        },
        (error, result) => {
          if (error || !result) {
            return reject(error);
          }
          resolve(result);
        },
      );
      bufferToStream(buffer).pipe(uploadStream);
    });

    // Save to database after upload finishes
    await prisma.document.create({
      data: {
        caseId,
        url: uploadResult.secure_url,
        fileName: file.name, // the original filename (e.g., "quotation.pdf")
        customName,
        uploadedViaLink,
      },
    });

    return NextResponse.json({ message: 'Document uploaded successfully!' });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Document upload failed' }, { status: 500 });
  }
}
