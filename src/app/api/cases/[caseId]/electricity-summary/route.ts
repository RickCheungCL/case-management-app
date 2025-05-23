import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const ELECTRICITY_COST_PER_KWH = 0.158;

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
              },
            },
          },
        },
      },
    });

    if (!caseData?.onSiteVisit) {
      return NextResponse.json({ error: 'Case or visit not found' }, { status: 404 });
    }

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

    for (const room of rooms) {
        const operationHoursPerDay = caseData.operationHoursPerDay || 0;
        const operationDaysPerYear = caseData.operationDaysPerYear || 0;
        

      const existingWattage = room.existingLights.reduce((sum, light) => {
        return sum + light.quantity * (light.product?.wattage ?? 0);
      }, 0);

      const suggestedWattage = room.suggestedLights.reduce((sum, light) => {
        const fixture = fixtureMap.get(light.productId);
        return sum + light.quantity * (fixture?.wattage ?? 0);
      }, 0);

      const existingEnergy_kWh = Number(((existingWattage / 1000) * operationHoursPerDay * operationDaysPerYear || 0).toFixed(2));
      const suggestedEnergy_kWh = Number(((suggestedWattage / 1000) * operationHoursPerDay * operationDaysPerYear || 0).toFixed(2));
      const savings_kWh = existingEnergy_kWh - suggestedEnergy_kWh;
      const savings_cost = Number((savings_kWh * ELECTRICITY_COST_PER_KWH || 0).toFixed(2));

      totalExistingWattage += existingWattage;
      totalSuggestedWattage += suggestedWattage;
      totalEnergyExisting_kWh += existingEnergy_kWh;
      totalEnergySuggested_kWh += suggestedEnergy_kWh;
      totalCostSavings += savings_cost;

      detailedRooms.push({
        roomName: room.locationTag?.name||'(Unnamed Room)',
        existingWattage,
        suggestedWattage,
        operationHoursPerDay,
        operationDaysPerYear,
        existingEnergy_kWh: Number(existingEnergy_kWh.toFixed(2)),
        suggestedEnergy_kWh: Number(suggestedEnergy_kWh.toFixed(2)),
        savings_kWh: Number(savings_kWh.toFixed(2)),
        savings_cost: Number(savings_cost.toFixed(2)),
      });
    }

    return NextResponse.json({
        summary: {
            totalExistingWattage: totalExistingWattage ?? 0,
            totalSuggestedWattage: totalSuggestedWattage ?? 0,
            totalEnergyExisting_kWh: Number((totalEnergyExisting_kWh || 0).toFixed(2)),
            totalEnergySuggested_kWh: Number((totalEnergySuggested_kWh || 0).toFixed(2)),
            savings_kWh: Number(((totalEnergyExisting_kWh - totalEnergySuggested_kWh) || 0).toFixed(2)),
            savings_cost: Number((totalCostSavings || 0).toFixed(2)),
          },
          rooms: detailedRooms,
    });
  } catch (error) {
    console.error('Error calculating electricity summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
