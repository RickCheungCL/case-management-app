import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const roomId = formData.get('roomId') as string; // ✅ frontend must send `roomId`
  const comment = formData.get('comment') as string | null;

  if (!file || !roomId) {
    return NextResponse.json({ error: 'Missing file or roomId' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'on-site-visit',
            resource_type: 'image',
            format: 'webp',
            transformation: [{ quality: 'auto' }, { width: 1600, height: 1600, crop: 'limit' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });

    // Insert into DB
    const photoRecord = await prisma.onSiteVisitPhoto.create({
      data: {
        url: uploadResult.secure_url,
        comment: comment || '',
        room: { connect: { id: roomId } }, // ✅ connects to existing room by ID
      },
    });

    return NextResponse.json(photoRecord);
  } catch (err) {
    console.error('Upload failed:', err);
    return NextResponse.json({ error: 'Upload or DB save failed' }, { status: 500 });
  }
}
