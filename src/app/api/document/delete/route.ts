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
  return `case_documents/${publicId}`;
};

export async function DELETE(request: Request) {
  const { documentId } = await request.json();

  if (!documentId) {
    return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
  }

  const document = await prisma.document.findUnique({ where: { id: documentId } });

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  try {
    const publicId = getPublicId(document.url);

    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    await prisma.document.delete({ where: { id: documentId } });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
