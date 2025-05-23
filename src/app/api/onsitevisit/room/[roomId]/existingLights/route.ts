import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { RouteContext } from 'next';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { roomId } = params;

  try {
    const body = await req.json();
    const { existingLights } = body; // Should be array of { productId, qty, wattage }

    if (!Array.isArray(existingLights)) {
      return NextResponse.json({ error: 'existingLights must be an array' }, { status: 400 });
    }

    // Step 1: Delete old entries
    await prisma.onSiteExistingProduct.deleteMany({
      where: { roomId },
    });

    // Step 2: Create new entries
    const created = await prisma.onSiteExistingProduct.createMany({
      data: existingLights.map((item: any) => ({
        roomId,
        productId: item.productId,
        quantity: item.qty,
      })),
    });

    return NextResponse.json({ message: 'Updated existing lights', count: created.count });
  } catch (err: any) {
    console.error('[PUT /existingLights] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: RouteContext<{ roomId: string }>) {
  const { roomId } = context.params;

  try {
    const existing = await prisma.onSiteExistingProduct.findMany({
      where: { roomId },
      include: { product: true }, // Includes product name, wattage, etc.
    });

    return NextResponse.json(existing);
  } catch (err) {
    console.error('Fetch failed:', err);
    return NextResponse.json({ error: 'Failed to fetch existing lights' }, { status: 500 });
  }
}
