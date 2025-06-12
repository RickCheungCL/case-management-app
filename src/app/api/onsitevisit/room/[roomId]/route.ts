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
    console.log(`Starting deletion process for room: ${roomId}`);

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Delete Photo Tag Pivots for all photos in this room
      const photos = await tx.onSiteVisitPhoto.findMany({
        where: { roomId },
        select: { id: true },
      });

      const photoIds = photos.map((photo) => photo.id);
      console.log(`Found ${photoIds.length} photos to delete for room ${roomId}`);

      if (photoIds.length > 0) {
        const deletedPivots = await tx.onSiteVisitPhotoTagPivot.deleteMany({
          where: { photoId: { in: photoIds } },
        });
        console.log(`Deleted ${deletedPivots.count} photo tag pivots`);

        // 2️⃣ Delete the Photos
        const deletedPhotos = await tx.onSiteVisitPhoto.deleteMany({
          where: { roomId },
        });
        console.log(`Deleted ${deletedPhotos.count} photos`);
      }

      // 3️⃣ Delete Suggested Products linked to this room
      const deletedSuggestedProducts = await tx.onSiteSuggestedProduct.deleteMany({
        where: { roomId },
      });
      console.log(`Deleted ${deletedSuggestedProducts.count} suggested products`);

      // 4️⃣ Delete Existing Products linked to this room (CORRECTED TABLE NAME!)
      const deletedExistingProducts = await tx.onSiteExistingProduct.deleteMany({
        where: { roomId },
      });
      console.log(`Deleted ${deletedExistingProducts.count} existing products`);

      // 5️⃣ Finally delete the Room
      const deletedRoom = await tx.onSiteVisitRoom.delete({
        where: { id: roomId },
      });
      console.log(`Successfully deleted room: ${roomId}`);

      return deletedRoom;
    });

    return NextResponse.json({ 
      success: true, 
      message: `Room ${roomId} and all related data deleted successfully` 
    });

  } catch (error) {
    console.error('Failed to delete room:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to delete room';
    
    if (error.code === 'P2025') {
      errorMessage = 'Room not found or already deleted';
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    } else if (error.code === 'P2003') {
      errorMessage = 'Cannot delete room due to related data constraints';
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    } else if (error.code === 'P2002') {
      errorMessage = 'Constraint violation during deletion';
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 });
  }
}

