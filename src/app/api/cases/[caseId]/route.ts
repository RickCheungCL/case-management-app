import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;

  if (!caseId) {
    return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
  }

  try {
    const singleCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        photos: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!singleCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(singleCase);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ 
      error: 'Error fetching case', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  } finally {
    // Optional: Disconnect from Prisma to prevent connection pool issues
    // await prisma.$disconnect();
  }
}

// Add PUT method to update case details
export async function PUT(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;
  
  if (!caseId) {
    return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
  }
  
  try {
    const body = await request.json();
    
    // Check if case exists first
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
    });
    
    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Update case with the provided fields
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: {
        ...body,
        updatedAt: new Date(), // Ensure the updatedAt field is set
      },
      include: {
        photos: true,
        documents: true,
      },
    });
    
    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json({ 
      error: 'Error updating case', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}