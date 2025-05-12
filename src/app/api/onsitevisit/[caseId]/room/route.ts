import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { RouteContext } from 'next'; // ✅ Correct import

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  context: RouteContext<{ caseId: string }>
) {
  const { caseId } = context.params;
  const data = await req.json();

  // Find OnSiteVisit record
  const onSiteVisit = await prisma.onSiteVisit.findUnique({
    where: { caseId },
  });

  if (!onSiteVisit) {
    return NextResponse.json({ error: 'OnSiteVisit not found' }, { status: 404 });
  }

  const newRoom = await prisma.onSiteVisitRoom.create({
    data: {
      onSiteVisitId: onSiteVisit.id,
      location: data.location,
      locationTagId: data.locationTagId,
      lightingIssue: data.lightingIssue,
      customerRequest: data.customerRequest,
      mountingKitQty: data.mountingKitQty,
      motionSensorQty: data.motionSensorQty,
    },
  });

  return NextResponse.json(newRoom);
}
