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
    <>
      {/* Add this style tag */}
      <style jsx>{`
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        html, body {
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        
        .printable {
        transform: scale(1) !important;
        transform-origin: top left !important;
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        margin: 0 !important;
        overflow: visible !important;
        }
        
        .container, .max-w-7xl {
          max-width: none !important;
          width: 100% !important;
        }
        
        /* Keep summary and calculator together on same page */
        .summary-calculator-group {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        display: block !important;
        }
        .summary-calculator-group > * {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: avoid !important;
        break-before: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        }
        /* Force room breakdown to start on new page */
        .room-breakdown {
          page-break-before: always !important;
          break-before: page !important;
        }
        
        /* Reduce spacing for print to fit more on first page */
        .py-8 {
      padding-top: 0.25rem !important;
      padding-bottom: 0.25rem !important;
    }
    
    .mb-12 {
      margin-bottom: 0.5rem !important;
    }
    
    .mb-8 {
      margin-bottom: 0.25rem !important;
    }
    
    .mb-6 {
      margin-bottom: 0.25rem !important;
    }
    
    .p-8 {
      padding: 0.5rem !important;
    }
    
    .p-6 {
      padding: 0.25rem !important;
    }
    
    /* Make text even smaller */
    .text-4xl, .text-5xl {
      font-size: 1rem !important;
      line-height: 1.2 !important;
    }
    
    .text-3xl {
      font-size: 1rem !important;
      line-height: 1.2 !important;
    }
    
    .text-2xl {
      font-size: 1rem !important;
      line-height: 1.2 !important;
    }
    
    .text-xl {
      font-size: 1rem !important;
    }
    
    .text-lg {
      font-size: 1rem !important;
    }
    
    /* Make grid items smaller */
    .gap-8 {
      gap: 0.5rem !important;
    }
    
    .gap-6 {
      gap: 0.25rem !important;
    }
    
    /* Reduce heights even more */
    .min-h-[120px] {
      min-height: 60px !important;
    }
    
    /* Make calculator more compact */
    .space-y-6 {
      gap: 0.25rem !important;
    }
    
    .grid.lg\\:grid-cols-2 {
      grid-template-columns: 1fr 1fr !important;
      gap: 0.5rem !important;
    }
    
    /* Remove gradients for better print */
    @keyframes plant-tree {
    0% { transform: translateY(10px) scale(0.8); opacity: 0; }
    50% { transform: translateY(-5px) scale(1.1); opacity: 0.8; }
    100% { transform: translateY(0) scale(1); opacity: 0.6; }
  }
  
  .plant-animation {
    animation: plant-tree 4s ease-in-out infinite;
  }
    
    @page {
      margin: 0.2in;
      size: letter;
        
    
      }
    }
    `}</style>
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 printable">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="summary-calculator-group">
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
                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                } rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300`}>
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
            {/* Environmental Impact Card with Dynamic Tree Background and Planting Animation */}

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            {/* Dynamic Tree Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                {(() => {
                const treeCount = Math.round((Number(summary.savings_kWh) * 0.39) / 21.8);
                const displayTrees = Math.min(treeCount, 45); // Reduced to 45 to leave space for person
                const trees = [];
                
                for (let i = 0; i < displayTrees; i++) {
                    const randomX = Math.random() * 100;
                    const randomY = Math.random() * 100;
                    const randomSize = 12 + Math.random() * 8;
                    const randomOpacity = 0.3 + Math.random() * 0.7;
                    
                    trees.push(
                    <div
                        key={i}
                        className="absolute text-green-500"
                        style={{
                        left: `${randomX}%`,
                        top: `${randomY}%`,
                        fontSize: `${randomSize}px`,
                        opacity: randomOpacity,
                        transform: `rotate(${Math.random() * 40 - 20}deg)`
                        }}
                    >
                        🌳
                    </div>
                    );
                }
                
                // Add person planting trees if we have trees to show
                if (treeCount > 0) {
                    trees.push(
                    <div
                        key="planter"
                        className="absolute bottom-4 right-4 text-2xl animate-bounce"
                        style={{
                        opacity: 0.6,
                        animationDelay: '0.5s',
                        animationDuration: '2s'
                        }}
                    >
                        🧑‍🌾
                    </div>
                    );
                    
                    // Add a small tree being planted near the person
                    trees.push(
                    <div
                        key="new-tree"
                        className="absolute bottom-6 right-8 text-lg animate-pulse"
                        style={{
                        opacity: 0.8,
                        animationDelay: '1s',
                        animationDuration: '3s'
                        }}
                    >
                        🌱
                    </div>
                    );
                    
                    // Add some tools/shovel
                    trees.push(
                    <div
                        key="tools"
                        className="absolute bottom-2 right-6 text-sm"
                        style={{
                        opacity: 0.5,
                        transform: 'rotate(15deg)'
                        }}
                    >
                        🪴
                    </div>
                    );
                }
                
                return trees;
                })()}
            </div>

            {/* Card Content */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Environmental Impact</h3>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
                </div>
                <div className="space-y-3 bg-white bg-opacity-90 rounded-lg p-3">
                <div>
                    <p className="text-2xl font-bold text-gray-900">
                    {((Number(summary.savings_kWh) * 0.39) / 1000).toFixed(1)} tonnes
                    </p>
                    <p className="text-sm text-gray-600">CO₂ reduced annually</p>
                </div>
                <div className="border-t border-gray-200 pt-2">
                    <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-lg font-bold text-gray-900">
                        {Math.round((Number(summary.savings_kWh) * 0.39) / 21.8)} trees
                    </p>
                    <span className="text-sm text-gray-600">equivalent planted</span>
                    </div>
                </div>
                </div>
            </div>
            </div>

        {/* Payback Calculator */}
            {/* Payback Calculator */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                </div>
                <div>
                <h2 className="text-2xl font-bold text-gray-900">Investment Payback Calculator</h2>
                <p className="text-gray-600 mt-1">Calculate your period based on energy savings</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Current Savings Display */}
                <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Annual Savings Summary</h3>
                
                <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg p-6 border border-emerald-200">
                    <div className="text-center">
                    <p className="text-sm font-medium text-emerald-800 mb-2">Annual Cost Savings</p>
                    <p className="text-3xl font-bold text-emerald-900">
                        {Number(summary.savings_cost) > 0 ? '$' : '+$'}{Math.abs(Number(summary.savings_cost)).toFixed(2)}
                    </p>
                    <p className="text-sm text-emerald-700 mt-1">
                        {Number(summary.savings_cost) > 0 
                        ? `${Number(summary.savings_kWh).toFixed(2)} kWh saved annually`
                        : `${Math.abs(Number(summary.savings_kWh)).toFixed(2)} kWh additional usage annually`
                        }
                    </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200">
                    <div className="text-center">
                    <p className="text-sm font-medium text-blue-800 mb-2">Energy Reduction</p>
                    <p className="text-2xl font-bold text-blue-900">
                        {summary.totalExistingWattage - summary.totalSuggestedWattage}W
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                        {(((summary.totalExistingWattage - summary.totalSuggestedWattage) / summary.totalExistingWattage) * 100).toFixed(1)}% reduction
                    </p>
                    </div>
                </div>

                
                </div>

                {/* Payback Calculator Input */}
                <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Payback Calculator</h3>
                
                <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg p-6 border border-gray-200">
                    <label htmlFor="investment-cost" className="block text-sm font-medium text-gray-700 mb-3">
                    Initial Cost ($)
                    </label>
                    <input
                    type="number"
                    id="investment-cost"
                    name="investment-cost"
                    min="0"
                    step="100"
                    placeholder="Enter total cost..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-semibold"
                    onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        const cost = parseFloat(target.value) || 0;
                        const annualSavings = Math.abs(Number(summary.savings_cost));
                        const paybackYears = annualSavings > 0 ? cost / annualSavings : 0;
                        const paybackMonths = paybackYears * 12;
                        
                        const resultDiv = document.getElementById('payback-result');
                        if (resultDiv) {
                        if (cost > 0 && annualSavings > 0) {
                            resultDiv.innerHTML = `
                            <div class="text-center">
                                <p class="text-sm font-medium text-purple-800 mb-2">Payback Period</p>
                                <p class="text-3xl font-bold text-purple-900">${paybackYears.toFixed(1)} years</p>
                                <p class="text-sm text-purple-700 mt-1">≈ ${paybackMonths.toFixed(0)} months</p>
                                <div class="w-full bg-gray-200 rounded-full h-3 mt-4">
                                <div class="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-500" style="width: ${Math.min((1 / paybackYears) * 100, 100)}%"></div>
                                </div>
                                <p class="text-xs text-gray-600 mt-2">Break-even visualization (${(1/paybackYears*100).toFixed(1)}% progress per year)</p>
                            </div>
                            `;
                        } else if (cost > 0 && annualSavings <= 0) {
                            resultDiv.innerHTML = `
                            <div class="text-center">
                                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                </div>
                                <p class="text-sm font-medium text-red-800">No Payback Period</p>
                                <p class="text-xs text-red-600 mt-1">Current configuration shows no cost savings</p>
                            </div>
                            `;
                        } else {
                            resultDiv.innerHTML = `
                            <div class="text-center">
                                <p class="text-sm font-medium text-gray-500">Enter cost to calculate payback period</p>
                            </div>
                            `;
                        }
                        }
                    }}
                    />
                </div>

                <div id="payback-result" className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg p-6 border border-purple-200 min-h-[120px] flex items-center justify-center">
                    <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Enter cost to calculate payback period</p>
                    </div>
                </div>

                {Number(summary.savings_cost) > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-start gap-3">
                        <div className="p-1 bg-yellow-200 rounded-full">
                        <svg className="w-4 h-4 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div>
                        <p className="text-sm font-medium text-yellow-800">Note</p>
                        <p className="text-xs text-yellow-700 mt-1">
                            Payback calculations are based on your projected annual savings of ${Math.abs(Number(summary.savings_cost)).toFixed(2)}. 
                            Actual results may vary based on usage patterns and electricity rates.
                        </p>
                        </div>
                    </div>
                    </div>
                )}
                </div>
            </div>
            </div>

        </div>        
        {/* Room Breakdown */}
        <div className="room-breakdown">
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
    </>
  );
}