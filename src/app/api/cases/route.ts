import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions'; // adjust path if needed
import { Session } from 'inspector/promises';

const prisma = new PrismaClient();

// Handle GET (fetch all cases)
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const isAdmin = session.user.role === 'ADMIN';

  try {
    const selectFields = {
      id: true,
      customerName: true,
      projectDetails: true,
      contactPerson: true,
      schoolName: true,
      emailAddress: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    };

    let cases;
    if (isAdmin) {
      cases = await prisma.case.findMany({
        orderBy: { createdAt: 'desc' },
        select: selectFields,
      });
    } else {
      cases = await prisma.case.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: selectFields,
      });
    }

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Error fetching cases' }, { status: 500 });
  }
}

// Handle POST (create a new case)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      customerName,
      projectDetails,
      // Additional fields from expanded schema
      schoolName = '',
      contactPerson = '',
      emailAddress = '',
      phoneNumber = '',
      schoolAddress = '',
      lightingPurpose = '',
      facilitiesUsedIn = '',
      installationService = 'Not Sure',
    } = body;

    if (!customerName || !projectDetails) {
      return NextResponse.json(
        { error: 'Customer name and project details are required' },
        { status: 400 },
      );
    }

    const newCase = await prisma.case.create({
      data: {
        customerName,
        projectDetails,
        status: 'New',
        // Organization information
        userId: session.user.id!,
        schoolName,
        contactPerson,
        emailAddress,
        phoneNumber,
        schoolAddress,
        // Lighting specifications
        lightingPurpose,
        facilitiesUsedIn,
        installationService,
        // Light fixture counts remain at default 0
      },
    });

    return NextResponse.json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      {
        error: 'Error creating case',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  } finally {
    // Optional: Disconnect from Prisma to prevent connection pool issues
    // await prisma.$disconnect();
  }
}
