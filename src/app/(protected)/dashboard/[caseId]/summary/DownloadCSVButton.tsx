import { prisma } from '@/lib/prisma';
import React from 'react';

// Inline Client Component for CSV Download
function DownloadCSVButton({ enrichedRooms }: { enrichedRooms: any[] }) {
  return (
    <div className="inline-flex items-center">
      <button
        onClick={() => {
          // Prepare CSV data
          const csvData = [];
          
          // Add header row
          csvData.push([
            'Room Number',
            'Location Tag',
            'Ceiling Height (ft)',
            'Light Type',
            'Category',
            'Product Name',
            'Wattage',
            'Quantity'
          ]);

          // Add data rows
          enrichedRooms.forEach((room, index) => {
            const roomNumber = `Room ${index + 1}`;
            const locationTag = room.locationTag?.name || 'Untagged Location';
            const ceilingHeight = room.ceilingHeight ?? 'N/A';

            // Add suggested lights
            if (room.suggestedLights.length > 0) {
              room.suggestedLights.forEach((light: any) => {
                csvData.push([
                  roomNumber,
                  locationTag,
                  ceilingHeight,
                  light.fixtureType?.name || 'Unknown Fixture',
                  'Suggested',
                  light.fixtureType?.name || 'Unknown',
                  'N/A',
                  light.quantity
                ]);
              });
            } else {
              csvData.push([
                roomNumber,
                locationTag,
                ceilingHeight,
                'No suggested lights',
                'Suggested',
                'N/A',
                'N/A',
                '0'
              ]);
            }

            // Add existing lights
            if (room.existingLights.length > 0) {
              room.existingLights.forEach((light: any) => {
                csvData.push([
                  roomNumber,
                  locationTag,
                  ceilingHeight,
                  light.product?.name || 'Unknown Product',
                  'Existing',
                  light.product?.name || 'Unknown',
                  light.product?.wattage ?? 'N/A',
                  light.quantity
                ]);
              });
            } else {
              csvData.push([
                roomNumber,
                locationTag,
                ceilingHeight,
                'No existing lights',
                'Existing',
                'N/A',
                'N/A',
                '0'
              ]);
            }
          });

          // Convert to CSV string
          const csvContent = csvData.map(row => 
            row.map(field => `"${field}"`).join(',')
          ).join('\n');

          // Create and download file
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `lighting-summary-${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
        suppressHydrationWarning
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download CSV
      </button>
    </div>
  );
}

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                  On-Site Visit Summary
                </h1>
                <p className="text-gray-600 mt-2">
                  Comprehensive lighting assessment and recommendations
                </p>
              </div>
              <div className="flex-shrink-0">
                <DownloadCSVButton enrichedRooms={enrichedRooms} />
              </div>
            </div>
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
                        Ceiling Height: <span className="font-medium">{room.ceilingHeight ?? 'N/A'} ft</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Suggested Lights Section */}
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