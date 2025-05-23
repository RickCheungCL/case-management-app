import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { RouteContext } from 'next';
export async function GET(
  _req: NextRequest,
  context: RouteContext<{ caseId: string }>
) {
  const caseId = context.params.caseId;

  if (!caseId) {
    return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
  }

  try {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        onSiteVisit: {
          include: {
            rooms: {
              include: {
                suggestedLights: true,
                existingLights: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!caseData || !caseData.onSiteVisit) {
      return NextResponse.json([], { status: 200 });
    }

    const allFixtureTypeIds: string[] = [];
    const productMap: Record<string, { fixtureTypeId: string; qty: number }> = {};

    for (const room of caseData.onSiteVisit.rooms) {
      for (const sl of room.suggestedLights) {
        const fixtureTypeId = sl.productId;
        allFixtureTypeIds.push(fixtureTypeId);
        if (!productMap[fixtureTypeId]) {
          productMap[fixtureTypeId] = { fixtureTypeId, qty: 0 };
        }
        productMap[fixtureTypeId].qty += sl.quantity;
      }
    }

    const fixtureTypes = await prisma.lightFixtureType.findMany({
      where: { id: { in: allFixtureTypeIds } },
    });

    const suggestedProducts = Object.values(productMap).map((entry) => {
      const fixture = fixtureTypes.find((f) => f.id === entry.fixtureTypeId);
      return {
        id: fixture?.id || entry.fixtureTypeId,
        name: fixture?.name || 'Unknown',
        sku: fixture?.SKU || '',
        wattage: fixture?.description || '',
        qty: entry.qty,
      };
    });

    const summary = {
      customerName: caseData.customerName,
      contactPerson: caseData.contactPerson,
      emailAddress: caseData.emailAddress,
      phoneNumber: caseData.phoneNumber,
      schoolAddress: caseData.schoolAddress,
      suggestedProducts,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to retrieve quotation data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
