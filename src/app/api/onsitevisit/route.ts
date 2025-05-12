import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { caseId } = body;

  if (!caseId) {
    return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
  }

  const visit = await prisma.onSiteVisit.create({
    data: {
      caseId,
    },
  });

  return NextResponse.json(visit);
}
