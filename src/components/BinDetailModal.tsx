import React, { useState, useEffect } from 'react';
import { X, Package, Trash2, ArrowRightLeft, Plus, Minus, ChevronDown } from 'lucide-react';
import { useWMS } from '../context/WMSContext';
import { BinLocation, LAYER_LABELS } from '../data/wmsData';

interface Props {
  bin: BinLocation | null;
  products: any[]; // Add this to receive the DB products
  onClose: () => void;
  onMoveTrigger?: (fromId: string) => void;
}



export function BinDetailModal({ bin, products, onClose, onMoveTrigger }: Props) {
  const { assignProduct, clearBin, adjustQuantity, bins, moveBin } = useWMS();
  const [tab, setTab] = useState<'info' | 'assign' | 'move'>('info');
  const [selectedSku, setSelectedSku] = useState('');
  const [assignQty, setAssignQty] = useState(1);
  const [moveToId, setMoveToId] = useState('');
  const [moveMsg, setMoveMsg] = useState('');
  const [delta, setDelta] = useState(0);


  if (!bin) return null;

  const isEmpty = bin.status === 'empty';
  const layerLabel = LAYER_LABELS[bin.layer];
  const fillPct = bin.maxCapacity > 0 ? Math.round((bin.quantity / bin.maxCapacity) * 100) : 0;

  const handleAssign = async () => {
    if (!selectedSku || assignQty <= 0) return;

    try {
      const response = await fetch('/api/bins/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binId: bin.id,
          sku: selectedSku,
          quantity: assignQty,
        }),
      });

      if (response.ok) {
        // Option A: If you use a state manager, trigger a re-fetch here
        // Option B: For now, call the local context to keep UI in sync
        assignProduct(bin.id, selectedSku, assignQty); 
        onClose();
      }
    } catch (error) {
      console.error("Failed to save to database", error);
      alert("Error saving to database.");
    }
  };

  const handleClear = async () => {
  try {
    const response = await fetch('/api/bins/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        binId: bin.id,
        sku: null,       // Database will clear the SKU
        quantity: 0,     // Database will clear the Qty
      }),
    });

    if (response.ok) {
      onClose(); // Triggers the refresh in the main grid
    }
  } catch (error) {
    console.error("Clear failed", error);
  }
};

  const handleAdjust = async (d: number) => {
  const newQty = Math.max(0, bin.quantity + d);
  const max = bin.maxCapacity || 2000
  const finalQty = Math.min(newQty, max);

  try {
    const response = await fetch('/api/bins/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        binId: bin.id,
        sku: bin.sku,    // Keep the same product
        quantity: finalQty,
      }),
    });

    if (response.ok) {
      // We call adjustQuantity to update the local UI immediately
      adjustQuantity(bin.id, d); 
    }
  } catch (error) {
    console.error("Adjustment failed", error);
  }
};

  const handleMove = async () => {
  if (!moveToId) return;
  
  try {
    const response = await fetch('/api/bins/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromBinId: bin.id,
        toBinId: moveToId,
      }),
    });

    if (response.ok) {
      onClose(); // This refreshes the whole grid to show the move
    } else {
      const err = await response.json();
      setMoveMsg(err.error || "Move failed");
    }
  } catch (error) {
    setMoveMsg("Network error during move");
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value;
  
  // 1. Allow empty string so the user can backspace and type a new number
  if (val === "") {
    setAssignQty(0);
    return;
  }

  const num = parseInt(val, 10);
  
  // 2. Validate it's a number and respect the max capacity
  if (!isNaN(num)) {
    // If bin.maxCapacity is 0 or missing, we'll default to a high number like 999
    const limit = bin.maxCapacity > 0 ? bin.maxCapacity : 2000
    setAssignQty(Math.min(num, limit));
  }
};







  const emptyBins = bins.filter(b => b.id !== bin.id && b.status === 'empty');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg" style={{ fontWeight: 700 }}>{bin.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                bin.status === 'full' ? 'bg-red-500' :
                bin.status === 'partial' ? 'bg-blue-500' :
                'bg-slate-600'
              }`}>
                {bin.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Row {bin.row} · {layerLabel} · Position {String(bin.position).padStart(2, '0')}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['info', 'assign', 'move'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm transition-colors ${
                tab === t
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{ fontWeight: tab === t ? 600 : 400 }}
            >
              {t === 'info' ? 'Info' : t === 'assign' ? 'Assign / Edit' : 'Move'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-6 py-5">
          {/* INFO TAB */}
          {tab === 'info' && (
            <div className="space-y-4">
              {isEmpty ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">This bin is empty</p>
                  <button
                    onClick={() => setTab('assign')}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Assign a product
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <Row label="SKU" value={<span className="font-mono text-sm" style={{ fontWeight: 600 }}>{bin.sku}</span>} />
                    <Row label="Product" value={bin.productName || '—'} />
                    <Row label="Quantity" value={<span style={{ fontWeight: 600 }}>{bin.quantity} {bin.unit}</span>} />
                    <Row label="Max Capacity" value={`${bin.maxCapacity} ${bin.unit}`} />
                    <Row label="Last Updated" value={new Date(bin.lastUpdated).toLocaleString()} />
                  </div>

                  {/* Fill bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Fill Level</span>
                      <span style={{ fontWeight: 600 }}>{fillPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          fillPct >= 100 ? 'bg-red-500' : fillPct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Adjust */}
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Quick Adjust Quantity</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdjust(-10)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
                      >-10</button>
                      <button
                        onClick={() => handleAdjust(-1)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
                      >-1</button>
                      <span className="flex-1 text-center text-lg" style={{ fontWeight: 700 }}>{bin.quantity}</span>
                      <button
                        onClick={() => handleAdjust(1)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                      >+1</button>
                      <button
                        onClick={() => handleAdjust(10)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                      >+10</button>
                    </div>
                  </div>

                  <button
                    onClick={handleClear}
                    className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Bin
                  </button>
                </>
              )}
            </div>
          )}

          {/* ASSIGN TAB */}
          {tab === 'assign' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Select Product (SKU)</label>
                <div className="relative">
                  <select
                    value={selectedSku}
                    onChange={e => setSelectedSku(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select a product —</option>
                    {products.map(p => (
                      <option key={p.sku} value={p.sku}>{p.sku} · {p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Quantity <span className="text-gray-400">(max {bin.maxCapacity ||2000})</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    // Show empty string if qty is 0 so the user can actually type
                    value={assignQty === 0 ? "" : assignQty} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setAssignQty(0);
                        return;
                      }
                      
                      const num = parseInt(val, 10);
                      const max = bin.maxCapacity > 0 ? bin.maxCapacity : 2000

                      // Only update if it's a valid number
                      if (!isNaN(num)) {
                        // We allow the number to be typed, but cap it at the max
                        setAssignQty(Math.min(num, max));
                      }
                    }}
                    // Optional: clean up the value on blur (when user clicks away)
                    onBlur={() => {
                      if (assignQty < 1) setAssignQty(1);
                    }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const max = bin.maxCapacity > 0 ? bin.maxCapacity : 100;
                      setAssignQty(q => Math.min(max, q + 1));
                    }}
                    className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAssign}
                disabled={!selectedSku}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Package className="w-4 h-4" />
                {bin.status === 'empty' ? 'Assign Product' : 'Update Product'}
              </button>
            </div>
          )}

          {/* MOVE TAB */}
          {tab === 'move' && (
            <div className="space-y-4">
              {isEmpty ? (
                <p className="text-sm text-gray-400 text-center py-4">Bin is empty — nothing to move.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    Move all contents of <strong className="font-mono">{bin.id}</strong> to an empty destination bin.
                  </p>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Destination Bin</label>
                    <div className="relative">
                      <select
                        value={moveToId}
                        onChange={e => { setMoveToId(e.target.value); setMoveMsg(''); }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Select destination —</option>
                        {emptyBins.map(b => (
                          <option key={b.id} value={b.id}>{b.id} (cap: {b.maxCapacity})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {moveMsg && <p className="text-sm text-red-500">{moveMsg}</p>}
                  <button
                    onClick={handleMove}
                    disabled={!moveToId}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Move Contents
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}