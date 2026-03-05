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
        {/* Header: Responsive padding and font sizes */}
        <div 
          className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 cursor-pointer text-white transition-colors ${ROW_THEME[rowName]}`}
          onClick={() => toggleRow(rowName)}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center bg-white/20 rounded-lg font-bold text-lg md:text-xl">
            {rowName}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base md:text-lg leading-tight truncate">Row {rowName}</h3>
            <p className="text-white/80 text-[10px] md:text-xs">
               {occupiedCount}/{rowBins.length} occupied
            </p>
          </div>
          <div className="flex-shrink-0">
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </div>
        </div>

        {!isCollapsed && (
          /* Horizontal Scroll Container: 
             - 'overflow-x-auto' allows scrolling on Laptop/Phone.
             - 'p-4 md:p-8' adjusts spacing for screen size.
          */
          <div className="p-4 md:p-8 overflow-x-auto bg-slate-50/50">
            
            {/* The 'min-w-max' ensures the 25 bins stay in a line and don't squish */}
            <div className="inline-block min-w-max pb-2"> 
              
              {/* 1. HEADER ROW (Numbers) */}
              <div className="flex mb-3">
                {/* Spacer matches the width of the GND/L1 labels */}
                <div className="w-10 md:w-12 mr-3 md:mr-4 flex-shrink-0" /> 
                <div className="flex gap-1 md:gap-1.5">
                  {Array.from({ length: 25 }, (_, i) => (
                    <div key={i} className="w-12 md:w-16 text-center text-[10px] md:text-[11px] font-bold text-slate-400 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. LAYERS (Bins) */}
              <div className="space-y-1 md:space-y-1.5">
                {[...ROW_LAYERS[rowName]].reverse().map((layer) => (
                  <div key={layer} className="flex items-center">
                    
                    {/* Layer Label */}
                    <div className="w-10 md:w-12 mr-3 md:mr-4 text-right text-[10px] md:text-xs font-bold text-slate-500 uppercase flex-shrink-0">
                      {layer === 0 ? "GND" : `L${layer}`}
                    </div>

                    {/* The Row of Bins */}
                    <div className="flex gap-1 md:gap-1.5">
                      {Array.from({ length: 25 }, (_, i) => {
                        const pos = String(i + 1).padStart(2, "0");
                        const id = `${rowName}-${layer}-${pos}`;
                        const bin = binsMap[id];
                        
                        if (!bin) return <div key={id} className="w-12 md:w-16 h-10 md:h-12 flex-shrink-0 opacity-20 bg-gray-200 rounded-lg" />;

                        const isMatch = matchesBin(bin);
                        const isHighlighted = highlightSku && bin.sku === highlightSku;
                        const isSearching = search !== "" || filterStatus !== "all";

                        return (
                          <button
                            key={id}
                            onClick={() => setSelectedBin(bin)}
                            className={`
                              relative w-12 md:w-16 h-10 md:h-12 rounded-lg border-2 transition-all flex-shrink-0
                              flex items-center justify-center text-[9px] md:text-[10px] font-bold
                              ${STATUS_BG[bin.status]}
                              ${isSearching && !isMatch ? "opacity-10 grayscale scale-95" : "opacity-100"}
                              ${isHighlighted ? "ring-4 ring-yellow-400 border-yellow-500 z-10 scale-110 shadow-lg" : ""}
                              hover:border-gray-400 active:scale-95
                            `}
                          >
                            <span className="truncate px-0.5">
                              {bin.sku?.split('-').pop() || ""}
                            </span>
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