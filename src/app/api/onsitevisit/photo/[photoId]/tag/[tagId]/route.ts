import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { RouteContext } from 'next'; // ✅ Important for proper typing

const prisma = new PrismaClient();

export async function DELETE(
  req: NextRequest,
  context: RouteContext<{ photoId: string; tagId: string }>
) {
  const { photoId, tagId } = await context.params;

  if (!photoId || !tagId) {
    return NextResponse.json({ error: 'Missing photoId or tagId' }, { status: 400 });
  }

  try {
    await prisma.onSiteVisitPhotoTagPivot.deleteMany({
      where: { photoId, tagId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting photo tag pivot:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
