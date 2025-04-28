import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const prisma = new PrismaClient();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bufferToStream = (buffer: Buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const caseId = formData.get('caseId') as string;
  const files = formData.getAll('files') as File[]; // Get all selected files

  if (!files.length || !caseId) {
    return NextResponse.json({ error: 'Missing files or caseId' }, { status: 400 });
  }

  try {
    const uploadedPhotos = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'case_photos',
              resource_type: 'image',
            },
            (error, result) => {
              if (error || !result) {
                reject(error || new Error('Photo upload failed'));
              } else {
                resolve(result);
              }
            }
          );

          bufferToStream(buffer).pipe(uploadStream);
        });

        // After successful upload, save to DB
        return prisma.photo.create({
          data: {
            caseId,
            url: uploadResult.secure_url,
          },
        });
      })
    );

    return NextResponse.json({ message: 'Photos uploaded successfully', count: uploadedPhotos.length });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: 'Photo bulk upload failed' }, { status: 500 });
  }
}
