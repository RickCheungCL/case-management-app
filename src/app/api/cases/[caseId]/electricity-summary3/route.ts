import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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
      return NextResponse.json(
        { error: 'Case or visit not found' },
        { status: 404 }
      );
    }

    const schoolInfo = {
      schoolName: caseData.schoolName,
      contactPerson: caseData.contactPerson,
      emailAddress: caseData.emailAddress,
      phoneNumber: caseData.phoneNumber,
      schoolAddress: caseData.schoolAddress,
    };

    const rooms = caseData.onSiteVisit.rooms;

    // =============================
    // Suggested fixtures lookup
    // =============================
    const allSuggestedProductIds = Array.from(
      new Set(
        rooms.flatMap((room) =>
          room.suggestedLights.map((s) => s.productId)
        )
      )
    );

    const fixtureList = await prisma.lightFixtureType.findMany({
      where: { id: { in: allSuggestedProductIds } },
    });

    const fixtureMap = new Map(fixtureList.map((f) => [f.id, f]));

    // =============================
    // Excel-equivalent annual rate
    // =============================

    const YEAR_HOURS = 24 * DAYS_PER_YEAR;

    // Excel annual distribution (DO NOT CHANGE)
    const RATE1_RATIO = 1260 / YEAR_HOURS;
    const RATE2_RATIO = 2772 / YEAR_HOURS;
    const RATE3_RATIO = 4728 / YEAR_HOURS;

    const annualWeightedRate =
      YEAR_HOURS *
      (
        RATE1_RATIO * RATE_1 +
        RATE2_RATIO * RATE_3 +
        RATE3_RATIO * RATE_2
      );

    // =============================
    // Totals
    // =============================

    const detailedRooms = [];

    let totalExistingWattage = 0;
    let totalSuggestedWattage = 0;
    let totalEnergyExisting_kWh = 0;
    let totalEnergySuggested_kWh = 0;
    let totalCostSavings = 0;
    let totalLightCount = 0;

    const caseCreatedDate = caseData.createdAt;

    // =============================
    // Room Loop
    // =============================

    for (const room of rooms) {
      const firstPhotoUrl = room.photos?.[0]?.url || null;

      // Existing wattage (MATCH OLD LOGIC)
      const existingWattage = room.existingLights.reduce((sum, light) => {
        const baseWattage = light.product?.wattage ?? 0;
        const ballastDraw = Number(light.product?.description) || 0;

        const totalWattagePerFixture = light.bypassBallast
          ? baseWattage + ballastDraw
          : baseWattage;

        return sum + light.quantity * totalWattagePerFixture;
      }, 0);

      // Suggested wattage
      const suggestedWattage = room.suggestedLights.reduce((sum, light) => {
        const fixture = fixtureMap.get(light.productId);
        return sum + light.quantity * (fixture?.wattage ?? 0);
      }, 0);

      // =============================
      // ENERGY (24h / 365)
      // =============================

      const existingEnergy_kWh = Number(
        ((existingWattage / 1000) * 24 * DAYS_PER_YEAR).toFixed(2)
      );

      const suggestedEnergy_kWh = Number(
        ((suggestedWattage / 1000) * 24 * DAYS_PER_YEAR).toFixed(2)
      );

      const savings_kWh =
        existingEnergy_kWh - suggestedEnergy_kWh;

      // =============================
      // COST (MATCH EXCEL)
      // =============================

      const existingCost =
        (existingWattage / 1000) * annualWeightedRate;

      const suggestedCost =
        (suggestedWattage / 1000) * annualWeightedRate;

      const savings_cost = Number(
        (existingCost - suggestedCost).toFixed(2)
      );

      // =============================
      // Counts
      // =============================

      const totalSuggestedQuantity =
        room.suggestedLights.reduce(
          (sum, light) => sum + light.quantity,
          0
        );

      totalLightCount += totalSuggestedQuantity;

      const savings_cost_per_fixture =
        totalSuggestedQuantity > 0
          ? savings_cost / totalSuggestedQuantity
          : 0;

      // Totals accumulation
      totalExistingWattage += existingWattage;
      totalSuggestedWattage += suggestedWattage;
      totalEnergyExisting_kWh += existingEnergy_kWh;
      totalEnergySuggested_kWh += suggestedEnergy_kWh;
      totalCostSavings += savings_cost;

      detailedRooms.push({
        roomName:
          room.location || room.locationTag?.name
            ? `${room.location || ''}-${room.locationTag?.name || ''}`
                .replace(/^-|-$/g, '')
            : '(Unnamed Room)',

        existingFixture: room.existingLights,
        suggestedFixture: room.suggestedLights,

        existingWattage,
        suggestedWattage,

        operationHoursPerDay: 24,
        operationDaysPerYear: DAYS_PER_YEAR,

        existingEnergy_kWh,
        suggestedEnergy_kWh,
        savings_kWh: Number(savings_kWh.toFixed(2)),

        savings_cost,
        savings_cost_per_fixture: Number(
          savings_cost_per_fixture.toFixed(2)
        ),

        photoUrl: firstPhotoUrl,
      });
    }

    // =============================
    // RESPONSE
    // =============================

    return NextResponse.json({
      schoolInfo,
      summary: {
        totalExistingWattage: totalExistingWattage ?? 0,
        totalSuggestedWattage: totalSuggestedWattage ?? 0,
        totalEnergyExisting_kWh: Number(
          totalEnergyExisting_kWh.toFixed(2)
        ),
        totalEnergySuggested_kWh: Number(
          totalEnergySuggested_kWh.toFixed(2)
        ),
        savings_kWh: Number(
          (
            totalEnergyExisting_kWh -
            totalEnergySuggested_kWh
          ).toFixed(2)
        ),
        savings_cost: Number(totalCostSavings.toFixed(2)),
        totalLightCount,
      },
      rooms: detailedRooms,
      fixtureList,
      caseCreatedDate,
    });

  } catch (error) {
    console.error('Error calculating electricity summary:', error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}