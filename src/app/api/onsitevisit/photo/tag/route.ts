import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const tags = await prisma.onSitePhotoTag.findMany();
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
  }

  // check if exists
  const existing = await prisma.onSitePhotoTag.findUnique({
    where: { name },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const tag = await prisma.onSitePhotoTag.create({
    data: { name },
  });

  return NextResponse.json(tag);
}
