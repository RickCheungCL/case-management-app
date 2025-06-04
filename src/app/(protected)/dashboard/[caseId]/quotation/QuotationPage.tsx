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
          discounts: []
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
    const subtotal =labourDetail.amount+ products.reduce((sum, prod) => {
      const base = prod.quantity * prod.unitPrice;
      const totalDiscount = prod.discounts.reduce((dSum, d) => {
        if (d.type === "percentage") return dSum + base * (d.value / 100);
        return dSum + d.value;
      }, 0);
      return sum + (base - totalDiscount) ;
    }, 0);
    const tax = (subtotal )* 0.13;
    return {
      subtotal,
      tax,
      total: subtotal + tax 
    };
  };

  const totals = calculateTotal();

  if (isLoading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow text-sm">
      <h1 className="text-2xl font-bold mb-6">Quotation Summary</h1>
  
      {/* Company & Customer Info Inputs */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <h2 className="font-semibold">Dot Lighting (Canada) Inc.</h2>
          <p>35 Riviera Dr, Unit 16</p>
          <p>Markham, ON L3R 8N4</p>
          <p>905-604-8832</p>
          <p>info@dotlighting.ca</p>
        </div>
        <div>
          <h2 className="font-semibold">Quotation To:</h2>
          <input className="border p-1 w-full mb-1" placeholder="Organization Name" value={customerInfo.customerName} onChange={(e) => setCustomerInfo({ ...customerInfo, customerName: e.target.value })} />
          <input className="border p-1 w-full mb-1" placeholder="Contact Person" value={customerInfo.contactPerson} onChange={(e) => setCustomerInfo({ ...customerInfo, contactPerson: e.target.value })} />
          <input className="border p-1 w-full mb-1" placeholder="Customer Email" value={customerInfo.email} onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })} />
          <input className="border p-1 w-full mb-1" placeholder="Customer Phone" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} />
          <textarea className="border p-1 w-full" placeholder="Customer Address" value={customerInfo.address} onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })} />
        </div>
      </div>
  
      {/* Editable Table */}
      <table className="w-full border mb-4">
        <thead className="bg-gray-100">
          <tr>
          <th className="border px-2 py-1">SKU</th>
            <th className="border px-2 py-1">Item</th>
            <th className="border px-2 py-1">Qty</th>
            <th className="border px-2 py-1">Unit Price</th>
            <th className="border px-2 py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod, i) => {
            const base = prod.quantity * prod.unitPrice;
            const discountAmt = prod.discounts.reduce((sum, d) => sum + (d.type === "percentage" ? base * (d.value / 100) : d.value), 0);
            return (
              <>
                <tr key={prod.id || i}>
                <td className="border px-2 py-1">
                    <input className="w-full border p-1" value={prod.sku} onChange={(e) => setProducts((p) => p.map((row, idx) => idx === i ? { ...row, sku: e.target.value } : row))} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border p-1" value={prod.name} onChange={(e) => setProducts((p) => p.map((row, idx) => idx === i ? { ...row, name: e.target.value } : row))} />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input type="number" inputMode="decimal" className="w-16 border p-1 text-center" value={prod.quantity.toString()} onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                        setProducts((prev) => prev.map((row, idx) => idx === i ? { ...row, quantity: parseFloat(value) || 0 } : row));
                      }
                    }} />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input type="number" inputMode="decimal" className="w-20 border p-1 text-center" value={prod.unitPrice.toString()} onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                        setProducts((prev) => prev.map((row, idx) => idx === i ? { ...row, unitPrice: parseFloat(value) || 0 } : row));
                      }
                    }} />
                  </td>
                  <td className="border px-2 py-1 text-right">${(base - discountAmt).toFixed(2)}</td>
                </tr>
                {prod.discounts.map((d, j) => (
                  <tr key={`d-${prod.id || i}-${j}`} className="bg-gray-50">
                    <td colSpan={2} className="border px-2 py-1">
                      <input value={d.name} className="border p-1 w-full" placeholder="Discount name" onChange={(e) => updateDiscount(i, j, "name", e.target.value)} />
                    </td>
                    <td className="border px-2 py-1">
                      <select value={d.type} onChange={(e) => updateDiscount(i, j, "type", e.target.value)} className="border p-1 mr-2">
                        <option value="percentage">%</option>
                        <option value="fixed">$</option>
                      </select>
                      <input type="number" min={0} step="0.01" value={d.value} className="border p-1 w-20" onChange={(e) => updateDiscount(i, j, "value", e.target.value)} />
                    </td>
                    <td className="border px-2 py-1 text-right text-red-500">
                      -${d.type === "percentage" ? (base * d.value / 100).toFixed(2) : d.value.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {prod.discounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-sm pl-4 pb-2">
                      <button className="text-blue-500 hover:underline" onClick={() => addDiscountToProduct(i)}>+ Add Discount</button>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
  
      {/* Labour Input */}
      <div className="mb-4">
      <label className="block font-semibold mb-1">Labour Description:</label>
      <textarea
        id="labour-description"
        rows={4}
        className="border p-1 w-full mb-2 resize-y"
        value={labourDetail.description}
        onChange={(e) =>
          setLabourDetail({ ...labourDetail, description: e.target.value })
        }
      />
      <label className="block font-semibold mb-1">Labour Cost:</label>
      <input
        type="number"
        inputMode="decimal"
        className="border p-1 w-32"
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
    </div >
  
      {/* PDF-style Preview */}
      <div className="flex gap-x-4 mb-4 print:hidden" >
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4 print:hidden"
        onClick={async () => {
          try {
            const res = await fetch(`/api/quote-counter/${caseId}`, { method: 'POST' });
            const data = await res.json();

            if (res.ok && data.count) {
              const updatedSuffix = String(data.count).padStart(3, '0');
              setQuoteSuffix(updatedSuffix);

              // Wait for the UI to reflect new quote number
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
        🖨️ Print Quotation
      </button>
      <Link href={`/dashboard/${caseId}/energy-summary`}>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          ⚡ View Energy Summary
        </button>
      </Link>
      </div>
      
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
                    <tr><td className="p-2">{customerInfo.address || 'N/A'}</td></tr>
                    <tr><td className="p-2">Attn: {customerInfo.contactPerson || 'N/A'}</td></tr>
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
                        <td className="border text-center p-2">{customerInfo.email || 'N/A'}</td>
                        <td className="border text-center p-2">{customerInfo.phone || 'N/A'}</td>
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
                          <td className="p-1 border-r  text-center">${final.toFixed(2)}</td>
                        </tr>
                        {discount && (
                          <tr className="bg-gray-50 no-break">
                            <td></td>
                            <td colSpan={3} className="border p-1 italic text-gray-600">Discount: {discount.name}</td>
                            <td className="border p-1 text-right text-red-500">
                              -${discountAmt.toFixed(2)} / {discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {pageIndex === paginated.length - 1 && (
                  <tr className="no-break">
                    <td colSpan={4} className="border p-1 font-semibold text-left whitespace-pre-wrap">
                      Labour: {labourDetail.description || 'N/A'}
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
