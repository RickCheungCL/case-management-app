import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
//api/cases/[caseId]/fixtures/route.ts
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
    
    // Validate user ID exists - this is the important change
    if (!session.user?.id) {
      console.log("Warning: User session exists but user ID is missing");
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Now we can safely use session.user.id as it's been verified non-null
    const userId = session.user.id; // Assign to a variable to help TypeScript

    const updates = await req.json(); // Expecting [{ fixtureTypeId, count }]
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete existing fixture counts
      console.log(`Attempting to delete fixture counts for case: ${params.caseId}`);
      const deleteResult = await tx.caseFixtureCount.deleteMany({
        where: { caseId: params.caseId }
      });
      console.log(`Deleted ${deleteResult.count} existing fixture counts`);
      
      // Create new ones if needed
      if (updates.length > 0) {
        console.log(`Creating ${updates.length} new fixture counts`);
        await tx.caseFixtureCount.createMany({
          data: updates.map(({ fixtureTypeId, count }) => ({
            caseId: params.caseId,
            fixtureTypeId,
            count
          }))
        });
      }
      
      // Log the activity with the verified userId
      console.log(`Creating activity log for user: ${userId}`);
      await tx.activityLog.create({
        data: {
          caseId: params.caseId,
          userId: userId, // Use the verified userId
          action: `Updated fixture counts.`,
        },
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Detailed error in fixture update:', error);
    return NextResponse.json({ 
      error: 'Failed to update fixtures', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    const session = await getServerSession(authOptions);
    
    const newFixture = await prisma.caseFixtureCount.create({
      data: {
        caseId,
        fixtureTypeId,
        count,
      },
    });

    // Optional: Add activity log if session exists
    if (session?.user?.id) {
      const userId = session.user.id; // Store in variable for type safety
      await prisma.activityLog.create({
        data: {
          caseId,
          userId: userId,
          action: `Added new fixture type: ${fixtureTypeId} with count: ${count}`,
        },
      });
    }

    return NextResponse.json(newFixture);
  } catch (error) {
    console.error('Error adding fixture:', error);
    return NextResponse.json({ 
      error: 'Failed to add fixture',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add DELETE endpoint if needed
export async function DELETE(req: Request, props: { params: Promise<{ caseId: string }> }) {
  try {
    const params = await props.params;
    const { searchParams } = new URL(req.url);
    const fixtureTypeId = searchParams.get('fixtureTypeId');
    
    if (!fixtureTypeId) {
      return NextResponse.json({ error: 'Missing fixtureTypeId parameter' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Attempting to delete fixture: caseId=${params.caseId}, fixtureTypeId=${fixtureTypeId}`);
    
    const deleteResult = await prisma.caseFixtureCount.deleteMany({
      where: {
        caseId: params.caseId,
        fixtureTypeId: fixtureTypeId,
      },
    });

    console.log(`Delete result: ${JSON.stringify(deleteResult)}`);

    if (deleteResult.count === 0) {
      return NextResponse.json({ 
        warning: 'No fixtures found to delete with the given criteria'
      }, { status: 404 });
    }

    // Add activity log if user ID exists
    if (session?.user?.id) {
      const userId = session.user.id; // Store in variable for type safety
      await prisma.activityLog.create({
        data: {
          caseId: params.caseId,
          userId: userId,
          action: `Removed fixture type: ${fixtureTypeId}`,
        },
      });
    }

    return NextResponse.json({ success: true, deletedCount: deleteResult.count });
  } catch (error) {
    console.error('Error deleting fixture:', error);
    return NextResponse.json({ 
      error: 'Failed to delete fixture', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}