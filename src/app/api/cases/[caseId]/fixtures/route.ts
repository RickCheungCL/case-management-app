import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
//api/cases/[caseId]/fixtures/route.ts
const prisma = new PrismaClient();

export async function GET(_: Request, props: { params: Promise<{ caseId: string }> }) {
  const params = await props.params;
  const fixtureCounts = await prisma.caseFixtureCount.findMany({
    where: { caseId: params.caseId },
    include: { fixtureType: true },
  });

  return NextResponse.json(fixtureCounts);
}

export async function PUT(req: Request, props: { params: Promise<{ caseId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = await req.json(); // Expecting [{ fixtureTypeId, count }]
  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
  }

  // IMPORTANT: First delete all existing fixture counts for this case
  await prisma.caseFixtureCount.deleteMany({
    where: { caseId: params.caseId }
  });

  // Then create new ones based on the updates
  if (updates.length > 0) {
    await prisma.caseFixtureCount.createMany({
      data: updates.map(({ fixtureTypeId, count }) => ({
        caseId: params.caseId,
        fixtureTypeId,
        count
      }))
    });
  }

  await prisma.activityLog.create({
    data: {
      caseId: params.caseId,
      userId: session.user.id!,
      action: `Updated fixture counts.`,
    },
  });

  return NextResponse.json({ success: true });
}

export async function POST(req: Request, props: { params: Promise<{ caseId: string }> }) {
  const params = await props.params;
  const caseId = params.caseId;
  const { fixtureTypeId, count } = await req.json();

  if (!fixtureTypeId || typeof count !== 'number') {
    return NextResponse.json({ error: 'Missing fixtureTypeId or count' }, { status: 400 });
  }

  try {
    const newFixture = await prisma.caseFixtureCount.create({
      data: {
        caseId,
        fixtureTypeId,
        count,
      },
    });

    return NextResponse.json(newFixture);
  } catch (error) {
    console.error('Error adding fixture:', error);
    return NextResponse.json({ error: 'Failed to add fixture' }, { status: 500 });
  }
}
