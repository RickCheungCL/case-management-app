import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Hourly rates for the 24h day
const HOURS_1 = 5;
const HOURS_2 = 8;
const HOURS_3 = 11;

const RATE_1 = 0.203; // $ per kWh
const RATE_2 = 0.098;
const RATE_3 = 0.157;

const DAYS_PER_YEAR = 365;

export async function GET(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;

  try {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        onSiteVisit: {
          include: {
            rooms: {
              include: {
                existingLights: { include: { product: true } },
                suggestedLights: true,
                locationTag: true,
                photos: true,
              },
            },
          },
        },
      },
    });

    if (!caseData?.onSiteVisit) {
      return NextResponse.json({ error: 'Case or visit not found' }, { status: 404 });
    }

    const schoolInfo = {
      schoolName: caseData.schoolName,
      contactPerson: caseData.contactPerson,
      emailAddress: caseData.emailAddress,
      phoneNumber: caseData.phoneNumber,
      schoolAddress: caseData.schoolAddress,
    };

    const rooms = caseData.onSiteVisit.rooms;

    // Collect all unique productIds used in suggestedLights
    const allSuggestedProductIds = Array.from(
      new Set(rooms.flatMap((room) => room.suggestedLights.map((s) => s.productId)))
    );

    const fixtureList = await prisma.lightFixtureType.findMany({
      where: { id: { in: allSuggestedProductIds } },
    });

    const fixtureMap = new Map(fixtureList.map((f) => [f.id, f]));

    const detailedRooms = [];

    let totalExistingWattage = 0;
    let totalSuggestedWattage = 0;
    let totalCostSavings = 0;
    let totalLightCount = 0;
    const caseCreatedDate = caseData?.createdAt;

    for (const room of rooms) {
      const firstPhotoUrl = room.photos?.[0]?.url || null;

      // Calculate existing wattage
      const existingWattage = room.existingLights.reduce((sum, light) => {
        const baseWattage = Number(light.product?.wattage) || 0;
        const ballastDraw = Number(light.product?.description) || 0;

        // Correct ballast logic: bypassBallast means ballast is ignored
        const totalWattagePerFixture = light.bypassBallast
          ? baseWattage
          : baseWattage + ballastDraw;

        return sum + light.quantity * totalWattagePerFixture;
      }, 0);

      // Calculate suggested wattage
      const suggestedWattage = room.suggestedLights.reduce((sum, light) => {
        const fixture = fixtureMap.get(light.productId);
        const wattage = fixture?.wattage ?? 0; // fallback to 0 if missing
        return sum + light.quantity * wattage;
      }, 0);

      // Annual cost calculation using fixed hourly rates
      const existingAnnualCost =
        existingWattage > 0
          ? (existingWattage / 1000) *
            (HOURS_1 * RATE_1 + HOURS_2 * RATE_2 + HOURS_3 * RATE_3) *
            DAYS_PER_YEAR
          : 0;

      const suggestedAnnualCost =
        suggestedWattage > 0
          ? (suggestedWattage / 1000) *
            (HOURS_1 * RATE_1 + HOURS_2 * RATE_2 + HOURS_3 * RATE_3) *
            DAYS_PER_YEAR
          : 0;

      const savingsCost = existingAnnualCost - suggestedAnnualCost;

      const totalSuggestedQuantity = room.suggestedLights.reduce(
        (sum, light) => sum + light.quantity,
        0
      );
      totalLightCount += totalSuggestedQuantity;

      const savingsCostPerFixture =
        totalSuggestedQuantity > 0 ? savingsCost / totalSuggestedQuantity : 0;

      totalExistingWattage += existingWattage;
      totalSuggestedWattage += suggestedWattage;
      totalCostSavings += savingsCost;

      detailedRooms.push({
        roomName: room.location || room.locationTag?.name
          ? `${room.location || ''}-${room.locationTag?.name || ''}`.replace(/^-|-$/g, '')
          : '(Unnamed Room)',
        existingFixture: room.existingLights,
        suggestedFixture: room.suggestedLights,
        existingWattage,
        suggestedWattage,
        existingAnnualCost: Number(existingAnnualCost.toFixed(2)),
        suggestedAnnualCost: Number(suggestedAnnualCost.toFixed(2)),
        savingsCost: Number(savingsCost.toFixed(2)),
        savingsCostPerFixture: Number(savingsCostPerFixture.toFixed(2)),
        photoUrl: firstPhotoUrl,
      });
    }

    return NextResponse.json({
      schoolInfo,
      summary: {
        totalExistingWattage,
        totalSuggestedWattage,
        totalCostSavings: Number(totalCostSavings.toFixed(2)),
        totalLightCount,
      },
      rooms: detailedRooms,
      fixtureList,
      caseCreatedDate,
    });
  } catch (error) {
    console.error('Error calculating electricity summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}