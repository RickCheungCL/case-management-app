import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  const { photoId, comment, customName } = await request.json();

  if (!photoId) {
    return NextResponse.json({ error: 'Missing photoId' }, { status: 400 });
  }

  try {
    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        comment,
        customName,
      },
    });

    return NextResponse.json(updatedPhoto);
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json({ error: 'Error updating photo' }, { status: 500 });
  }
}
