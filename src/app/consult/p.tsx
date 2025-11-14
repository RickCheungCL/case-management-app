import React, { useState } from 'react';
import { Mail, Zap, ArrowRight, CheckCircle, Lightbulb, TrendingDown, Download, Send } from 'lucide-react';

// Product specifications for existing products
const EXISTING_PRODUCT_SPECS = {
  'Fluorescent Tubes': { 
    power: 18, 
    unit: 'W',
    tubesPerFixture: 2,
    ballastPower: 8,
    description: 'T8 Fluorescent (2x18W + 8W ballast = 44W per fixture)'
  },
  'Metal Halide Highbay': { 
    power: 150, 
    unit: 'W',
    tubesPerFixture: 1,
    ballastPower: 25,
    description: '150W lamp + 25W ballast = 175W per fixture'
  },
  'Halogen Downlights': { 
    power: 50, 
    unit: 'W',
    tubesPerFixture: 1,
    ballastPower: 0,
    description: '50W per fixture'
  },
  'HPS Street Lights': { 
    power: 250, 
    unit: 'W',
    tubesPerFixture: 1,
    ballastPower: 30,
    description: '250W lamp + 30W ballast = 280W per fixture'
  },
  'Incandescent Bulbs': { 
    power: 60, 
    unit: 'W',
    tubesPerFixture: 1,
    ballastPower: 0,
    description: '60W per fixture'
  }
};

const REPLACEMENT_PRODUCT_SPECS = {
  'LED Panel': { 
    power: 30, 
    unit: 'W',
    description: '30W per panel (replaces 2-4 tube fixtures)'
  },
  'LED Strip': { 
    power: 30, 
    unit: 'W',
    description: '30W per strip (flexible retrofit solution)'
  },
  'Linear Highbay': { 
    power: 80, 
    unit: 'W',
    description: '80W per fixture (replaces 150-250W fixtures)'
  },
  'UFO': { 
    power: 100, 
    unit: 'W',
    description: '100W per fixture (replaces 250-400W fixtures)'
  }
};

const existingProducts = [
  { 
    id: 1, 
    name: 'Fluorescent Tubes',
    power: 18,
    tubesPerFixture: 2,
    image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&h=300&fit=crop'
  },
  { 
    id: 2, 
    name: 'Metal Halide Highbay',
    power: 150,
    tubesPerFixture: 1,
    image: 'https://images.unsplash.com/photo-1455734729978-db1ae4f687fc?w=400&h=300&fit=crop'
  },
  { 
    id: 3, 
    name: 'Halogen Downlights',
    power: 50,
    tubesPerFixture: 1,
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=300&fit=crop'
  },
  { 
    id: 4, 
    name: 'HPS Street Lights',
    power: 250,
    tubesPerFixture: 1,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop'
  },
  { 
    id: 5, 
    name: 'Incandescent Bulbs',
    power: 60,
    tubesPerFixture: 1,
    image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=300&fit=crop'
  }
];

const replacementProducts = [
  { 
    id: 'LED Panel', 
    name: 'LED Panel',
    power: 30,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
  },
  { 
    id: 'LED Strip', 
    name: 'LED Strip',
    power: 30,
    image: 'https://images.unsplash.com/photo-1620421680010-0766ff230392?w=400&h=300&fit=crop'
  },
  { 
    id: 'Linear Highbay', 
    name: 'Linear Highbay',
    power: 80,
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop'
  },
  { 
    id: 'UFO', 
    name: 'UFO Highbay',
    power: 100,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop'
  }
];

export default function EnergyCalculator() {
  const [step, setStep] = useState(1);
  const [showReport, setShowReport] = useState(false);
  const [formData, setFormData] = useState({
    existingProduct: '',
    existingProductOther: '',
    existingProductOtherWattage: '',
    tubesPerFixture: 2,
    replacementProduct: '',
    name: '',
    email: ''
  });

  const handleProductSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'existingProduct' && value !== 'Other') {
      const product = existingProducts.find(p => p.name === value);
      if (product) {
        setFormData(prev => ({ ...prev, tubesPerFixture: product.tubesPerFixture }));
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Here you would call your API to save to Google Sheets and send email
    // For now, we'll just show the report
    setShowReport(true);
  };

  const canProceed = () => {
    if (step === 1) {
      if (formData.existingProduct === 'Other') {
        return formData.existingProductOther.trim() !== '' && formData.existingProductOtherWattage.trim() !== '';
      }
      return formData.existingProduct !== '';
    }
    if (step === 2) return formData.replacementProduct !== '';
    if (step === 3) return formData.name.trim() !== '' && formData.email.trim() !== '';
    return false;
  };

  const selectedReplacement = replacementProducts.find(p => p.id === formData.replacementProduct);
  const selectedExisting = existingProducts.find(p => p.name === formData.existingProduct);

  const getFixturePower = () => {
    if (formData.existingProduct === 'Other') {
      return parseFloat(formData.existingProductOtherWattage) || 0;
    } else if (selectedExisting) {
      const spec = EXISTING_PRODUCT_SPECS[formData.existingProduct];
      return (spec.power * formData.tubesPerFixture) + spec.ballastPower;
    }
    return 0;
  };

  const calculateSavings = (fixtureCount = 1, hoursPerDay = 12, daysPerYear = 365, costPerKwh = 0.12) => {
    const existingPower = getFixturePower();
    const replacementPower = REPLACEMENT_PRODUCT_SPECS[formData.replacementProduct]?.power || 0;
    
    const savingsPerFixture = existingPower - replacementPower;
    const totalSavingsWatts = savingsPerFixture * fixtureCount;
    
    const hoursPerYear = hoursPerDay * daysPerYear;
    const existingKwhPerYear = (existingPower * fixtureCount * hoursPerYear) / 1000;
    const replacementKwhPerYear = (replacementPower * fixtureCount * hoursPerYear) / 1000;
    const savingsKwhPerYear = existingKwhPerYear - replacementKwhPerYear;
    const savingsCostPerYear = savingsKwhPerYear * costPerKwh;
    
    const co2ReductionKg = savingsKwhPerYear * 0.39;
    const co2ReductionTonnes = co2ReductionKg / 1000;
    
    return {
      existingPower,
      replacementPower,
      savingsPerFixture,
      totalSavingsWatts,
      existingKwhPerYear,
      replacementKwhPerYear,
      savingsKwhPerYear,
      savingsCostPerYear,
      co2ReductionTonnes,
      percentReduction: existingPower > 0 ? ((savingsPerFixture / existingPower) * 100) : 0
    };
  };

  // Report Page
  if (showReport) {
    const savings1 = calculateSavings(1);
    const savings50 = calculateSavings(50);
    const savings100 = calculateSavings(100);
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Action Buttons */}
          <div className="mb-6 flex gap-4 justify-end print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            <button
              onClick={() => {
                alert('Email will be sent to: ' + formData.email);
                // Here you would call your API endpoint to send email
              }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition font-semibold shadow-lg"
            >
              <Send className="w-5 h-5" />
              Send to Email
            </button>
            <button
              onClick={() => {
                setShowReport(false);
                setStep(1);
                setFormData({
                  existingProduct: '',
                  existingProductOther: '',
                  existingProductOtherWattage: '',
                  tubesPerFixture: 2,
                  replacementProduct: '',
                  name: '',
                  email: ''
                });
              }}
              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-semibold shadow-lg"
            >
              New Calculation
            </button>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-12 border-b-4 border-emerald-600 pb-8">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-20 h-20 text-emerald-600" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">Energy Savings Analysis Report</h1>
              <p className="text-xl text-gray-600 mb-6">Fixture-by-Fixture Comparison & ROI Projection</p>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 inline-block border-2 border-emerald-200">
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Prepared For:</p>
                    <p className="text-lg font-bold text-gray-900">{formData.name}</p>
                    <p className="text-sm text-gray-700">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Report Date:</p>
                    <p className="text-lg font-bold text-gray-900">{currentDate}</p>
                    <p className="text-sm text-gray-700">Case ID: #{Date.now().toString().slice(-8)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📊</span>
                </div>
                Executive Summary
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200">
                  <p className="text-sm font-semibold text-red-800 mb-2">CURRENT CONSUMPTION</p>
                  <p className="text-4xl font-bold text-red-600">{savings1.existingPower}W</p>
                  <p className="text-sm text-gray-700 mt-2">Per fixture</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                  <p className="text-sm font-semibold text-emerald-800 mb-2">PROPOSED LED</p>
                  <p className="text-4xl font-bold text-emerald-600">{savings1.replacementPower}W</p>
                  <p className="text-sm text-gray-700 mt-2">Per fixture</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <p className="text-sm font-semibold text-blue-800 mb-2">ENERGY SAVINGS</p>
                  <p className="text-4xl font-bold text-blue-600">{savings1.savingsPerFixture}W</p>
                  <p className="text-sm text-gray-700 mt-2">{savings1.percentReduction.toFixed(1)}% reduction</p>
                </div>
              </div>
            </div>

            {/* Understanding Your Current Lighting */}
            <div className="mb-12 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-8 border-2 border-amber-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-amber-600" />
                Understanding Your Current Lighting System
              </h2>
              <div className="space-y-4 text-gray-800 leading-relaxed">
                <p className="text-lg">
                  Your existing <span className="font-bold text-amber-800">{formData.existingProduct}</span> fixtures are configured with:
                </p>
                <div className="bg-white rounded-lg p-6 space-y-3">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-semibold">Tubes/Lamps per fixture:</span>
                    <span className="text-2xl font-bold text-amber-700">{formData.tubesPerFixture}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-semibold">Power per tube:</span>
                    <span className="text-2xl font-bold">{EXISTING_PRODUCT_SPECS[formData.existingProduct]?.power || 0}W</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-semibold">Total tube power:</span>
                    <span className="text-2xl font-bold">{formData.tubesPerFixture * (EXISTING_PRODUCT_SPECS[formData.existingProduct]?.power || 0)}W</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-semibold">Ballast consumption:</span>
                    <span className="text-2xl font-bold text-red-600">+{EXISTING_PRODUCT_SPECS[formData.existingProduct]?.ballastPower || 0}W</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 bg-red-50 rounded-lg p-4">
                    <span className="text-lg font-bold">TOTAL PER FIXTURE:</span>
                    <span className="text-4xl font-bold text-red-600">{getFixturePower()}W</span>
                  </div>
                </div>
                <p className="text-lg mt-6">
                  By upgrading to <span className="font-bold text-emerald-700">{formData.replacementProduct}</span> LED fixtures at only <span className="font-bold text-emerald-700">{REPLACEMENT_PRODUCT_SPECS[formData.replacementProduct]?.power || 0}W</span> each, you eliminate ballast consumption entirely and achieve superior lighting quality with dramatically reduced energy costs.
                </p>
              </div>
            </div>

            {/* Detailed Savings Analysis */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-emerald-600" />
                Detailed Savings Analysis
              </h2>
              
              <div className="overflow-x-auto shadow-xl rounded-xl border-2 border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                      <th className="px-6 py-4 text-left font-bold text-lg">Scale</th>
                      <th className="px-6 py-4 text-center font-bold text-lg">Power Reduction</th>
                      <th className="px-6 py-4 text-center font-bold text-lg">Annual Energy Saved</th>
                      <th className="px-6 py-4 text-center font-bold text-lg">Annual Cost Savings</th>
                      <th className="px-6 py-4 text-center font-bold text-lg">CO₂ Reduction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-200">
                    <tr className="bg-white hover:bg-gray-50 transition">
                      <td className="px-6 py-6 font-bold text-gray-900 text-lg">1 Fixture</td>
                      <td className="px-6 py-6 text-center">
                        <span className="text-2xl font-bold text-emerald-600">{savings1.savingsPerFixture}W</span>
                        <p className="text-sm text-gray-600 mt-1">{savings1.percentReduction.toFixed(1)}% reduction</p>
                      </td>
                      <td className="px-6 py-6 text-center text-xl font-semibold">{savings1.savingsKwhPerYear.toFixed(0)} kWh</td>
                      <td className="px-6 py-6 text-center">
                        <span className="text-2xl font-bold text-blue-600">${savings1.savingsCostPerYear.toFixed(2)}</span>
                        <p className="text-sm text-gray-600 mt-1">${(savings1.savingsCostPerYear / 12).toFixed(2)}/month</p>
                      </td>
                      <td className="px-6 py-6 text-center text-lg font-semibold">{savings1.co2ReductionTonnes.toFixed(3)} tonnes</td>
                    </tr>
                    <tr className="bg-blue-50 hover:bg-blue-100 transition">
                      <td className="px-6 py-6 font-bold text-gray-900 text-lg">50 Fixtures</td>
                      <td className="px-6 py-6 text-center">
                        <span className="text-2xl font-bold text-emerald-600">{savings50.totalSavingsWatts.toLocaleString()}W</span>
                        <p className="text-sm text-gray-600 mt-1">{(savings50.totalSavingsWatts / 1000).toFixed(1)} kW saved</p>
                      </td>
                      <td className="px-6 py-6 text-center text-xl font-semibold">{savings50.savingsKwhPerYear.toLocaleString()} kWh</td>
                      <td className="px-6 py-6 text-center">
                        <span className="text-2xl font-bold text-blue-600">${savings50.savingsCostPerYear.toLocaleString()}</span>
                        <p className="text-sm text-gray-600 mt-1">${(savings50.savingsCostPerYear / 12).toFixed(2)}/month</p>
                      </td>
                      <td className="px-6 py-6 text-center text-lg font-semibold">{savings50.co2ReductionTonnes.toFixed(2)} tonnes</td>
                    </tr>
                    <tr className="bg-emerald-50 hover:bg-emerald-100 transition">
                      <td className="px-6 py-6 font-bold text-gray-900 text-lg">100 Fixtures</td>
                      <td className="px-6 py-6 text-center">
                        <span className="text-2xl font-bold text-emerald-600">{savings100.totalSavingsWatts.toLocaleString()}W</span>
                        <p className="text-sm text-gray-600 mt-1">{(savings100.totalSavingsWatts / 1000).toFixed(1)} kW saved</p>
                      </td>
                      <td className="px-6 py-6 text-center text-xl font-semibold">{savings100.savingsKwhPerYear.toLocaleString()} kWh</td>
                      <td className="px-6 py-6 text-center">
                        <span className="text-2xl font-bold text-blue-600">${savings100.savingsCostPerYear.toLocaleString()}</span>
                        <p className="text-sm text-gray-600 mt-1">${(savings100.savingsCostPerYear / 12).toFixed(2)}/month</p>
                      </td>
                      <td className="px-6 py-6 text-center text-lg font-semibold">{savings100.co2ReductionTonnes.toFixed(2)} tonnes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-300">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Calculation Assumptions:</span> 12 hours/day operation, 365 days/year, $0.12 per kWh electricity rate, 0.39 kg CO₂ per kWh
                </p>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="mb-12 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-8 border-2 border-green-300">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">🌍 Environmental Impact (100 Fixtures)</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                  <div className="text-6xl mb-4">🏭</div>
                  <p className="text-5xl font-bold text-green-700 mb-3">{savings100.co2ReductionTonnes.toFixed(2)}</p>
                  <p className="text-xl text-gray-800 font-semibold">tonnes of CO₂</p>
                  <p className="text-gray-600 mt-2">prevented annually</p>
                </div>
                <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                  <div className="text-6xl mb-4">🌳</div>
                  <p className="text-5xl font-bold text-green-700 mb-3">{Math.round(savings100.co2ReductionTonnes * 1000 / 21.8).toLocaleString()}</p>
                  <p className="text-xl text-gray-800 font-semibold">trees</p>
                  <p className="text-gray-600 mt-2">equivalent that could be planted</p>
                </div>
              </div>
            </div>

            {/* Additional LED Benefits */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">✨ Additional LED Advantages</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Extended Lifespan</h3>
                      <p className="text-gray-700">LEDs last 50,000+ hours compared to 10,000-20,000 hours for traditional lighting, drastically reducing maintenance costs and replacement frequency.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">No Ballast Required</h3>
                      <p className="text-gray-700">Integrated LED drivers eliminate ballast replacement costs and potential failure points, simplifying maintenance.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Superior Light Quality</h3>
                      <p className="text-gray-700">Higher Color Rendering Index (CRI) and zero flicker provide better visibility, reduced eye strain, and improved workplace safety.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Instant Operation</h3>
                      <p className="text-gray-700">Full brightness immediately without warm-up time, unlike traditional fixtures that require several minutes to reach full output.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-teal-50 rounded-xl p-6 border-2 border-teal-200">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-teal-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Environmentally Safe</h3>
                      <p className="text-gray-700">No mercury or hazardous materials, making disposal easier and safer for the environment compared to fluorescent tubes.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">Temperature Performance</h3>
                      <p className="text-gray-700">LEDs perform efficiently in cold environments and generate minimal heat, reducing cooling costs in climate-controlled spaces.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mb-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-6">📋 Recommended Next Steps</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <p className="text-lg">Schedule a site assessment to verify fixture counts and current conditions</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <p className="text-lg">Receive detailed product specifications and installation timeline</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <p className="text-lg">Review financing options and available rebates or incentives</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <p className="text-lg">Begin implementation with minimal disruption to your operations</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-300 pt-8">
              <div className="text-center text-gray-600">
                <p className="text-lg font-semibold mb-2">Questions about this report?</p>
                <p className="mb-4">Contact us to discuss your energy savings opportunity</p>
                <p className="text-sm text-gray-500 italic">
                  This report is provided for informational purposes. Actual savings may vary based on usage patterns, 
                  electricity rates, and installation conditions. All calculations assume 12 hours/day operation at $0.12/kWh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form Steps
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
        <div className="flex items-center justify-center mb-8">
          <Zap className="w-10 h-10 text-emerald-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Energy Calculator</h1>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= num ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {num}
                </div>
                {num < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > num ? 'bg-emerald-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">What is your existing lighting product?</h2>
              <p className="text-gray-600">Select the lighting product currently used in your company.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {existingProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect('existingProduct', product.name)}
                    className={`p-4 rounded-lg border-2 transition hover:shadow-lg ${
                      formData.existingProduct === product.name
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-orange-600 font-bold text-lg mt-1">{product.power}W per tube</p>
                  </button>
                ))}
                
                <button
                  onClick={() => handleProductSelect('existingProduct', 'Other')}
                  className={`p-4 rounded-lg border-2 transition hover:shadow-lg flex items-center justify-center ${
                    formData.existingProduct === 'Other'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg mb-3">
                      <span className="text-4xl text-gray-400">+</span>
                    </div>
                    <p className="font-semibold text-gray-800">Other</p>
                  </div>
                </button>
              </div>

              {formData.existingProduct === 'Other' && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={formData.existingProductOther}
                    onChange={(e) => handleInputChange('existingProductOther', e.target.value)}
                    placeholder="Please specify your existing product"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={formData.existingProductOtherWattage}
                    onChange={(e) => handleInputChange('existingProductOtherWattage', e.target.value)}
                    placeholder="Total wattage per fixture (W)"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {formData.existingProduct && formData.existingProduct !== 'Other' && (
                <div className="mt-6 space-y-4">
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Fixture Configuration:</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-700 font-medium">Tubes/Lamps per fixture:</label>
                        <select
                          value={formData.tubesPerFixture}
                          onChange={(e) => handleInputChange('tubesPerFixture', parseInt(e.target.value))}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none font-semibold"
                        >
                          <option value={1}>1 tube</option>
                          <option value={2}>2 tubes</option>
                          <option value={3}>3 tubes</option>
                          <option value={4}>4 tubes</option>
                        </select>
                      </div>
                      <div className="pt-3 border-t border-orange-300 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Power per tube:</span>
                          <span className="font-bold">{EXISTING_PRODUCT_SPECS[formData.existingProduct]?.power || 0}W</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tubes × Power:</span>
                          <span className="font-bold">{formData.tubesPerFixture} × {EXISTING_PRODUCT_SPECS[formData.existingProduct]?.power || 0}W = {formData.tubesPerFixture * (EXISTING_PRODUCT_SPECS[formData.existingProduct]?.power || 0)}W</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ballast power:</span>
                          <span className="font-bold">+{EXISTING_PRODUCT_SPECS[formData.existingProduct]?.ballastPower || 0}W</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 border-orange-400">
                          <span className="font-semibold text-gray-900">Total per fixture:</span>
                          <span className="text-xl font-bold text-orange-600">{getFixturePower()}W</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-700">
                      💡 <span className="font-semibold">Note:</span> {EXISTING_PRODUCT_SPECS[formData.existingProduct]?.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">Which LED product would you like to replace with?</h2>
              <p className="text-gray-600">Select the energy-efficient LED alternative you're considering.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {replacementProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect('replacementProduct', product.id)}
                    className={`p-4 rounded-lg border-2 transition hover:shadow-lg ${
                      formData.replacementProduct === product.id
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                    <p className="font-semibold text-gray-800 text-lg">{product.name}</p>
                    <p className="text-emerald-600 font-bold text-xl mt-1">{product.power}W</p>
                  </button>
                ))}
              </div>

              {formData.replacementProduct && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Selected LED Specifications:</h3>
                    <p className="text-gray-700 mb-3">
                      <span className="font-semibold">{selectedReplacement.name}</span> - {REPLACEMENT_PRODUCT_SPECS[formData.replacementProduct]?.description}
                    </p>
                    <div className="bg-white rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Power per fixture:</span>
                        <span className="text-emerald-600 font-bold">{selectedReplacement.power}W</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Built-in driver:</span>
                        <span className="font-semibold">✓ No ballast needed</span>
                      </div>
                    </div>
                  </div>
                  
                  {getFixturePower() > 0 && (
                    <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white">
                      <h3 className="font-bold text-lg mb-4 text-center">💡 Energy Savings Preview</h3>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-emerald-100 text-sm mb-1">Per Fixture</p>
                          <p className="text-3xl font-bold">{getFixturePower() - selectedReplacement.power}W</p>
                          <p className="text-emerald-200 text-xs mt-1">{((getFixturePower() - selectedReplacement.power) / getFixturePower() * 100).toFixed(1)}% reduction</p>
                        </div>
                        <div>
                          <p className="text-emerald-100 text-sm mb-1">100 Fixtures</p>
                          <p className="text-3xl font-bold">{((getFixturePower() - selectedReplacement.power) * 100 / 1000).toFixed(1)}kW</p>
                          <p className="text-emerald-200 text-xs mt-1">Total power saved</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">Your Contact Information</h2>
              <p className="text-gray-600">We'll send you a detailed energy calculation report shortly.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@company.com"
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 text-lg">Your Selection Summary:</h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-semibold">Current:</span> {formData.existingProduct} ({getFixturePower()}W per fixture)
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Replacing with:</span> {formData.replacementProduct} ({REPLACEMENT_PRODUCT_SPECS[formData.replacementProduct].power}W per fixture)
                  </p>
                  <p className="text-emerald-700 font-bold text-lg pt-2 border-t border-emerald-300">
                    Savings: {getFixturePower() - REPLACEMENT_PRODUCT_SPECS[formData.replacementProduct].power}W per fixture
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`ml-auto px-6 py-3 rounded-lg font-medium flex items-center transition ${
                  canProceed()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className={`ml-auto px-6 py-3 rounded-lg font-medium flex items-center transition ${
                  canProceed()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Mail className="mr-2 w-5 h-5" /> Generate Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}