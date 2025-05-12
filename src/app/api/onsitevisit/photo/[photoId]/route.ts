import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import type { RouteContext } from 'next'; // ✅ Correct typing

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function DELETE(
  req: NextRequest,
  context: RouteContext<{ photoId: string }>
) {
  const { photoId } = context.params;

  if (!photoId) {
    return NextResponse.json({ error: 'Missing photoId' }, { status: 400 });
  }

  try {
    const photo = await prisma.onSiteVisitPhoto.findUnique({ where: { id: photoId } });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Extract public_id from URL for Cloudinary deletion
    const match = photo.url.match(/\/([^/]+)\.(jpg|jpeg|png|webp|heic|heif)$/);
    if (match) {
      const publicId = `on-site-visit/${match[1]}`;
      const cloudDelete = await cloudinary.uploader.destroy(publicId);
      console.log('Cloudinary delete result:', cloudDelete);
    } else {
      console.warn(`Could not extract valid public_id from URL: ${photo.url}`);
    }

    // Delete related tag pivot records first
    await prisma.onSiteVisitPhotoTagPivot.deleteMany({
      where: { photoId },
    });

    // Delete the photo itself
    await prisma.onSiteVisitPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete photo:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
