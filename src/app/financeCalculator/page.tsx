'use client';

import { useState } from 'react';

export default function FinanceCalculator() {
  const [unitPrice, setUnitPrice] = useState(1.99); // per month per unit
  const [quantity, setQuantity] = useState(30);
  const [term, setTerm] = useState(36);
  const [downPayment, setDownPayment] = useState(0);

  // Derived finance amount
  const totalUnits = quantity * term;
  const [financeAmount, setFinanceAmount] = useState(unitPrice * totalUnits);

  // Keep unitPrice and financeAmount in sync
  const updateUnitPrice = (value: number) => {
    setUnitPrice(value);
    setFinanceAmount(value * quantity * term);
  };

  const updateFinanceAmount = (value: number) => {
    setFinanceAmount(value);
    if (quantity * term > 0) {
      setUnitPrice(value / (quantity * term));
    }
  };

  // Plan options with non-cumulative discount
  const planOptions = [
    { label: 'One Off Payment', discount: 0.16, months: 0 },
    { label: '12 Months Installment', discount: 0.10, months: 12 },
    { label: '24 Months Installment', discount: 0.05, months: 24 },
    { label: '36 Months Installment', discount: 0.0, months: 36 },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6 text-emerald-700">Finance Calculator</h1>

      <div className="bg-white p-6 rounded-xl shadow border space-y-4">
        <div>
          <label className="block text-sm font-medium">Unit Price (Per Month Per Unit)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => updateUnitPrice(parseFloat(e.target.value))}
            className="mt-1 w-full border px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Total Finance Amount ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={financeAmount}
            onChange={(e) => updateFinanceAmount(parseFloat(e.target.value))}
            className="mt-1 w-full border px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Quantity (Units)</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => {
              const newQty = parseInt(e.target.value);
              setQuantity(newQty);
              setFinanceAmount(unitPrice * newQty * term);
            }}
            className="mt-1 w-full border px-4 py-2 rounded-md"
          />
        </div>



        <div>
          <label className="block text-sm font-medium">Down Payment ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={downPayment}
            onChange={(e) => setDownPayment(parseFloat(e.target.value))}
            className="mt-1 w-full border px-4 py-2 rounded-md"
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Options</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planOptions.map((plan) => {
            const discountedTotal = +(financeAmount * (1 - plan.discount)).toFixed(2);
            const amountDue = Math.max(discountedTotal - downPayment, 0);
            const perUnitPrice = +(amountDue / quantity).toFixed(2);

            return (
              <div key={plan.label} className="border p-4 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-700">{plan.label}</h3>
                <p className="text-sm text-gray-500">Discount: {(plan.discount * 100).toFixed(0)}%</p>
                <p className="text-gray-900 text-xl font-bold">${amountDue.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Unit Price: ${perUnitPrice.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
