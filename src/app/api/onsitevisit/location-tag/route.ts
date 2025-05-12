// src/app/api/onsitevisit/location-tag/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const tags = await prisma.onSiteLocationTag.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const tag = await prisma.onSiteLocationTag.create({ data: { name } });
    return NextResponse.json(tag);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Tag name already exists' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
