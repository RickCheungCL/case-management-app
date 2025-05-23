import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context : { params: { caseId: string } }
) {
  const { caseId } =await context.params;

  if (!caseId) {
    return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
  }

  const body = await req.json();
  const { operationHoursPerDay, operationDaysPerYear } = body;

  if (
    typeof operationHoursPerDay !== 'number' ||
    typeof operationDaysPerYear !== 'number'
  ) {
    return NextResponse.json({ error: 'Invalid input types' }, { status: 400 });
  }

  try {
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: {
        operationHoursPerDay,
        operationDaysPerYear,
      },
    });

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error('Failed to update operation fields:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
export async function GET(
  req: NextRequest,
  context: { params: { caseId: string } }
) {
  const { caseId } =await context.params; 

  if (!caseId) {
    return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
  }

  try {
    const foundCase = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        operationHoursPerDay: true,
        operationDaysPerYear: true,
      },
    });

    if (!foundCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(foundCase);
  } catch (error) {
    console.error('Failed to fetch operation fields:', error);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}