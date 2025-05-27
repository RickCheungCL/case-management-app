import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/authOptions';

const prisma = new PrismaClient();

export async function GET(_: Request, props: { params: Promise<{ caseId: string }> }) {
  try {
    const params = await props.params;
    const fixtureCounts = await prisma.caseFixtureCount.findMany({
      where: { caseId: params.caseId },
      include: { fixtureType: true },
    });

    return NextResponse.json(fixtureCounts);
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ caseId: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json(); // Expecting [{ fixtureTypeId, count }]

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // First perform the fixture operations without the activity log
    await prisma.$transaction(async (tx) => {
      // Delete existing fixture counts
      console.log(`Attempting to delete fixture counts for case: ${params.caseId}`);
      const deleteResult = await tx.caseFixtureCount.deleteMany({
        where: { caseId: params.caseId },
      });
      console.log(`Deleted ${deleteResult.count} existing fixture counts`);

      // Create new ones if needed
      if (updates.length > 0) {
        console.log(`Creating ${updates.length} new fixture counts`);
        await tx.caseFixtureCount.createMany({
          data: updates.map(({ fixtureTypeId, count }) => ({
            caseId: params.caseId,
            fixtureTypeId,
            count,
          })),
        });
      }
    });

    // Try to create activity log separately - don't fail if this fails
    if (session.user?.id) {
      try {
        await prisma.activityLog.create({
          data: {
            caseId: params.caseId,
            userId: session.user.id,
            action: `Updated fixture counts.`,
          },
        });
      } catch (logError) {
        console.error('Failed to create activity log:', logError);
        // We don't want the fixture update to fail if logging fails
      }
    } else {
      console.log('Skipping activity log creation due to missing user ID');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Detailed error in fixture update:', error);
    return NextResponse.json(
      {
        error: 'Failed to update fixtures',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, props: { params: Promise<{ caseId: string }> }) {
  try {
    const params = await props.params;
    const caseId = params.caseId;
    const { fixtureTypeId, count } = await req.json();

    if (!fixtureTypeId || typeof count !== 'number') {
      return NextResponse.json({ error: 'Missing fixtureTypeId or count' }, { status: 400 });
    }

    // Create the fixture
    const newFixture = await prisma.caseFixtureCount.create({
      data: {
        caseId,
        fixtureTypeId,
        count,
      },
    });

    // Try to get the session and create activity log
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        await prisma.activityLog.create({
          data: {
            caseId,
            userId: session.user.id,
            action: `Added new fixture type: ${fixtureTypeId} with count: ${count}`,
          },
        });
      }
    } catch (logError) {
      console.error('Error creating activity log:', logError);
      // Don't fail if activity log creation fails
    }

    return NextResponse.json(newFixture);
  } catch (error) {
    console.error('Error adding fixture:', error);
    return NextResponse.json(
      {
        error: 'Failed to add fixture',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ caseId: string }> }) {
  try {
    const params = await props.params;
    const { searchParams } = new URL(req.url);
    const fixtureTypeId = searchParams.get('fixtureTypeId');

    if (!fixtureTypeId) {
      return NextResponse.json({ error: 'Missing fixtureTypeId parameter' }, { status: 400 });
    }

    console.log(
      `Attempting to delete fixture: caseId=${params.caseId}, fixtureTypeId=${fixtureTypeId}`,
    );

    const deleteResult = await prisma.caseFixtureCount.deleteMany({
      where: {
        caseId: params.caseId,
        fixtureTypeId: fixtureTypeId,
      },
    });

    console.log(`Delete result: ${JSON.stringify(deleteResult)}`);

    if (deleteResult.count === 0) {
      return NextResponse.json(
        {
          warning: 'No fixtures found to delete with the given criteria',
        },
        { status: 404 },
      );
    }

    // Try to get the session and create activity log
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        await prisma.activityLog.create({
          data: {
            caseId: params.caseId,
            userId: session.user.id,
            action: `Removed fixture type: ${fixtureTypeId}`,
          },
        });
      }
    } catch (logError) {
      console.error('Error creating activity log:', logError);
      // Don't fail if activity log creation fails
    }

    return NextResponse.json({ success: true, deletedCount: deleteResult.count });
  } catch (error) {
    console.error('Error deleting fixture:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete fixture',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
