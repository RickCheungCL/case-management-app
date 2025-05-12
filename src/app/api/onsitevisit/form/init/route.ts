import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get('caseId');

  if (!caseId) {
    return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
  }

  // 1️⃣ Find or create OnSiteVisit (with nested rooms, photos, suggestedLights)
  let visit = await prisma.onSiteVisit.findUnique({
    where: { caseId },
    include: {
      rooms: {
        include: {
          photos: {
            include: {
              tags: {
                include: { tag: true }, // include tag details inside pivot
              },
            },
          },
          suggestedLights: true,
        },
      },
    },
  });

  if (!visit) {
    visit = await prisma.onSiteVisit.create({
      data: { caseId },
      include: {
        rooms: {
          include: {
            photos: { include: { tags: { include: { tag: true } } } },
            suggestedLights: true,
          },
        },
      },
    });
  }

  // 2️⃣ Ensure at least one room exists
  if (visit.rooms.length === 0) {
    const newRoom = await prisma.onSiteVisitRoom.create({
      data: {
        onSiteVisitId: visit.id,
        location: '',
        lightingIssue: '',
        customerRequest: '',
        mountingKitQty: 0,
        motionSensorQty: 0,
      },
    });

    // Refresh visit object after creating room
    visit = await prisma.onSiteVisit.findUnique({
      where: { caseId },
      include: {
        rooms: {
          include: {
            photos: { include: { tags: { include: { tag: true } } } },
            suggestedLights: true,
          },
        },
      },
    });
  }

  return NextResponse.json(visit);
}
