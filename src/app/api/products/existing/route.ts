import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const existingProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        wattage: true,
        category: true,
      },
    });

    return NextResponse.json(existingProducts);
  } catch (error) {
    console.error('Failed to fetch existing lighting products:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
