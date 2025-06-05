"use client";

import { useEffect, useState, useRef } from "react";
import React from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import { format } from "date-fns";
interface Discount {
  name: string;
  type: "percentage" | "fixed";
  value: number;
}

interface ProductRow {
  id?: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  wattage?: string;
  discounts: Discount[];
  installations:Discount[];
}

interface CustomerInfo {
  customerName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export default function QuotationPage({ caseId }: { caseId: string }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [labour, setLabour] = useState<number>(0);
  const [quoteSuffix, setQuoteSuffix] = useState("001");
  const [labourDetail, setLabourDetail] = useState({ description: '', amount: 0 });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    customerName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrefillData = async () => {
      setIsLoading(true);

      try {
        const res = await axios.get(`/api/cases/${caseId}/quotation-data`);
        const { customerName, contactPerson, phoneNumber, emailAddress, schoolAddress, suggestedProducts } = res.data;

        setCustomerInfo({
          customerName: customerName || "",
          contactPerson: contactPerson || "",
          phone: phoneNumber || "",
          email: emailAddress || "",
          address: schoolAddress || ""
        });

        const summarizedProducts: ProductRow[] = suggestedProducts.map((prod: any) => ({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          quantity: prod.qty,
          unitPrice: 0,
          wattage: prod.wattage,
          discounts: [],
          installations: [] as Discount[]
        }));

        setProducts(summarizedProducts);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to prefill quotation data", error);
        setError("Failed to load quotation data. Please try again.");
        setIsLoading(false);
      }
    };

    fetchPrefillData();
  }, [caseId]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  const handlePrint = async () => {
    const res = await fetch(`/api/quote-counter/${caseId}`, { method: 'POST' });
    const data = await res.json();
  
    if (res.ok) {
      const newSuffix = String(data.count).padStart(3, '0');
      setQuoteSuffix(newSuffix);
      setTimeout(() => window.print(), 300); // Give time to update before printing
    } else {
      alert("Failed to update quote number");
    }
  };
  const addDiscountToProduct = (index: number) => {
    setProducts((prev) => {
      const updated = [...prev];
      const prod = updated[index];
      if (prod.discounts.length === 0) {
        prod.discounts = [
          { name: "", type: "percentage", value: 0 }
        ];
      }
      updated[index] = prod;
      return updated;
    });
  };
  const getPaginatedProducts = (products: ProductRow[], maxRows: number): ProductRow[][] => {
    const pages: ProductRow[][] = [];
    let currentPage: ProductRow[] = [];
    let rowCount = 0;
  
    for (const prod of products) {
      const rows = 1 + (prod.discounts?.length || 0);
  
      if (rowCount + rows > maxRows) {
        pages.push(currentPage);
        currentPage = [prod];
        rowCount = rows;
      } else {
        currentPage.push(prod);
        rowCount += rows;
      }
    }
  
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
  
    return pages;
  };
  const updateInstallation = (prodIndex: number, instIndex: number, key: keyof Discount, value: any) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[prodIndex].installations[instIndex][key] =
        key === "value" ? parseFloat(value) || 0 : value;
      return updated;
    });
  };
  
  
  
  const addInstallationToProduct = (prodIndex: number) => {
    setProducts((prev) => {
      const updated = [...prev];
      const current = updated[prodIndex].installations ?? [];
  
      // Prevent duplicate blank installation entry
      if (current.some((f) => f.name === '' && f.value === 0)) {
        return updated;
      }
  
      updated[prodIndex].installations = [
        ...current,
        { name: '', type: 'fixed', value: 0 }
      ];
      return updated;
    });
  };
  
  
  
  const paginated = getPaginatedProducts(products, 12);
  const updateDiscount = (prodIndex: number, discountIndex: number, key: keyof Discount, value: any) => {
    setProducts((prev) => {
      const updated = [...prev];
      const discount = updated[prodIndex].discounts[discountIndex];
      discount[key] = key === "value" ? parseFloat(value) || 0 : value;
      return updated;
    });
  };

  const calculateTotal = () => {
    const subtotal = labourDetail.amount + products.reduce((sum, prod) => {
      const base = prod.quantity * prod.unitPrice;
  
      const totalDiscount = prod.discounts.reduce((dSum, d) => {
        if (d.type === "percentage") return dSum + base * (d.value / 100);
        return dSum + d.value;
      }, 0);
  
      const totalInstallation = (prod.installations || []).reduce((iSum, inst) => {
        if (inst.type === "percentage") return iSum + base * (inst.value / 100);
        return iSum + inst.value;
      }, 0);
  
      return sum + (base - totalDiscount + totalInstallation);
    }, 0);
  
    const tax = subtotal * 0.13;
  
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  };
  

  const totals = calculateTotal();

  if (isLoading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Quotation Summary</h1>
              <p className="text-gray-600">Create and manage your project quotation</p>
            </div>
          </div>
        </div>

        {/* Company & Customer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Company & Customer Information
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">From: Dot Lighting (Canada) Inc.</h3>
              <div className="space-y-1 text-gray-600">
                <p>35 Riviera Dr, Unit 16</p>
                <p>Markham, ON L3R 8N4</p>
                <p>905-604-8832</p>
                <p>info@dotlighting.ca</p>
              </div>
            </div>

            {/* Customer Info Inputs */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Quotation To:</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300" 
                    placeholder="Enter organization name" 
                    value={customerInfo.customerName} 
                    onChange={(e) => setCustomerInfo({ ...customerInfo, customerName: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300" 
                    placeholder="Enter contact person name" 
                    value={customerInfo.contactPerson} 
                    onChange={(e) => setCustomerInfo({ ...customerInfo, contactPerson: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input 
                      type="email"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300 ${
                        customerInfo.email && !validateEmail(customerInfo.email) 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200'
                      }`}
                      placeholder="contact@example.com" 
                      value={customerInfo.email} 
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })} 
                    />
                    {customerInfo.email && !validateEmail(customerInfo.email) && (
                      <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input 
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300" 
                      placeholder="+1 (555) 123-4567" 
                      value={customerInfo.phone} 
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300 resize-none" 
                    placeholder="Enter complete address..." 
                    rows={3}
                    value={customerInfo.address} 
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Product Details
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700">Qty</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700">Unit Price</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod, i) => {
                  const base = prod.quantity * prod.unitPrice;
                  const discountAmt = prod.discounts.reduce((sum, d) => sum + (d.type === "percentage" ? base * (d.value / 100) : d.value), 0);
                  return (
                    <React.Fragment key={prod.id || i}>
                      <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="border-b border-gray-100 px-4 py-3">
                          <input 
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" 
                            placeholder="Enter SKU"
                            value={prod.sku || ''} 
                            onChange={(e) => setProducts((p) => p.map((row, idx) => idx === i ? { ...row, sku: e.target.value } : row))} 
                          />
                        </td>
                        <td className="border-b border-gray-100 px-4 py-3">
                          <input 
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" 
                            placeholder="Enter item name"
                            value={prod.name} 
                            onChange={(e) => setProducts((p) => p.map((row, idx) => idx === i ? { ...row, name: e.target.value } : row))} 
                          />
                        </td>
                        <td className="border-b border-gray-100 px-4 py-3">
                          <input 
                            type="number" 
                            inputMode="decimal" 
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-sm" 
                            placeholder="0"
                            value={prod.quantity.toString()} 
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d{0,2}$/.test(value)) {
                                setProducts((prev) => prev.map((row, idx) => idx === i ? { ...row, quantity: parseFloat(value) || 0 } : row));
                              }
                            }} 
                          />
                        </td>
                        <td className="border-b border-gray-100 px-4 py-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input 
                              type="number" 
                              inputMode="decimal" 
                              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-sm" 
                              placeholder="0.00"
                              value={prod.unitPrice.toString()} 
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                  setProducts((prev) => prev.map((row, idx) => idx === i ? { ...row, unitPrice: parseFloat(value) || 0 } : row));
                                }
                              }} 
                            />
                          </div>
                        </td>
                        <td className="border-b border-gray-100 px-4 py-3 text-right font-semibold text-gray-800">
                          ${(base - discountAmt).toFixed(2)}
                        </td>
                      </tr>
                      
                      {prod.discounts.map((d, j) => (
                        <tr key={`d-${prod.id || i}-${j}`} className="bg-red-50">
                          <td colSpan={2} className="border-b border-gray-100 px-4 py-3">
                            <input 
                              value={d.name} 
                              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white" 
                              placeholder="Discount description" 
                              onChange={(e) => updateDiscount(i, j, "name", e.target.value)} 
                            />
                          </td>
                          <td className="border-b border-gray-100 px-4 py-3">
                            <div className="flex gap-2">
                              <select 
                                value={d.type} 
                                onChange={(e) => updateDiscount(i, j, "type", e.target.value)} 
                                className="px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white"
                              >
                                <option value="percentage">%</option>
                                <option value="fixed">$</option>
                              </select>
                              <input 
                                type="number" 
                                min={0} 
                                step="0.01" 
                                value={d.value} 
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white" 
                                placeholder="0"
                                onChange={(e) => updateDiscount(i, j, "value", e.target.value)} 
                              />
                            </div>
                          </td>
                          <td></td>
                          <td className="border-b border-gray-100 px-4 py-3 text-right text-red-600 font-semibold">
                            -${d.type === "percentage" ? (base * d.value / 100).toFixed(2) : d.value.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      
                      {prod.discounts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="border-b border-gray-100 px-4 py-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline flex items-center gap-1" 
                              onClick={() => addDiscountToProduct(i)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Discount
                            </button>
                          </td>
                        </tr>
                      )}
                      {prod.installations?.map((f, j) => (
                        <tr key={`f-${prod.id || i}-${j}`} className="bg-blue-50">
                          <td colSpan={2} className="border-b border-gray-100 px-4 py-3">
                            <input
                              value={f.name}
                              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                              placeholder="Installation fee description"
                              onChange={(e) => updateInstallation(i, j, "name", e.target.value)}
                            />
                          </td>
                          <td className="border-b border-gray-100 px-4 py-3">
                            <div className="flex gap-2">
                              <select
                                value={f.type}
                                onChange={(e) => updateInstallation(i, j, "type", e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                              >
                                <option value="fixed">$</option>
                              </select>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={f.value}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                                placeholder="0"
                                onChange={(e) => updateInstallation(i, j, "value", e.target.value)}
                              />
                            </div>
                          </td>
                          <td></td>
                          <td className="border-b border-gray-100 px-4 py-3 text-right text-blue-600 font-semibold">
                            +${f.type === "percentage" ? (base * f.value / 100).toFixed(2) : f.value.toFixed(2)}
                          </td>
                        </tr>
                      ))}

                      {prod.installations?.length === 0 && (
                        <tr>
                          <td colSpan={5} className="border-b border-gray-100 px-4 py-2">
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline flex items-center gap-1"
                              onClick={() => addInstallationToProduct(i)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Installation Fee
                            </button>
                          </td>
                        </tr>
                      )}


                      
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Labour Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Additional
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mention any additional add-on for the quotation</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-gray-300 resize-y"
                placeholder="Describe the labour work to be performed..."
                value={labourDetail.description}
                onChange={(e) => setLabourDetail({ ...labourDetail, description: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Additional Cost</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-semibold transition-all duration-200 hover:border-gray-300"
                  placeholder="0.00"
                  value={labourDetail.amount.toFixed(2)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d{0,2}$/.test(val)) {
                      setLabourDetail(prev => ({
                        ...prev,
                        amount: parseFloat(val) || 0
                      }));
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
     <div className="flex flex-col sm:flex-row gap-4">
       <button
         className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-3"
         onClick={async () => {
           try {
             const res = await fetch(`/api/quote-counter/${caseId}`, { method: 'POST' });
             const data = await res.json();

             if (res.ok && data.count) {
               const updatedSuffix = String(data.count).padStart(3, '0');
               setQuoteSuffix(updatedSuffix);

               setTimeout(() => {
                 if (printRef.current) window.print();
               }, 300);
             } else {
               alert("Failed to generate quote number");
             }
           } catch (err) {
             console.error(err);
             alert("Print failed due to quote number error");
           }
         }}
       >
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
         </svg>
         Print Quotation
       </button>
       
       <Link href={`/dashboard/${caseId}/energy-summary`} className="flex-1">
         <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-3">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
           View Energy Summary
         </button>
       </Link>
     </div>
   </div>
  
      {/* PDF-style Preview */}
      
      <div ref={printRef} className="printable bg-white">
        {paginated.map((page, pageIndex) => (
          <div key={pageIndex} className="print-page mb-12 flex flex-col justify-between ">
            {/* HEADER - always shown */}
            <div className="print-header mb-4">
              <div className="flex items-center justify-between mb-6">
                <img src="/logo.png" alt="Dot Lighting Logo" className="h-12" />
                <h5 className="text-4xl font-semibold ml-auto">Quotation</h5>
              </div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-bold">Dot Lighting (Canada) Inc.</h2>
                  <p>35 Riviera Dr, Unit 16</p>
                  <p>Markham, ON L3R 8N4</p>
                  <p>905-604-8832 info@dotlighting.ca</p>
                </div>
                <div className="text-right">
                  <p><strong>Quote No:</strong> {caseId}-{quoteSuffix}</p>
                  <p><strong>Date:</strong> {format(new Date(), "yyyy-MM-dd")}</p>
                  <p><strong>GST/HST No.:</strong> 770796126</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <table className="w-full border border-black">
                  <thead>
                    <tr>
                      <th className="text-left font-semibold p-2 border-b border-black bg-gray-100">[ Quotation To: ]</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2">{customerInfo.customerName || 'N/A'}</td></tr>
                    <tr><td className="p-2">{customerInfo.contactPerson || ''}</td></tr>
                    
                    <tr><td className="p-2 whitespace-pre-line">{customerInfo.address || 'N/A'}</td></tr>
                    
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <table className="w-full border border-black">
                    <thead className="bg-gray-100 border-b border-black">
                      <tr>
                        <th className="w-1/2 border text-center p-2">Customer Email</th>
                        <th className="w-1/2 border text-center p-2">Customer Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border text-center p-2">{customerInfo.email || ''}</td>
                        <td className="border text-center p-2">{customerInfo.phone || ''}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* BODY TABLE - current page’s chunk */}
            <div className="flex-grow">
              <table className="w-full border mb-4 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-1 border text-center">SKU</th>
                    <th className="p-1 border text-center">Item</th>
                    <th className="p-1 border text-center">Qty</th>
                    <th className="p-1 border text-center">Price</th>
                    <th className="p-1 border text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {page.map((prod, i) => {
                    const base = prod.quantity * prod.unitPrice;
                    const discount = prod.discounts?.[0];
                    const discountAmt = discount?.type === "percentage" ? base * (discount.value / 100) : discount?.value || 0;
                    const final = base - discountAmt;

                    return (
                      <React.Fragment key={`prod-${pageIndex}-${i}`}>
                        <tr className="no-break">
                          <td className="p-1 border-r  text-center">{prod.sku}</td>
                          <td className="p-1 border-r  text-left">{prod.name}</td>
                          <td className="p-1 border-r  text-center">{prod.quantity}</td>
                          <td className="p-1 border-r  text-center">${prod.unitPrice.toFixed(2)}</td>
                          <td className="p-1 border-r  text-right">${final.toFixed(2)}</td>
                        </tr>
                        {discount && (
                          <tr className="bg-gray-50 no-break">
                            <td></td>
                            <td colSpan={3} className="border p-1 italic text-gray-600">Discount: {discount.name}</td>
                            <td className="border p-1 text-right text-grey-500">
                              -${discountAmt.toFixed(2)} / {discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`}
                            </td>
                          </tr>
                        )}
                        {prod.installations?.map((install, j) => {
                          const installAmt =
                            install.type === "percentage" ? base * (install.value / 100) : install.value;
                          return (
                            <tr key={`install-${pageIndex}-${i}-${j}`} className="bg-grey-50 no-break">
                              <td></td>
                              <td colSpan={3} className="border p-1 italic text-gray-600">
                                Installation: {install.name}
                              </td>
                              <td className="border p-1 text-right text-gray-600">
                                +${installAmt.toFixed(2)} / {install.type === "percentage" ? `${install.value}%` : `$${install.value}`}
                              </td>
                            </tr>
                          );
                        })}

                      </React.Fragment>
                    );
                  })}
                  {pageIndex === paginated.length - 1 && (
                  <tr className="no-break">
                    <td colSpan={4} className="border p-1 font-semibold text-left whitespace-pre-wrap">
                       {labourDetail.description || ''}
                    </td>
                    <td className="border p-1 text-right">
                      ${labourDetail.amount.toFixed(2)}
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>

            {/* FOOTER - always shown on each page */}
            <div className="print-footer text-sm mt-4">
              

              <div className="grid grid-cols-2 gap-0 mb-4 border border-black text-sm">
                <div className="col-span-1 border-r border-black p-3 text-xs leading-relaxed">
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>Quotation valid for 15 days.</li>
                    <li>5 Years Product Warranty; 1 Year Installation Warranty</li>
                    <li>30% downpayment with signed quotation</li>
                    <li>Customer agrees to pass min. 60% of incentives</li>
                    <li>Prices include rebate for commercial projects</li>
                  </ol>
                </div>
                <div className="col-span-1 p-4">
                  <table className="w-full text-sm font-semibold border border-black">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 text-right">Subtotal</td>
                        <td className="p-2 text-right">${totals.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-2 text-right">HST (13%)</td>
                        <td className="p-2 text-right">${totals.tax.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black p-2 text-right font-bold">Total</td>
                        <td className="p-2 text-right font-bold">${totals.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between mb-2">
                <p>Signature: ____________________________</p>
                <p>Date: ____________________________</p>
              </div>

              <p className="text-xs text-gray-600 italic">
                <li>By signing, customer agrees to listed products, prices, and approved drawings.</li>
                <li>Review all shop drawings and confirm voltage before signing.</li>
                <br />
                E-Transfer: philip@dotlighting.ca
              </p>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
  
  
}
