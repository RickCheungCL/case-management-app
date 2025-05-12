import { PrismaClient } from '@prisma/client';
import { NextResponse, NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  const { caseId } = params;

  try {
    const visit = await prisma.onSiteVisit.findUnique({
      where: { caseId },
      include: {
        rooms: {
          include: {
            photos: {
              include: {
                tags: {
                  include: { tag: true },
                },
              },
            },
            suggestedLights: true,
            locationTag: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'OnSiteVisit not found' }, { status: 404 });
    }

    return NextResponse.json(visit);
  } catch (err: unknown) {
    console.error('Failed to fetch OnSiteVisit:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect(); // Still needed without singleton
  }
}
