"use client";
import React, { useState } from "react";
import { Mail, Zap, ArrowRight, CheckCircle, Lightbulb, TrendingDown, Download, Send } from "lucide-react";

// Product specifications for existing products
const EXISTING_PRODUCT_SPECS = {
  'Fluorescent Tubes': { power: 18, unit: 'W' },
  'Metal Halide Highbay': { power: 150, unit: 'W' },
  'Halogen Downlights': { power: 50, unit: 'W' },
  'HPS Street Lights': { power: 250, unit: 'W' },
  'Incandescent Bulbs': { power: 60, unit: 'W' }
};

// Product specifications for replacement products
const REPLACEMENT_PRODUCT_SPECS = {
  'LED Panel': { power: 30, unit: 'W' },
  'LED Strip': { power: 30, unit: 'W' },
  'Linear Highbay': { power: 80, unit: 'W' },
  'UFO': { power: 100, unit: 'W' }
};

const existingProducts = [
  { 
    id: 1, 
    name: 'Fluorescent Tubes',
    power: 18,
    tubesPerFixture: 2,
    image: 'https://media.istockphoto.com/id/1140615978/photo/white-fluorescent-lamp-isolated-on-white-background-fluorescent-tube.jpg?s=612x612&w=0&k=20&c=1ZQ8YoPX3pg2eDfL58WcQnE61-YWBKv-Req1l0MCPqE='
  },
  { 
    id: 2, 
    name: 'Metal Halide Highbay',
    power: 200,
    tubesPerFixture:1,
    image: 'data:image/jpeg;base64,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'
  },
  { 
    id: 3, 
    name: 'Halogen Downlights',
    power: 50,
    tubesPerFixture:1,
    image: 'data:image/jpeg;base64,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'
  },
  { 
    id: 4, 
    name: 'Incandescent Bulbs',
    power: 60,
    tubesPerFixture:1,
    image: 'data:image/jpeg;base64,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'
  }
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
  const [step, setStep] = useState(1);
  const [showReport, setShowReport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Use existingProducts array as source-of-truth where possible
  const selectedReplacement = replacementProducts.find(p => p.id === formData.replacementProduct);
  const selectedExisting = existingProducts.find(p => p.name === formData.existingProduct);

  const getFixturePower = () => {
    if (formData.existingProduct === 'Other') {
      // assume the user provided total wattage per fixture for Other
      return parseFloat(formData.existingProductOtherWattage) || 0;
    } else if (selectedExisting) {
      const perLamp = Number(selectedExisting.power) || 0;
      const tubes = Number(formData.tubesPerFixture) || Number(selectedExisting.tubesPerFixture) || 1;
      const ballast = Number(selectedExisting.ballastPower || 0);
      return (perLamp * tubes) + ballast;
    }
    // fallback to spec object if needed
    const spec = EXISTING_PRODUCT_SPECS[formData.existingProduct];
    if (spec) return (spec.power || 0) * (formData.tubesPerFixture || 1);
    return 0;
  };

  const calculateSavings = (fixtureCount = 1, hoursPerDay = 12, daysPerYear = 260, costPerKwh = 0.208) => {
    const existingPower = getFixturePower();
    const replacementPower = (() => {
      const rp = replacementProducts.find(p => p.id === formData.replacementProduct);
      if (rp) return Number(rp.power) || 0;
      const spec = REPLACEMENT_PRODUCT_SPECS[formData.replacementProduct];
      return spec ? Number(spec.power) || 0 : 0;
    })();
    
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

  // === NEW handleSubmit (your provided async logic integrated) ===
  const handleSubmit = async () => {
    try {
      // Basic email validation
      if (!isValidEmail(formData.email)) {
        alert('Please enter a valid email address.');
        return;
      }

      setSubmitting(true);

      // Prepare data for Google Sheets and Email
      const savings1 = calculateSavings(1);
      const savings50 = calculateSavings(50);
      const savings100 = calculateSavings(100);
      const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      const reportData = {
        timestamp: new Date().toISOString(),
        name: formData.name,
        email: formData.email,
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
        co2Reduction100Fixtures: savings100.co2ReductionTonnes.toFixed(2)
      };

      // ========================================
      // STEP 1: REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
      // ========================================
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/a/macros/dotlighting.ca/s/AKfycbwQ2O9oVohtX5ktiywA7HyHNmrm2rf8e_DOMHsEu54G8EtsDHyWArK4oDfS-Lv8OQ5qOw/exec';
      
      // Send to Google Sheets (note: no-cors mode will produce an opaque response)
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reportData)
        });
      } catch (err) {
        // silent fail for no-cors (keeps UX smooth); you can remove mode:'no-cors' if your endpoint allows CORS
        console.warn('Google Script post error (this may be expected in no-cors mode):', err);
      }

      // ========================================
      // STEP 2: REPLACE THESE WITH YOUR EMAILJS CREDENTIALS
      // Get these from https://dashboard.emailjs.com/
      // ========================================
      const EMAILJS_SERVICE_ID = 'service_ht0yvaj';
      const EMAILJS_TEMPLATE_ID = 'template_2jsr00i';
      const EMAILJS_PUBLIC_KEY = '70QIF0_1MbyDpt3H6';
      
      // Send Email using EmailJS
      try {
        const emailJSResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: {
              to_email: formData.email,
              to_name: formData.name,
              report_date: currentDate,
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

        // EmailJS returns 200 on success; check if ok
        if (emailJSResponse.ok) {
          console.log('Email sent successfully');
        } else {
          console.warn('EmailJS responded with non-ok status', emailJSResponse.status);
        }
      } catch (emailErr) {
        console.error('EmailJS error:', emailErr);
      }

      // Show the report
      setShowReport(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error generating your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  // === end handleSubmit ===

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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
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
              <img
                src="/logo2.png"
                alt="Company Logo"
                className="mx-auto mb-1 w-75 h-auto print:w-64 print:max-w-[240px]"
            /> 
          {/* Report Content */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-12 border-b-4 border-emerald-600 pb-8">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-20 h-20 text-emerald-600" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">Energy Savings Report</h1>
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
                  </button>
                ))}
              </div>

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
                disabled={!canProceed() || submitting}
                className={`ml-auto px-6 py-3 rounded-lg font-medium flex items-center transition ${
                  canProceed() && !submitting
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Mail className="mr-2 w-5 h-5" /> {submitting ? 'Generating...' : 'Generate Report'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
