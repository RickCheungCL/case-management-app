import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { RouteContext } from 'next';  // ✅ Import the correct type

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context: RouteContext<{ roomId: string }>
) {
  const { roomId } = context.params;
  const data = await req.json();

  try {
    const updatedRoom = await prisma.onSiteVisitRoom.update({
      where: { id: roomId },
      data: {
        location: data.location ?? undefined,
        lightingIssue: data.lightingIssue ?? undefined,
        customerRequest: data.customerRequest ?? undefined,
        mountingKitQty: data.mountingKitQty ?? undefined,
        motionSensorQty: data.motionSensorQty ?? undefined,
        locationTagId: data.locationTagId ?? undefined,
        ceilingHeight: data.ceilingHeight ?? undefined, 
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext<{ roomId: string }>
) {
  const { roomId } = context.params;

  try {
    // 1️⃣ Delete Photo Tag Pivots for all photos in this room
    const photos = await prisma.onSiteVisitPhoto.findMany({
      where: { roomId },
      select: { id: true },
    });

    const photoIds = photos.map((photo) => photo.id);

    if (photoIds.length > 0) {
      await prisma.onSiteVisitPhotoTagPivot.deleteMany({
        where: { photoId: { in: photoIds } },
      });

      // 2️⃣ Delete the Photos
      await prisma.onSiteVisitPhoto.deleteMany({
        where: { roomId },
      });
    }

    // 3️⃣ Delete Suggested Products linked to this room
    await prisma.onSiteSuggestedProduct.deleteMany({
      where: { roomId },
    });

    // 4️⃣ Finally delete the Room
    await prisma.onSiteVisitRoom.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
