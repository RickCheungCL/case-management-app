import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RouteContext } from 'next/dist/server/future/route-modules/app-route/context';

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { comment } = await req.json();

    if (typeof comment !== 'string') {
      return NextResponse.json({ error: 'Invalid comment' }, { status: 400 });
    }

    const { photoId } = context.params as { photoId: string }; // ✅ Correct extraction

    const updated = await prisma.onSiteVisitPhoto.update({
      where: { id: photoId },
      data: { comment },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}
