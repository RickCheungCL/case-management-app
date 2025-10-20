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
                photos:true,
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
        const operationHoursPerDay = caseData.operationHoursPerDay || 0;
        const operationDaysPerYear = caseData.operationDaysPerYear || 0;
        const firstPhotoUrl = room.photos?.[0]?.url || null;

        const existingWattage = room.existingLights.reduce((sum, light) => {
            const baseWattage = light.product?.wattage ?? 0;
            const ballastDraw = Number(light.product?.description) || 0;
          
            const totalWattagePerFixture = light.bypassBallast
              ? baseWattage + ballastDraw
              : baseWattage ;
              console.log({
                name: room.location,
                room: room.locationTag?.name,
                light: light.product?.name,
                bypassBallast: light.bypassBallast,
                base: baseWattage,
                ballast: ballastDraw,
                totalWattagePerFixture,
                quantity: light.quantity,
              });
            return sum + light.quantity * totalWattagePerFixture;
          }, 0);
          
          

      const suggestedWattage = room.suggestedLights.reduce((sum, light) => {
        const fixture = fixtureMap.get(light.productId);
        return sum + light.quantity * (fixture?.wattage ?? 0);
      }, 0);

      const existingEnergy_kWh = Number(((existingWattage / 1000) * operationHoursPerDay * operationDaysPerYear || 0).toFixed(2));
      const suggestedEnergy_kWh = Number(((suggestedWattage / 1000) * operationHoursPerDay * operationDaysPerYear || 0).toFixed(2));
      const savings_kWh = existingEnergy_kWh - suggestedEnergy_kWh;
      const savings_cost = Number((savings_kWh * ELECTRICITY_COST_PER_KWH || 0).toFixed(2));


      const totalSuggestedQuantity = room.suggestedLights.reduce((sum, light) => sum + light.quantity, 0);
      totalLightCount += totalSuggestedQuantity;
        const savings_cost_per_fixture = totalSuggestedQuantity > 0
            ? savings_cost / totalSuggestedQuantity
            : 0;
      totalExistingWattage += existingWattage;
      totalSuggestedWattage += suggestedWattage;
      totalEnergyExisting_kWh += existingEnergy_kWh;
      totalEnergySuggested_kWh += suggestedEnergy_kWh;
      totalCostSavings += savings_cost;

      detailedRooms.push({
        roomName: room.location || room.locationTag?.name
  ? `${room.location || ''}-${room.locationTag?.name || ''}`.replace(/^-|-$/g, '') // remove trailing dash
  : '(Unnamed Room)',
        existingFixture: room.existingLights,
        suggestedFixture: room.suggestedLights,
        existingWattage,
        suggestedWattage,
        operationHoursPerDay,
        operationDaysPerYear,
        existingEnergy_kWh: Number(existingEnergy_kWh.toFixed(2)),
        suggestedEnergy_kWh: Number(suggestedEnergy_kWh.toFixed(2)),
        savings_kWh: Number(savings_kWh.toFixed(2)),
        savings_cost: Number(savings_cost.toFixed(2)),
        savings_cost_per_fixture: Number(savings_cost_per_fixture.toFixed(2)),
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
            totalLightCount: totalLightCount,
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
