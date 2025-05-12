import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { RouteContext } from 'next'; // ✅ Important

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context: RouteContext<{ roomId: string }>
) {
  const { roomId } = context.params;
  const { suggestedProducts } = await req.json();

  // Delete old suggestions first
  await prisma.onSiteSuggestedProduct.deleteMany({ where: { roomId } });

  // Insert new suggestions
  const inserts = suggestedProducts.map((prod: { productId: string; qty: number }) => ({
    roomId,
    productId: prod.productId,
    quantity: prod.qty,
  }));

  if (inserts.length > 0) {
    await prisma.onSiteSuggestedProduct.createMany({ data: inserts });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext<{ roomId: string }>
) {
  const { roomId } = context.params;

  try {
    // Delete room by ID
    await prisma.onSiteVisitRoom.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
