'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type RoomSummary = {
  roomName: string;
  existingWattage: number;
  suggestedWattage: number;
  operationHoursPerDay: number;
  operationDaysPerYear: number;
  existingEnergy_kWh: number;
  suggestedEnergy_kWh: number;
  savings_kWh: number;
  savings_cost: number;
  savings_cost_per_fixture: number;
};

type SummaryResponse = {
  summary: {
    totalExistingWattage: number;
    totalSuggestedWattage: number;
    totalEnergyExisting_kWh: number;
    totalEnergySuggested_kWh: number;
    savings_kWh: number;
    savings_cost: number;
  };
  rooms: RoomSummary[];
};

export default function EnergySummaryPage() {
  const { caseId } = useParams() as { caseId: string };
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}/electricity-summary`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to fetch');
          return;
        }
        const data = await res.json();
        setData(data);
      } catch (err) {
        setError('Failed to load summary');
        console.error(err);
      }
    };

    fetchSummary();
  }, [caseId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">Error Loading Data</h3>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">Loading Energy Summary</h3>
          <p className="text-gray-600 text-center">Analyzing your energy data...</p>
        </div>
      </div>
    );
  }

  const { summary, rooms } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 printable">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Energy Efficiency Report
          </h1>
          <p className="text-gray-600 text-lg">Comprehensive analysis of your electricity consumption and savings potential</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Current Consumption</h3>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">{summary.totalExistingWattage.toLocaleString()} W</p>
              <p className="text-sm text-gray-600">{summary.totalEnergyExisting_kWh.toFixed(2)} kWh/year</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Optimized Usage</h3>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">{summary.totalSuggestedWattage.toLocaleString()} W</p>
              <p className="text-sm text-gray-600">{summary.totalEnergySuggested_kWh.toFixed(2)} kWh/year</p>
            </div>
          </div>

          <div className={`${Number(summary.savings_cost) > 0 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
              : 'bg-gradient-to-br from-red-500 to-red-600'
            } rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 md:col-span-2 lg:col-span-1`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {Number(summary.savings_cost) > 0 ? 'Total Savings' : 'Additional Costs'}
              </h3>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                {Number(summary.savings_cost) > 0 ? (
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">
                {Number(summary.savings_cost) > 0 ? '$' : '+$'}{Math.abs(Number(summary.savings_cost)).toFixed(2)}
              </p>
              <p className={Number(summary.savings_cost) > 0 ? "text-emerald-100" : "text-red-100"}>
                {Number(summary.savings_cost) > 0 
                  ? `${Number(summary.savings_kWh).toFixed(2)} kWh saved annually`
                  : `${Math.abs(Number(summary.savings_kWh)).toFixed(2)} kWh additional usage annually`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Room Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Room-by-Room Analysis</h2>
            <p className="text-gray-600">Detailed breakdown of energy consumption and savings by room</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 uppercase tracking-wider">Current (W)</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 uppercase tracking-wider">Optimized (W)</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 uppercase tracking-wider">Current kWh</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 uppercase tracking-wider">Optimized kWh</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                    <span className={Number(summary.savings_cost) > 0 ? 'text-emerald-700' : 'text-red-700'}>
                      {Number(summary.savings_cost) > 0 ? 'Savings' : 'Additional Cost'}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rooms.map((room, index) => (
                  <tr key={room.roomName} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">{room.roomName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 font-medium">{room.existingWattage}</td>
                    <td className="px-6 py-4 text-center text-gray-700 font-medium">{room.suggestedWattage}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">
                        <div>{room.operationHoursPerDay}h/day</div>
                        <div>{room.operationDaysPerYear} days/year</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 font-medium">{room.existingEnergy_kWh.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center text-gray-700 font-medium">{room.suggestedEnergy_kWh.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="space-y-1">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          Number(room.savings_kWh) > 0 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {Number(room.savings_kWh) > 0 ? '' : '+'}{Math.abs(Number(room.savings_kWh)).toFixed(2)} kWh
                        </div>
                        <div className={`text-sm font-bold ${
                          Number(room.savings_cost) > 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {Number(room.savings_cost) > 0 ? '$' : '+$'}{Math.abs(Number(room.savings_cost)).toFixed(2)}
                          <div className="text-xs text-gray-500 italic">
                                (${Math.abs(Number(room.savings_cost_per_fixture)).toFixed(2)} / fixture)
                            </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 p-6 bg-white bg-opacity-60 rounded-2xl backdrop-blur-sm">
          <p className="text-gray-600">
            💡 This analysis shows potential energy savings through optimized lighting and equipment usage.
          </p>
          <p className="text-sm text-gray-500 italic text-left">
            Disclaimer: The projected energy savings provided in this analysis are based on standard assumptions, general usage patterns, and industry-average performance metrics. Actual results may vary significantly due to factors such as facility-specific operating conditions, equipment installation quality, occupancy behavior, environmental influences, and maintenance practices. This report is intended for informational purposes only and should not be interpreted as a guarantee of future performance or financial return. We recommend consulting with a certified energy auditor or lighting professional for a comprehensive on-site assessment tailored to your facility.
        </p>
        </div>
      </div>
    </div>
  );
}