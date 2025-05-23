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

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-4">Loading energy summary...</div>;

  const { summary, rooms } = data;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Electricity Summary Report</h1>

      <table className="w-full table-auto border border-gray-300 mb-10 text-left">
        <tbody>
          <tr><th className="border px-4 py-2">Total Existing Wattage</th><td className="border px-4 py-2">{summary.totalExistingWattage} W</td></tr>
          <tr><th className="border px-4 py-2">Total Suggested Wattage</th><td className="border px-4 py-2">{summary.totalSuggestedWattage} W</td></tr>
          <tr><th className="border px-4 py-2">Total Existing Energy / Year</th><td className="border px-4 py-2">{summary.totalEnergyExisting_kWh.toFixed(2)} kWh</td></tr>
          <tr><th className="border px-4 py-2">Total Suggested Energy / Year</th><td className="border px-4 py-2">{summary.totalEnergySuggested_kWh.toFixed(2)} kWh</td></tr>
          <tr><th className="border px-4 py-2 font-semibold text-green-700">Estimated Savings</th><td className="border px-4 py-2 font-semibold text-green-700">{summary.savings_kWh.toFixed(2)} kWh</td></tr>
          <tr><th className="border px-4 py-2 font-semibold text-green-700">Estimated Cost Savings</th><td className="border px-4 py-2 font-semibold text-green-700">${summary.savings_cost.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <h2 className="text-2xl font-semibold mb-4">Room-Level Breakdown</h2>
      <table className="w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-gray-100 text-xs uppercase">
          <tr>
            <th className="border px-2 py-2">Room</th>
            <th className="border px-2 py-2">Existing (W)</th>
            <th className="border px-2 py-2">Suggested (W)</th>
            <th className="border px-2 py-2">Hours/Day</th>
            <th className="border px-2 py-2">Days/Year</th>
            <th className="border px-2 py-2">Existing kWh</th>
            <th className="border px-2 py-2">Suggested kWh</th>
            <th className="border px-2 py-2 text-green-700">Savings kWh</th>
            <th className="border px-2 py-2 text-green-700">Savings ($)</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.roomName}>
              <td className="border px-2 py-1">{room.roomName}</td>
              <td className="border px-2 py-1">{room.existingWattage}</td>
              <td className="border px-2 py-1">{room.suggestedWattage}</td>
              <td className="border px-2 py-1">{room.operationHoursPerDay}</td>
              <td className="border px-2 py-1">{room.operationDaysPerYear}</td>
              <td className="border px-2 py-1">{room.existingEnergy_kWh.toFixed(2)}</td>
              <td className="border px-2 py-1">{room.suggestedEnergy_kWh.toFixed(2)}</td>
              <td className="border px-2 py-1 text-green-700 font-semibold">{room.savings_kWh.toFixed(2)}</td>
              <td className="border px-2 py-1 text-green-700 font-semibold">${room.savings_cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
