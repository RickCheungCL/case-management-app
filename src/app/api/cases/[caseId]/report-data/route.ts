import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: { caseId: string } }
) {
  const { caseId } = context.params;

  try {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        documents: true,
        photos: true,
        fixtureCounts: {
          include: {
            fixtureType: true,
          },
        },
        installationDetail: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        onSiteVisit: {
          include: {
            rooms: {
              include: {
                locationTag: true,
                suggestedLights: true,
                existingLights: {
                  include: {
                    product: true,
                  },
                },
                photos: {
                  include: {
                    tags: {
                      include: {
                        tag: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        activityLogs: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(caseData);
  } catch (error) {
    console.error('Error fetching case report data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
