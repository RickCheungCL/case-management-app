"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  BinLocation,
  INITIAL_BINS,
  SAMPLE_PRODUCTS,
  Product,
  updateBinStatus,
} from '../data/wmsData';

interface WMSContextValue {
  bins: BinLocation[];
  products: Product[];
  updateBin: (id: string, updates: Partial<BinLocation>) => void;
  adjustQuantity: (id: string, delta: number) => void;
  assignProduct: (id: string, sku: string, quantity: number) => void;
  clearBin: (id: string) => void;
  moveBin: (fromId: string, toId: string) => void;
  getBin: (id: string) => BinLocation | undefined;
  addProduct: (product: Product) => void;
}

const WMSContext = createContext<WMSContextValue | null>(null);

export function WMSProvider({ children }: { children: React.ReactNode }) {
  const [bins, setBins] = useState<BinLocation[]>(INITIAL_BINS);
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);

  const getBin = useCallback((id: string) => bins.find(b => b.id === id), [bins]);

  const updateBin = useCallback((id: string, updates: Partial<BinLocation>) => {
    setBins(prev =>
      prev.map(bin => {
        if (bin.id !== id) return bin;
        const updated = { ...bin, ...updates, lastUpdated: new Date().toISOString() };
        updated.status = updateBinStatus(updated);
        return updated;
      })
    );
  }, []);

  const adjustQuantity = useCallback((id: string, delta: number) => {
    setBins(prev =>
      prev.map(bin => {
        if (bin.id !== id) return bin;
        const newQty = Math.max(0, Math.min(bin.maxCapacity, bin.quantity + delta));
        const updated = { ...bin, quantity: newQty, lastUpdated: new Date().toISOString() };
        updated.status = updateBinStatus(updated);
        return updated;
      })
    );
  }, []);

  const assignProduct = useCallback((id: string, sku: string, quantity: number) => {
    const product = products.find(p => p.sku === sku);
    if (!product) return;
    setBins(prev =>
      prev.map(bin => {
        if (bin.id !== id) return bin;
        const clampedQty = Math.min(quantity, bin.maxCapacity);
        const updated = {
          ...bin,
          sku,
          productName: product.name,
          quantity: clampedQty,
          unit: product.unit,
          lastUpdated: new Date().toISOString(),
        };
        updated.status = updateBinStatus(updated);
        return updated;
      })
    );
  }, [products]);

  const clearBin = useCallback((id: string) => {
    setBins(prev =>
      prev.map(bin => {
        if (bin.id !== id) return bin;
        return {
          ...bin,
          sku: null,
          productName: null,
          quantity: 0,
          status: 'empty',
          lastUpdated: new Date().toISOString(),
        };
      })
    );
  }, []);

  const moveBin = useCallback((fromId: string, toId: string) => {
    setBins(prev => {
      const from = prev.find(b => b.id === fromId);
      const to = prev.find(b => b.id === toId);
      if (!from || !to) return prev;

      return prev.map(bin => {
        if (bin.id === fromId) {
          return {
            ...bin,
            sku: null,
            productName: null,
            quantity: 0,
            status: 'empty' as const,
            lastUpdated: new Date().toISOString(),
          };
        }
        if (bin.id === toId) {
          const updated = {
            ...bin,
            sku: from.sku,
            productName: from.productName,
            quantity: Math.min(from.quantity, bin.maxCapacity),
            unit: from.unit,
            lastUpdated: new Date().toISOString(),
          };
          updated.status = updateBinStatus(updated);
          return updated;
        }
        return bin;
      });
    });
  }, []);

  const addProduct = useCallback((product: Product) => {
    setProducts(prev => {
      if (prev.find(p => p.sku === product.sku)) return prev;
      return [...prev, product];
    });
  }, []);

  return (
    <WMSContext.Provider value={{ bins, products, updateBin, adjustQuantity, assignProduct, clearBin, moveBin, getBin, addProduct }}>
      {children}
    </WMSContext.Provider>
  );
}

export function useWMS() {
  const ctx = useContext(WMSContext);
  if (!ctx) throw new Error('useWMS must be used within WMSProvider');
  return ctx;
}
