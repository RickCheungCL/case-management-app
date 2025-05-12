import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
//api/cases/[caseId]/installation/route.ts
const prisma = new PrismaClient();

export async function GET(_: Request, props: { params: Promise<{ caseId: string }> }) {
  const params = await props.params;
  const detail = await prisma.installationDetail.findUnique({
    where: { caseId: params.caseId },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(detail);
}

export async function PUT(req: Request, props: { params: Promise<{ caseId: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate user ID exists
    if (!session.user?.id) {
      console.log('Warning: User session exists but user ID is missing');
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Store user ID safely
    const userId = session.user.id;

    const { ceilingHeight, notes, tagIds } = await req.json(); // tagIds = array of InstallationTag.id

    // First perform the installation detail update in a transaction
    const installationDetail = await prisma.installationDetail.upsert({
      where: { caseId: params.caseId },
      update: {
        ceilingHeight,
        notes,
      },
      create: {
        caseId: params.caseId,
        ceilingHeight,
        notes,
      },
    });

    // Delete old tags & add new ones
    await prisma.installationDetailTag.deleteMany({
      where: { installationDetailId: installationDetail.id },
    });

    if (Array.isArray(tagIds) && tagIds.length > 0) {
      await prisma.installationDetailTag.createMany({
        data: tagIds.map((tagId: string) => ({
          installationDetailId: installationDetail.id,
          tagId,
        })),
      });
    }

    // Try to create activity log separately - don't fail if this fails
    try {
      await prisma.activityLog.create({
        data: {
          caseId: params.caseId,
          userId: userId,
          action: `Updated installation details.`,
        },
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
      // Don't fail the whole operation if activity log creation fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating installation details:', error);
    return NextResponse.json(
      {
        error: 'Failed to update installation details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
