import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';

const prisma = new PrismaClient();

// Replace with your own secret key stored in .env
const ADMIN_TOKEN = process.env.API_SECRET_KEY;

async function getAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  let isAdmin = false;
  let userId: string | undefined = undefined;

  if (token && token === ADMIN_TOKEN) {
    isAdmin = true;
    userId = undefined; // optional
  } else {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    isAdmin = session.user.role === 'ADMIN';
    userId = session.user.id;
  }

  return { isAdmin, userId };
}

// Handle GET (fetch all cases)
export async function GET(request: Request) {
  const auth = await getAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { isAdmin, userId } = auth;

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

    const cases = await prisma.case.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: { createdAt: 'desc' },
      select: selectFields,
    });

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Error fetching cases' }, { status: 500 });
  }
}

// Handle POST (create a new case)
export async function POST(request: Request) {
  const auth = await getAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = auth;

  try {
    const body = await request.json();
    const {
      customerName,
      projectDetails,
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
        userId: userId!, // safe because auth passed
        schoolName,
        contactPerson,
        emailAddress,
        phoneNumber,
        schoolAddress,
        lightingPurpose,
        facilitiesUsedIn,
        installationService,
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
  }
}
