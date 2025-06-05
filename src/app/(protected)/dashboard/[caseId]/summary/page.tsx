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
              suggestedLights: true,
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

  // Calculate totals
  const totalExistingLights = enrichedRooms.reduce((total, room) => 
    total + room.existingLights.reduce((roomTotal, light) => roomTotal + light.quantity, 0), 0
  );
  
  const totalSuggestedLights = enrichedRooms.reduce((total, room) => 
    total + room.suggestedLights.reduce((roomTotal, light) => roomTotal + light.quantity, 0), 0
  );

  const totalExistingWattage = enrichedRooms.reduce((total, room) => 
    total + room.existingLights.reduce((roomTotal, light) => 
      roomTotal + (light.quantity * (light.product?.wattage || 0)), 0
    ), 0
  );

  return (
    <div className="printable min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-y-16 translate-x-16 opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-50 to-blue-50 rounded-full translate-y-12 -translate-x-12 opacity-60"></div>
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  On-Site Visit Summary
                </h1>
                <p className="text-gray-600 mt-1 text-lg">
                  Comprehensive lighting assessment and recommendations
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total Rooms</p>
                    <p className="text-2xl font-bold text-blue-900">{enrichedRooms.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-800">Existing Lights</p>
                    <p className="text-2xl font-bold text-orange-900">{totalExistingLights}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 12v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Suggested Lights</p>
                    <p className="text-2xl font-bold text-green-900">{totalSuggestedLights}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Current Wattage</p>
                    <p className="text-2xl font-bold text-purple-900">{totalExistingWattage}W</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="space-y-8">
          {enrichedRooms.map((room, index) => (
            <div key={room.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Room Header */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Room {index + 1}
                      </h2>
                      <div className="flex items-center mt-2 space-x-6">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          📍 {room.locationTag?.name || 'Untagged Location'}
                        </span>
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                          📏 {room.ceilingHeight ?? 'N/A'} FT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Existing Lights Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Existing Lighting</h3>
                      <span className="ml-auto bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {room.existingLights.length} types
                      </span>
                    </div>
                    
                    {room.existingLights.length > 0 ? (
                      <div className="space-y-3">
                        {room.existingLights.map((e, i) => (
                          <div key={e.id} className="group flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-200 hover:border-orange-300">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-orange-200 rounded-lg group-hover:bg-orange-300 transition-colors duration-200">
                                <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 text-lg">
                                  {e.product?.name || 'Unknown Product'}
                                </span>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-md">
                                    ⚡ {e.product?.wattage ?? '?'}W
                                  </span>
                                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-md">
                                    🔢 Qty: {e.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-orange-800">
                                {(e.quantity * (e.product?.wattage || 0))}W
                              </div>
                              <div className="text-xs text-gray-500">Total Power</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No existing lighting fixtures</p>
                        <p className="text-gray-400 text-sm mt-1">This room has no recorded existing lights</p>
                      </div>
                    )}
                  </div>

                  {/* Suggested Lights Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 12v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Suggested Lighting</h3>
                      <span className="ml-auto bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {room.suggestedLights.length} types
                      </span>
                    </div>
                    
                    {room.suggestedLights.length > 0 ? (
                      <div className="space-y-3">
                        {room.suggestedLights.map((s, i) => (
                          <div key={s.id} className="group flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200 hover:border-green-300">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-green-200 rounded-lg group-hover:bg-green-300 transition-colors duration-200">
                                <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 12v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 text-lg">
                                  {s.fixtureType?.name || 'Unknown Fixture'}
                                </span>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-md">
                                    🔢 Qty: {s.quantity}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">
                                    RECOMMENDED
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 12v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No suggested lighting fixtures</p>
                        <p className="text-gray-400 text-sm mt-1">No recommendations have been made for this room</p>
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Rooms Found</h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto">No room data available for this on-site visit. Please complete the site visit form to see room details here.</p>
          </div>
        )}
      </div>
    </div>
  );
}