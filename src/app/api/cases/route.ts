import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';



const prisma = new PrismaClient();

// Handle GET (fetch all cases)
export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Error fetching cases' }, { status: 500 });
  }
}

// Handle POST (create a new case)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, projectDetails } = body;

    if (!customerName || !projectDetails) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const newCase = await prisma.case.create({
      data: {
        customerName,
        projectDetails,
      },
    });

    return NextResponse.json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: 'Error creating case' }, { status: 500 });
  }
}
