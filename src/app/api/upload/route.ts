import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Convert buffer to stream
const bufferToStream = (buffer: Buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const comment = formData.get('comment') as string; // ✅ better name: comment
  const caseId = formData.get('caseId') as string;
  const uploadedViaLink = formData.get('uploadedViaLink') === 'true'; // true if customer upload

  if (!file || !caseId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'case_uploads',
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return;
        }

        if (result?.secure_url) {
          // Save into "Photo" table properly
          await prisma.photo.create({
            data: {
              caseId,
              url: result.secure_url,
              comment: comment || '',
              uploadedViaLink: uploadedViaLink,
            },
          });
        }
      },
    );

    bufferToStream(buffer).pipe(uploadStream);

    return NextResponse.json({ message: 'Photo uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
