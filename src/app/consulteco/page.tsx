"use client"
import React, { useState } from 'react';
import { Mail, Zap, ArrowRight, CheckCircle, Lightbulb, TrendingDown, Send } from 'lucide-react';



// Product specifications for replacement products
const REPLACEMENT_PRODUCT_SPECS = {
  'LED Panel': { power: 30, unit: 'W' },
  'LED Strip': { power: 30, unit: 'W' },
  'Linear Highbay': { power: 80, unit: 'W' },
  'UFO': { power: 100, unit: 'W' }
};
// Product specifications for existing products
const EXISTING_PRODUCT_SPECS = {
  'Fluorescent Panels': { power: 18, unit: 'W',ballastPower :12 },
  'Fluorescent Strip Light': { power: 200, unit: 'W' ,ballastPower : 0},
  'HID Highbay': { power: 55, unit: 'W' ,ballastPower : 18},
  'Ceiling Light': { power: 32, unit: 'W' ,ballastPower :12 }
};
const existingProducts = [
  { 
    id: 1, 
    name: 'Fluorescent Panels',
    power: 18,
    tubesPerFixture: 4,
    image: 'https://images.homedepot.ca/productimages/p_1001654157.jpg?product-images=l'
  },
  { 
    id: 2, 
    name: 'Fluorescent Strip Light',
    power: 200,
    tubesPerFixture:1,
    image: 'https://images.thdstatic.com/productImages/b1b80268-7203-4903-9a25-35846d22b855/svn/white-envirolite-strip-light-fixtures-st704t1840-64_600.jpg'
  },
  { 
    id: 3, 
    name: 'HID Highbay',
    power: 55,
    tubesPerFixture:1,
    image: 'data:image/jpeg;base64,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'
  },
  { 
    id: 4, 
    name: 'Ceiling Light',
    power: 32,
    tubesPerFixture:1,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYlGdGGNiGUtk-YtzNSy-scnpFE4jhcBbRRg&s'
  },

];

const replacementProducts = [
  { 
    id: 'LED Panel', 
    name: 'LED Panel',
    power: 30,
    image: 'https://dotlighting.ca/wp-content/uploads/2025/08/1-2401301A524200.jpg'
  },
  { 
    id: 'LED Strip', 
    name: 'LED Strip',
    power: 30,
    image: 'https://dotlighting.ca/wp-content/uploads/2025/09/1-2401302114352G-4-1.png'
  },
  { 
    id: 'Linear Highbay', 
    name: 'Linear Highbay',
    power: 80,
    image: 'https://dotlighting.ca/wp-content/uploads/2025/08/LED-Linear-High-Bay-2Ft3.png'
  },
  { 
    id: 'UFO', 
    name: 'UFO Highbay',
    power: 100,
    image: 'https://dotlighting.ca/wp-content/uploads/2025/08/1-240126153301636-1.png'
  }
];

export default function EnergyCalculator() {
  const [approxFixtures, setApproxFixtures] = useState('');
  const [step, setStep] = useState(1);
  const [showReport, setShowReport] = useState(false);
  const [formData, setFormData] = useState({
    existingProduct: '',
    existingProductOther: '',
    existingProductOtherWattage: '',
    tubesPerFixture: 2,
    replacementProduct: '',
    name: '',
    email: '',
    approxFixtures: '',
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

 const handleSubmit = async () => {
  try {
    const savings1 = calculateSavings(1);
    const savings50 = calculateSavings(50);
    const savings100 = calculateSavings(100);
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const reportData = {
      timestamp: new Date().toISOString(),
      name: formData.name,
      email: formData.email,
      reportDate: currentDate,
      existingProduct: formData.existingProduct === 'Other' 
        ? `${formData.existingProductOther} (${formData.existingProductOtherWattage}W)`
        : formData.existingProduct,
      replacementProduct: formData.replacementProduct,
      tubesPerFixture: formData.tubesPerFixture,
      existingPowerPerFixture: savings1.existingPower,
      replacementPowerPerFixture: savings1.replacementPower,
      savingsPerFixture: savings1.savingsPerFixture,
      percentReduction: savings1.percentReduction.toFixed(1),
      annualSavings1Fixture: savings1.savingsCostPerYear.toFixed(2),
      annualSavings50Fixtures: savings50.savingsCostPerYear.toFixed(2),
      annualSavings100Fixtures: savings100.savingsCostPerYear.toFixed(2),
      co2Reduction100Fixtures: savings100.co2ReductionTonnes.toFixed(2),
      approxFixtures: formData.approxFixtures,
    };

    // ========================================
    // 1. SAVE TO GOOGLE SHEETS (Server-side)
    // ========================================
    const sheetResponse = await fetch('/api/send-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData)
    });

    if (!sheetResponse.ok) {
      console.error('Failed to save to Google Sheets');
    }

    // ========================================
    // 2. SEND EMAIL (Client-side with EmailJS)
    // ========================================
    const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const EMAILJS_TEMPLATE_ID = 'template_1r9p7ke';
    const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      console.log('📧 Sending email via EmailJS (client-side)...');
      
      const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: reportData.email,
            to_name: reportData.name,
            report_date: reportData.reportDate,
            existing_product: reportData.existingProduct,
            replacement_product: reportData.replacementProduct,
            savings_per_fixture: reportData.savingsPerFixture,
            percent_reduction: reportData.percentReduction,
            annual_savings_1: reportData.annualSavings1Fixture,
            annual_savings_50: reportData.annualSavings50Fixtures,
            annual_savings_100: reportData.annualSavings100Fixtures,
            co2_reduction: reportData.co2Reduction100Fixtures,
            existing_power: reportData.existingPowerPerFixture,
            replacement_power: reportData.replacementPowerPerFixture
          }
        })
      });

      if (emailResponse.ok) {
        console.log('✅ Email sent successfully');
      } else {
        const errorText = await emailResponse.text();
        console.error('❌ Email failed:', errorText);
      }
    }

    // Show the report (regardless of email success)
    setShowReport(true);
    
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('There was an error generating your report. Please try again.');
  }
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
      const ballast = spec.ballastPower  || 0;  
      return (spec.power * formData.tubesPerFixture) + ballast;
    }
    return 0;
  };

  const calculateSavings = (fixtureCount = 1, hoursPerDay = 12, daysPerYear = 260, costPerKwh = 0.208) => {
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
      <div className="min-h-screen bg-gradient-to-br from-[#2F7FBE]/10 to-white p-4">
        <div className="max-w-6xl mx-auto">
          {/* Action Buttons */}
          <div className="mb-6 flex gap-4 justify-end print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#1B72B9] text-white px-6 py-3 rounded-lg hover:bg-[#2F7FBE] transition font-semibold shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>

            <button
              onClick={() => {
                alert('Email will be sent to: ' + formData.email);
              }}
              className="flex items-center gap-2 bg-[#1F5F3B] text-white px-6 py-3 rounded-lg hover:bg-[#1F5F3B]/90 transition font-semibold shadow-lg"
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
              className="flex items-center gap-2 bg-[#222222] text-white px-6 py-3 rounded-lg hover:bg-black transition font-semibold shadow-lg"
            >
              New Calculation
            </button>
          </div>
              <img
                src="/logo2.png"
                alt="Company Logo"
                className="mx-auto mb-1 w-75 h-auto print:w-64 print:max-w-[240px]"
            /> 
          {/* Report Content */}
          <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(27,114,185,0.15)] p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-12 border-b-4 border-[#1B72B9] pb-8">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-20 h-20 text-[#1B72B9]" />
              </div>

              <h1 className="text-5xl font-bold text-[#222222] mb-4">
                Energy Savings Report
              </h1>

              <p className="text-xl text-[#222222]/70 mb-6">
                Fixture-by-Fixture Comparison & ROI Projection
              </p>

              <div className="bg-gradient-to-r from-[#2F7FBE]/10 to-white rounded-lg p-6 inline-block border-2 border-[#2F7FBE]/30">
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <p className="text-sm text-[#222222]/70 font-medium">Prepared For:</p>
                    <p className="text-lg font-bold text-[#222222]">{formData.name}</p>
                    <p className="text-sm text-[#222222]/80">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#222222]/70 font-medium">Report Date:</p>
                    <p className="text-lg font-bold text-[#222222]">{currentDate}</p>
                    <p className="text-sm text-[#222222]/80">
                      Case ID: #{Date.now().toString().slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-[#222222] mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1B72B9] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📊</span>
                </div>
                Executive Summary
              </h2>

              <div className="grid md:grid-cols-3 gap-6">

                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200">
                  <p className="text-sm font-semibold text-red-800 mb-2">CURRENT CONSUMPTION</p>
                  <p className="text-4xl font-bold text-red-600">{savings1.existingPower}W</p>
                  <p className="text-sm text-[#222222]/80 mt-2">Per fixture</p>
                </div>

                <div className="bg-[#1F5F3B]/10 rounded-xl p-6 border-2 border-[#1F5F3B]/30">
                  <p className="text-sm font-semibold text-[#1F5F3B] mb-2">PROPOSED LED</p>
                  <p className="text-4xl font-bold text-[#1F5F3B]">{savings1.replacementPower}W</p>
                  <p className="text-sm text-[#222222]/80 mt-2">Per fixture</p>
                </div>

                <div className="bg-[#2F7FBE]/10 rounded-xl p-6 border-2 border-[#2F7FBE]/30">
                  <p className="text-sm font-semibold text-[#1B72B9] mb-2">ENERGY SAVINGS</p>
                  <p className="text-4xl font-bold text-[#1B72B9]">{savings1.savingsPerFixture}W</p>
                  <p className="text-sm text-[#222222]/80 mt-2">
                    {savings1.percentReduction.toFixed(1)}% reduction
                  </p>
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
              {    /*<div className="flex items-center justify-between border-b pb-3">
                    <span className="font-semibold">Ballast consumption:</span>
                    <span className="text-2xl font-bold text-red-600">+{EXISTING_PRODUCT_SPECS[formData.existingProduct]?.ballastPower || 0}W</span>
                  </div>*/}
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
                  <span className="font-semibold">Calculation Assumptions:</span> 12 hours/day operation, 260 days/year, $0.208 per kWh electricity rate, 0.39 kg CO₂ per kWh
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
            <div className="mb-12 bg-gradient-to-r from-[#1B72B9] to-[#2F7FBE] rounded-xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-6">📋 Recommended Next Steps</h2>

              {[1,2,3,4].map((n) => (
                <div key={n} className="flex items-start gap-4 mb-4">
                  <div className="bg-white text-[#1B72B9] rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {n}
                  </div>
                  <p className="text-lg">
                    {[
                      "Schedule a site assessment to verify fixture counts and current conditions",
                      "Receive detailed product specifications and installation timeline",
                      "Review financing options and available rebates or incentives",
                      "Begin implementation with minimal disruption to your operations"
                    ][n-1]}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-300 pt-8">
              <div className="text-center text-[#222222]/70">
                <p className="text-lg font-semibold mb-2">Questions about this report?</p>
                <p className="mb-4">Contact us to discuss your energy savings opportunity</p>
                <p className="text-sm text-[#222222]/60 italic">
                  This report is provided for informational purposes. Actual savings may vary based on usage patterns,
                  electricity rates, and installation conditions.
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
  <div className="min-h-screen bg-gradient-to-br from-[#2F7FBE]/10 to-[#FFFFFF] flex items-center justify-center p-3 sm:p-4 md:p-6">
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_10px_30px_rgba(27,114,185,0.15)] p-4 sm:p-6 md:p-8 max-w-4xl w-full">
      
      {/* Header */}
      <div className="flex items-center justify-center mb-6 sm:mb-8">
        <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-[#1B72B9] mr-2 sm:mr-3" />
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">
          Energy Calculator
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                  step >= num
                    ? "bg-[#1B72B9] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {num}
              </div>

              {num < 3 && (
                <div
                  className={`flex-1 h-1 mx-1 sm:mx-2 ${
                    step > num ? "bg-[#1B72B9]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-4 sm:space-y-6">

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#222222]">
              What is your existing lighting product?
            </h2>

            <p className="text-sm sm:text-base text-[#222222]/70">
              Select the lighting product currently used in your company.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {existingProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() =>
                    handleProductSelect("existingProduct", product.name)
                  }
                  className={`p-3 sm:p-4 rounded-lg border-2 transition hover:shadow-lg ${
                    formData.existingProduct === product.name
                      ? "border-[#1B72B9] bg-[#2F7FBE]/10"
                      : "border-gray-300 hover:border-[#2F7FBE]"
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2 sm:mb-3"
                  />
                  <p className="font-semibold text-[#222222] text-xs sm:text-base">
                    {product.name}
                  </p>
                </button>
              ))}

              <button
                onClick={() =>
                  handleProductSelect("existingProduct", "Other")
                }
                className={`p-3 sm:p-4 rounded-lg border-2 transition hover:shadow-lg flex items-center justify-center ${
                  formData.existingProduct === "Other"
                    ? "border-[#1B72B9] bg-[#2F7FBE]/10"
                    : "border-gray-300 hover:border-[#2F7FBE]"
                }`}
              >
                <div className="text-center">
                  <div className="w-full h-24 sm:h-32 flex items-center justify-center bg-[#2F7FBE]/10 rounded-lg mb-2 sm:mb-3">
                    <span className="text-3xl sm:text-4xl text-gray-400">
                      +
                    </span>
                  </div>
                  <p className="font-semibold text-[#222222] text-xs sm:text-base">
                    Other
                  </p>
                </div>
              </button>
            </div>

            {/* Fixtures */}
            <div className="mt-4 sm:mt-6">
              <label className="block text-[#222222] font-medium mb-2 text-sm sm:text-base">
                Approx. Number of Fixtures
              </label>

              <input
                type="number"
                min="0"
                value={formData.approxFixtures || ""}
                onChange={(e) =>
                  handleInputChange("approxFixtures", e.target.value)
                }
                placeholder="e.g. 150"
                className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-lg focus:border-[#1B72B9] focus:outline-none text-sm sm:text-base"
              />
            </div>

            {formData.existingProduct === "Other" && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={formData.existingProductOther}
                  onChange={(e) =>
                    handleInputChange(
                      "existingProductOther",
                      e.target.value
                    )
                  }
                  placeholder="Please specify your existing product"
                  className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-lg focus:border-[#1B72B9] focus:outline-none text-sm sm:text-base"
                />

                <input
                  type="number"
                  value={formData.existingProductOtherWattage}
                  onChange={(e) =>
                    handleInputChange(
                      "existingProductOtherWattage",
                      e.target.value
                    )
                  }
                  placeholder="Total wattage per fixture (W)"
                  className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-lg focus:border-[#1B72B9] focus:outline-none text-sm sm:text-base"
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#222222]">
              Which LED product would you like to replace with?
            </h2>

            <p className="text-sm sm:text-base text-[#222222]/70">
              Select the energy-efficient LED alternative you're considering.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {replacementProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() =>
                    handleProductSelect(
                      "replacementProduct",
                      product.id
                    )
                  }
                  className={`p-3 sm:p-4 rounded-lg border-2 transition hover:shadow-lg ${
                    formData.replacementProduct === product.id
                      ? "border-[#1B72B9] bg-[#2F7FBE]/10"
                      : "border-gray-300 hover:border-[#2F7FBE]"
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 sm:h-40 object-cover rounded-lg mb-2 sm:mb-3"
                  />
                  <p className="font-semibold text-[#222222] text-base sm:text-lg">
                    {product.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#222222]">
              Your Contact Information
            </h2>

            <p className="text-sm sm:text-base text-[#222222]/70">
              We'll send you a detailed energy calculation report shortly.
            </p>

            <div>
              <label className="block text-sm font-medium text-[#222222] mb-2">
                Name
              </label>

              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  handleInputChange("name", e.target.value)
                }
                placeholder="John Doe"
                className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-lg focus:border-[#1B72B9] focus:outline-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#222222] mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  handleInputChange("email", e.target.value)
                }
                placeholder="john@company.com"
                className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-lg focus:border-[#1B72B9] focus:outline-none text-sm sm:text-base"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 sm:pt-6 gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-[#1F5F3B] text-[#1F5F3B] rounded-lg hover:bg-[#1F5F3B]/10 transition font-medium text-sm sm:text-base"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`ml-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium flex items-center transition text-sm sm:text-base ${
                canProceed()
                  ? "bg-[#1B72B9] text-white hover:bg-[#2F7FBE]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className={`ml-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium flex items-center transition text-sm sm:text-base ${
                canProceed()
                  ? "bg-[#1B72B9] text-white hover:bg-[#2F7FBE]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Mail className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              Generate Report
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

}