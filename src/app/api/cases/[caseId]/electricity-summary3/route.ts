import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// New electricity rates for 24h/day
const HOURS_1 = 5;
const RATE_1 = 0.203;
const HOURS_2 = 8;
const RATE_2 = 0.098;
const HOURS_3 = 11;
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
    let totalEnergyExisting_kWh = 0;
    let totalEnergySuggested_kWh = 0;
    let totalCostSavings = 0;
    let totalLightCount = 0;
    const caseCreatedDate = caseData?.createdAt;

    for (const room of rooms) {
      const firstPhotoUrl = room.photos?.[0]?.url || null;

      // Calculate existing wattage
      const existingWattage = room.existingLights.reduce((sum, light) => {
        const baseWattage = Number(light.product?.wattage) || 0;
        const ballastDraw = Number(light.product?.description) || 0;

        const totalWattagePerFixture = light.bypassBallast
          ? baseWattage
          : baseWattage + ballastDraw;

        return sum + light.quantity * totalWattagePerFixture;
      }, 0);

      // Calculate suggested wattage
      const suggestedWattage = room.suggestedLights.reduce((sum, light) => {
        const fixture = fixtureMap.get(light.productId);
        const wattage = fixture?.wattage ?? 0;
        return sum + light.quantity * wattage;
      }, 0);

      // Annual energy calculation based on 24h and multi-rate
      const existingEnergy_kWh = existingWattage / 1000; // in kW
      const suggestedEnergy_kWh = suggestedWattage / 1000;

      const existingAnnualCost =
        existingEnergy_kWh * (HOURS_1 * RATE_1 + HOURS_2 * RATE_2 + HOURS_3 * RATE_3) * DAYS_PER_YEAR;
      const suggestedAnnualCost =
        suggestedEnergy_kWh * (HOURS_1 * RATE_1 + HOURS_2 * RATE_2 + HOURS_3 * RATE_3) * DAYS_PER_YEAR;

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
      totalEnergyExisting_kWh += existingEnergy_kWh * 24 * DAYS_PER_YEAR;
      totalEnergySuggested_kWh += suggestedEnergy_kWh * 24 * DAYS_PER_YEAR;
      totalCostSavings += savingsCost;

      detailedRooms.push({
        roomName: room.location || room.locationTag?.name
          ? `${room.location || ''}-${room.locationTag?.name || ''}`.replace(/^-|-$/g, '')
          : '(Unnamed Room)',
        existingFixture: room.existingLights,
        suggestedFixture: room.suggestedLights,
        existingWattage,
        suggestedWattage,
        operationHoursPerDay: 24,
        operationDaysPerYear: DAYS_PER_YEAR,
        existingEnergy_kWh: Number((existingEnergy_kWh * 24 * DAYS_PER_YEAR).toFixed(2)),
        suggestedEnergy_kWh: Number((suggestedEnergy_kWh * 24 * DAYS_PER_YEAR).toFixed(2)),
        savings_kWh: Number(((existingEnergy_kWh - suggestedEnergy_kWh) * 24 * DAYS_PER_YEAR).toFixed(2)),
        savings_cost: Number(savingsCost.toFixed(2)),
        savings_cost_per_fixture: Number(savingsCostPerFixture.toFixed(2)),
        photoUrl: firstPhotoUrl,
      });
    }

    return NextResponse.json({
      schoolInfo,
      summary: {
        totalExistingWattage: totalExistingWattage ?? 0,
        totalSuggestedWattage: totalSuggestedWattage ?? 0,
        totalEnergyExisting_kWh: Number((totalEnergyExisting_kWh || 0).toFixed(2)),
        totalEnergySuggested_kWh: Number((totalEnergySuggested_kWh || 0).toFixed(2)),
        savings_kWh: Number(((totalEnergyExisting_kWh - totalEnergySuggested_kWh) || 0).toFixed(2)),
        savings_cost: Number((totalCostSavings || 0).toFixed(2)),
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