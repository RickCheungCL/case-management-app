
import { prisma } from '@/lib/prisma';
import React from 'react';

export default async function QuotationSummary({ params }: { params: { caseId: string } }) {
  const caseId = params.caseId;

  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      onSiteVisit: {
        include: {
          rooms: {
            include: {
              locationTag: true,
              suggestedLights: true, // manual join below
              existingLights: {
                include: { product: true },
              },
            },
          },
        },
      },
    },
  });

  const allFixtureTypes = await prisma.lightFixtureType.findMany();

  const enrichedRooms = caseData?.onSiteVisit?.rooms.map((room) => ({
    ...room,
    suggestedLights: room.suggestedLights.map((s) => ({
      ...s,
      fixtureType: allFixtureTypes.find((f) => f.id === s.productId),
    })),
  })) || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OnsiteVisit Summary</h1>

      {enrichedRooms.map((room, index) => (
        <div key={room.id} className="mb-6 border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">
            Room {index + 1} – {room.locationTag?.name || 'No Tag'}
          </h2>
          <p>Ceiling Height: {room.ceilingHeight ?? 'N/A'} ft</p>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Suggested Lights:</h3>
            {room.suggestedLights.length > 0 ? (
              <ul className="list-disc list-inside">
                {room.suggestedLights.map((s, i) => (
                  <li key={s.id}>
                    {s.fixtureType?.name || 'Unknown'} — Qty: {s.quantity}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No suggested lights</p>
            )}
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Existing Lights:</h3>
            {room.existingLights.length > 0 ? (
              <ul className="list-disc list-inside">
                {room.existingLights.map((e, i) => (
                  <li key={e.id}>
                    {e.product?.name || 'Unknown'} ({e.product?.wattage ?? '?'}W) — Qty: {e.quantity}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No existing lights</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
