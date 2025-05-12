import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { RouteContext } from 'next'; // ✅ Correct type import

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context: RouteContext<{ roomId: string }>
) {
  const { roomId } = context.params;
  const body = await req.json();
  const { locationTagId } = body;

  try {
    const updated = await prisma.onSiteVisitRoom.update({
      where: { id: roomId },
      data: { locationTagId: locationTagId || null },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update room tag' }, { status: 500 });
  }
}
