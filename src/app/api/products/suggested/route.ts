import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const products = await prisma.lightFixtureType.findMany({
    select: { id: true,description:true, name: true },
  });

  return NextResponse.json(products);
}
