import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, context: { params: { caseId: string } }) {
  const { params } = context;
  const { caseId } = params;

  try {
    const singleCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        photos: true,
        documents: true,
      },
    });

    if (!singleCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(singleCase);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Error fetching case' }, { status: 500 });
  }
}
