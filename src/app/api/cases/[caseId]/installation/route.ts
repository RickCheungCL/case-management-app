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
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ceilingHeight, notes, tagIds } = await req.json(); // tagIds = array of InstallationTag.id

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

  if (Array.isArray(tagIds)) {
    await prisma.installationDetailTag.createMany({
      data: tagIds.map((tagId: string) => ({
        installationDetailId: installationDetail.id,
        tagId,
      })),
    });
  }

  await prisma.activityLog.create({
    data: {
      caseId: params.caseId,
      userId: session.user.id!,
      action: `Updated installation details.`,
    },
  });

  return NextResponse.json({ success: true });
}
