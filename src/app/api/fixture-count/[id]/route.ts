// File: app/api/fixture-count/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

export async function DELETE(
  _: Request, 
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Delete the fixture count by ID
    await prisma.caseFixtureCount.delete({
      where: {
        id: params.id,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        caseId: (await prisma.caseFixtureCount.findUnique({
          where: { id: params.id },
          select: { caseId: true },
        }))?.caseId || '',
        userId: session.user.id,
        action: 'Removed fixture from case',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fixture:', error);
    return NextResponse.json({ error: 'Failed to delete fixture' }, { status: 500 });
  }
}