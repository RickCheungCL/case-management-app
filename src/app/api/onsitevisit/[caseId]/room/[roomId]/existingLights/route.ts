// FIXED API ROUTE: /app/api/room/[roomId]/existingLights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { RouteContext } from 'next';

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context: RouteContext<{ roomId: string }>
) {
  const { roomId } = context.params;
  const { existingLights } = await req.json(); // Changed from existingProducts to existingLights

  if (!Array.isArray(existingLights)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    // Clear old existing lights
    await prisma.onSiteExistingProduct.deleteMany({ // This is the correct model name from your schema
      where: { roomId },
    });

    // Insert new existing lights
    if (existingLights.length > 0) {
      await prisma.onSiteExistingProduct.createMany({ // This is the correct model name
        data: existingLights.map((p: { productId: string; qty: number; wattage?: number }) => ({
          roomId,
          productId: p.productId,
          quantity: p.qty,
          // Note: wattage is stored in the Product model, not in OnSiteExistingProduct
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update existing lights:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}