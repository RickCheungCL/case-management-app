import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Extract public ID from URL
const getPublicId = (url: string) => {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const [publicId] = fileName.split('.');
  return `case_photos/${publicId}`;
};

export async function DELETE(request: Request) {
  const { photoId } = await request.json();

  if (!photoId) {
    return NextResponse.json({ error: 'Missing photoId' }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  try {
    const publicId = getPublicId(photo.url);

    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

    await prisma.photo.delete({ where: { id: photoId } });

    return NextResponse.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
