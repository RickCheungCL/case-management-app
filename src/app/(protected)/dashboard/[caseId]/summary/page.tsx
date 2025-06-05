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
    <div className="printable min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              On-Site Visit Summary
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive lighting assessment and recommendations
            </p>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="space-y-6">
          {enrichedRooms.map((room, index) => (
            <div key={room.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Room Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Room {index + 1}
                    </h2>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {room.locationTag?.name || 'Untagged Location'}
                      </span>
                      <span className="text-sm text-gray-600">
                        Ceiling Height: <span className="font-medium">{room.ceilingHeight ?? 'N/A'} FT</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Suggested Lights Section */}
                  

                  {/* Existing Lights Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">Existing Lighting</h3>
                    </div>
                    
                    {room.existingLights.length > 0 ? (
                      <div className="space-y-3">
                        {room.existingLights.map((e, i) => (
                          <div key={e.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">
                                {e.product?.name || 'Unknown Product'}
                              </span>
                              <div className="text-sm text-gray-600 mt-1">
                                {e.product?.wattage ?? '?'}W
                              </div>
                            </div>
                            <div className="ml-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Qty: {e.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">No existing lighting fixtures</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-900">Suggested Lighting</h3>
                    </div>
                    
                    {room.suggestedLights.length > 0 ? (
                      <div className="space-y-3">
                        {room.suggestedLights.map((s, i) => (
                          <div key={s.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">
                                {s.fixtureType?.name || 'Unknown Fixture'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Qty: {s.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">No suggested lighting fixtures</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {enrichedRooms.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rooms Found</h3>
            <p className="text-gray-500">No room data available for this on-site visit.</p>
          </div>
        )}
      </div>
    </div>
  );
}