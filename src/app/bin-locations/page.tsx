"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Info,
  Grid3x3,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
} from "lucide-react";

import { useWMS } from "@/context/WMSContext";
import { BinDetailModal } from "@/components/BinDetailModal";
import {
  BinLocation,
  ROWS,
  ROW_LAYERS,
  type RowName,
} from "@/data/wmsData";

/* =======================
   Styling Maps
======================= */
const STATUS_BG: Record<string, string> = {
  empty: "bg-gray-50 border-gray-100 text-transparent",
  partial: "bg-blue-50 border-blue-200 text-blue-600",
  full: "bg-red-50 border-red-200 text-red-600",
};

const ROW_THEME: Record<RowName, string> = {
  A: "bg-indigo-600",
  C: "bg-emerald-600",
  D: "bg-amber-600",
  E: "bg-pink-600",
};

export default function BinLocationPage() {
  const { bins: contextBins } = useWMS(); 
  const [dbBins, setDbBins] = useState<BinLocation[]>([]); 
    const [dbProducts, setDbProducts] = useState<any[]>([]); // New state for products
    const [loading, setLoading] = useState(true);

  /* =======================
      FETCH LOGIC
  ======================= */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [binsRes, productsRes] = await Promise.all([
        fetch('/api/bins'),
        fetch('/api/bins/products')
      ]);

      if (!binsRes.ok || !productsRes.ok) {
         throw new Error(`Sync failed`);
      }

      const binsData = await binsRes.json();
      const productsData = await productsRes.json();

      setDbBins(binsData);
      setDbProducts(productsData);

      // --- THE FIX IS HERE ---
      // If a user has a modal open (selectedBin is not null),
      // find that specific bin in the NEW data and update the modal state.
      setSelectedBin((currentOpenBin) => {
        if (!currentOpenBin) return null;
        const updatedBin = binsData.find((b: BinLocation) => b.id === currentOpenBin.id);
        return updatedBin || currentOpenBin;
      });
      // ------------------------

    } catch (err) {
      console.error("Database sync error:", err);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed here as it uses setter functions

  useEffect(() => {
  fetchData();
}, [fetchData]);

  // Determine which data source to use (prioritize DB)
  const activeBins = dbBins.length > 0 ? dbBins : contextBins;

  /* =======================
      State & Filtering
  ======================= */
  const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "empty" | "partial" | "full">("all");
  const [filterRow, setFilterRow] = useState<RowName | "all">("all");
  const [highlightSku, setHighlightSku] = useState("");
  const [collapsedRows, setCollapsedRows] = useState<Set<RowName>>(new Set());

  const binsMap = useMemo(() => {
    return activeBins.reduce((acc, b) => ({ ...acc, [b.id]: b }), {} as Record<string, BinLocation>);
  }, [activeBins]);

  const skuList = useMemo(() => {
    const skus = new Set(activeBins.filter(b => b.sku).map(b => b.sku!));
    return Array.from(skus).sort();
  }, [activeBins]);

  const matchesBin = (bin: BinLocation) => {
    if (filterStatus !== "all" && bin.status !== filterStatus) return false;
    
    if (search.trim()) {
      const q = search.toLowerCase();
      
      // Look up the actual product name from your products list
      const product = dbProducts.find(p => p.sku === bin.sku);
      const productName = product?.name?.toLowerCase() || "";

      return (
        bin.id.toLowerCase().includes(q) ||
        bin.sku?.toLowerCase().includes(q) ||
        productName.includes(q) // Now searching the actual name from the DB
      );
    }
    return true;
  };

  const toggleRow = (row: RowName) => {
    setCollapsedRows(prev => {
      const next = new Set(prev);
      next.has(row) ? next.delete(row) : next.add(row);
      return next;
    });
  };

  const emptyCount = activeBins.filter(b => b.status === "empty").length;
  const partialCount = activeBins.filter(b => b.status === "partial").length;
  const fullCount = activeBins.filter(b => b.status === "full").length;

  if (loading && dbBins.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Syncing with NeonDB...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen">
      
      {/* ===== 1. SEARCH & FILTERS ===== */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bin ID, SKU or product..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={filterRow}
              onChange={e => setFilterRow(e.target.value as any)}
              className="appearance-none border border-gray-200 rounded-lg pl-9 pr-10 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none min-w-[140px]"
            >
              <option value="all">All Rows</option>
              {ROWS.map(r => <option key={r} value={r}>Row {r}</option>)}
            </select>
            <Grid3x3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="appearance-none border border-gray-200 rounded-lg pl-9 pr-10 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="empty">Empty</option>
              <option value="partial">Partial</option>
              <option value="full">Full</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={highlightSku}
              onChange={e => setHighlightSku(e.target.value)}
              className="appearance-none border border-gray-200 rounded-lg pl-4 pr-10 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]"
            >
              <option value="">Highlight SKU</option>
              {skuList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-[13px]">
          <div className="flex gap-4 text-gray-500 font-medium">
            <span>Empty <span className="text-gray-400">({emptyCount})</span></span>
            <span>Partial <span className="text-blue-500">({partialCount})</span></span>
            <span>Full <span className="text-red-500">({fullCount})</span></span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-gray-400 italic">
            <Info className="w-3.5 h-3.5" />
            <span>Database Live Connection Active</span>
          </div>
        </div>
      </div>

      {/* ===== 2. GRID LAYOUT ===== */}
      <div className="space-y-6">
        {(filterRow === "all" ? ROWS : [filterRow]).map((rowName) => {
          const isCollapsed = collapsedRows.has(rowName);
          const rowBins = activeBins.filter(b => b.row === rowName);
          const occupiedCount = rowBins.filter(b => b.status !== "empty").length;

          return (
            <div key={rowName} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className={`flex items-center gap-4 px-6 py-4 cursor-pointer text-white transition-colors ${ROW_THEME[rowName]}`}
                onClick={() => toggleRow(rowName)}
              >
                <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg font-bold text-xl">
                  {rowName}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Row {rowName}</h3>
                  <p className="text-white/80 text-xs">
                    {ROW_LAYERS[rowName].length} layers · 25 positions · {occupiedCount}/{rowBins.length} occupied
                  </p>
                </div>
                <div className="ml-auto">
                  {isCollapsed ? <ChevronDown /> : <ChevronUp />}
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-8 overflow-x-auto">
                    {/* Use a fixed-width container to prevent shrinking */}
                    <div className="min-w-[1200px]"> 
                    
                    {/* 1. HEADER ROW (Numbers) */}
                    <div className="flex mb-3">
                        {/* Empty spacer to match the "L1/GND" label width */}
                        <div className="w-12 mr-4" /> 
                        
                        {/* Grid for Numbers */}
                        <div className="grid grid-cols-25 gap-1.5 flex-1">
                        {Array.from({ length: 25 }, (_, i) => (
                            <div key={i} className="w-10 text-center text-[11px] font-bold text-slate-400">
                            {String(i + 1).padStart(2, "0")}
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* 2. LAYERS (Bins) */}
                    <div className="space-y-1.5">
                        {[...ROW_LAYERS[rowName]].reverse().map((layer) => (
                        <div key={layer} className="flex items-center">
                            
                            {/* Layer Label (matches the spacer above) */}
                            <div className="w-12 mr-4 text-right text-xs font-bold text-slate-500 uppercase">
                            {layer === 0 ? "GND" : `L${layer}`}
                            </div>

                            {/* Grid for Bins - must match the numbers grid gap and count */}
                            <div className="grid grid-cols-25 gap-1.5 flex-1">
                            {Array.from({ length: 25 }, (_, i) => {
                                const pos = String(i + 1).padStart(2, "0");
                                const id = `${rowName}-${layer}-${pos}`;
                                const bin = binsMap[id];
                                
                                if (!bin) return <div key={id} className="w-10 h-10" />;

                                const isMatch = matchesBin(bin);
                                const isHighlighted = highlightSku && bin.sku === highlightSku;
                                const isSearching = search !== "" || filterStatus !== "all";

                                return (
                                <button
                                    key={id}
                                    onClick={() => setSelectedBin(bin)}
                                    className={`
                                    relative w-16 h-10 rounded-lg border-2 transition-all duration-200 text-[10px] font-bold
                                    flex items-center justify-center
                                    ${STATUS_BG[bin.status]}
                                    ${isSearching && !isMatch ? "opacity-10 grayscale scale-90" : "opacity-100"}
                                    ${isHighlighted ? "ring-4 ring-yellow-400 border-yellow-500 z-10 scale-110 shadow-lg" : ""}
                                    hover:border-gray-400 hover:scale-105
                                    `}
                                >
                                    {bin.sku?.split('-').pop() || ""}
                                </button>
                                );
                            })}
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>
                </div>
                )}
            </div>
          );
        })}
      </div>

      {/* ===== 3. MODAL ===== */}
      {selectedBin && (
        <BinDetailModal
            bin={selectedBin}
            products={dbProducts} // <--- PASS THE PRODUCT LIST HERE
            onClose={() => {
            setSelectedBin(null);
            fetchData(); // Refresh everything when closed
            }}
            onUpdate={fetchData}
        />
        )}
    </div>
  );
}