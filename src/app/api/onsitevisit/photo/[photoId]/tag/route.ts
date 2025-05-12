import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { RouteContext } from 'next';  // ✅ Import RouteContext

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  context: RouteContext<{ photoId: string }>
) {
  const { photoId } = context.params;
  const { tagId } = await req.json();

  if (!photoId || !tagId) {
    return NextResponse.json({ error: 'Missing photoId or tagId' }, { status: 400 });
  }

  try {
    // Check if already exists → optional (to avoid duplicates)
    const existing = await prisma.onSiteVisitPhotoTagPivot.findFirst({
      where: { photoId, tagId },
    });

    if (existing) {
      return NextResponse.json(existing); // Already exists, return it
    }

    // Create the pivot record
    const pivot = await prisma.onSiteVisitPhotoTagPivot.create({
      data: { photoId, tagId },
    });

    return NextResponse.json(pivot);
  } catch (err) {
    console.error('Error creating photo tag pivot:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
