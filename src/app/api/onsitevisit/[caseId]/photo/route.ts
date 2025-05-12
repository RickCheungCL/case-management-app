import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { RouteContext } from 'next'; // 👈 This is the key

export async function POST(
  req: NextRequest,
  context: RouteContext<{ visitId: string }>
) {
  const { visitId } = context.params;
  const body = await req.json();
  const { roomId, url, comment } = body;

  const photo = await prisma.onSiteVisitPhoto.create({
    data: {
      roomId,
      url,
      comment,
      // You probably want to connect visitId somewhere? Example:
      // visitId, // if visitId is part of onSiteVisitPhoto model
    },
  });

  return NextResponse.json(photo);
}
