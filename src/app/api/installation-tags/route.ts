import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

export async function GET() {
  const tags = await prisma.installationTag.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  const newTag = await prisma.installationTag.create({
    data: { name },
  });

  return NextResponse.json(newTag);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, name } = await req.json();
  const updated = await prisma.installationTag.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  await prisma.installationTag.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
