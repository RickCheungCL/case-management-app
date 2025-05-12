import { NextRequest, NextResponse } from 'next/server';
import type { RouteContext } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  context: RouteContext<{ caseId: string; photoId: string }>
) {
  const { caseId, photoId } = context.params;
  const { tagId } = await req.json();

  if (!photoId || !tagId) {
    return NextResponse.json({ error: 'Missing photoId or tagId' }, { status: 400 });
  }

  try {
    const existing = await prisma.onSiteVisitPhotoTagPivot.findFirst({
      where: { photoId, tagId },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const pivot = await prisma.onSiteVisitPhotoTagPivot.create({
      data: { photoId, tagId },
    });

    return NextResponse.json(pivot);
  } catch (err) {
    console.error('Error creating photo tag pivot:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
