export type RowName = 'A' | 'C' | 'D' | 'E';
export type LayerName = 'G' | '1' | '2' | '3' | '4';
export type BinStatus = 'empty' | 'partial' | 'full';

export interface BinLocation {
  id: string;
  row: RowName;
  layer: LayerName;
  position: number;
  sku: string | null;
  productName: string | null;
  quantity: number;
  maxCapacity: number;
  unit: string;
  status: BinStatus;
  lastUpdated: string;
}

export interface Product {
  sku: string;
  name: string;
  unit: string;
}

export const ROWS: RowName[] = ['A', 'C', 'D', 'E'];
export const POSITIONS = Array.from({ length: 25 }, (_, i) => i + 1);

export const ROW_LAYERS: Record<RowName, LayerName[]> = {
  A: ['G', '1', '2', '3'],
  C: ['G', '1', '2', '3'],
  D: ['G', '1', '2', '3', '4'],
  E: ['G', '1', '2', '3'],
};

export const LAYER_LABELS: Record<LayerName, string> = {
  G: 'Ground',
  '1': 'Layer 1',
  '2': 'Layer 2',
  '3': 'Layer 3',
  '4': 'Layer 4',
};

export const SAMPLE_PRODUCTS: Product[] = [
  { sku: 'SKU-001', name: 'Aluminium Pipe 50mm', unit: 'PCS' },
  { sku: 'SKU-002', name: 'Steel Bolt M12', unit: 'BOX' },
  { sku: 'SKU-003', name: 'PVC Tube 25mm', unit: 'M' },
  { sku: 'SKU-004', name: 'Copper Wire 2.5mm', unit: 'KG' },
  { sku: 'SKU-005', name: 'Rubber Gasket 80mm', unit: 'PCS' },
  { sku: 'SKU-006', name: 'Stainless Bracket L', unit: 'PCS' },
  { sku: 'SKU-007', name: 'Iron Fitting 3/4"', unit: 'PCS' },
  { sku: 'SKU-008', name: 'Polyethylene Sheet', unit: 'M2' },
  { sku: 'SKU-009', name: 'Hex Nut M8', unit: 'BOX' },
  { sku: 'SKU-010', name: 'Cable Conduit 20mm', unit: 'M' },
];

function getBinStatus(qty: number, max: number): BinStatus {
  if (qty === 0) return 'empty';
  if (qty >= max) return 'full';
  return 'partial';
}

function generateInitialBins(): BinLocation[] {
  const bins: BinLocation[] = [];
  const now = new Date().toISOString();

  // Seed data: some bins will be pre-filled
  const preFilledBins: Partial<Record<string, { sku: string; qty: number }>> = {
    'A-G-01': { sku: 'SKU-001', qty: 40 },
    'A-G-02': { sku: 'SKU-002', qty: 100 },
    'A-G-03': { sku: 'SKU-001', qty: 100 },
    'A-1-01': { sku: 'SKU-003', qty: 25 },
    'A-1-05': { sku: 'SKU-004', qty: 50 },
    'A-2-03': { sku: 'SKU-005', qty: 80 },
    'A-3-07': { sku: 'SKU-006', qty: 60 },
    'C-G-10': { sku: 'SKU-007', qty: 30 },
    'C-G-11': { sku: 'SKU-008', qty: 20 },
    'C-1-04': { sku: 'SKU-009', qty: 200 },
    'C-1-08': { sku: 'SKU-010', qty: 45 },
    'C-2-15': { sku: 'SKU-001', qty: 100 },
    'C-3-20': { sku: 'SKU-002', qty: 100 },
    'D-G-05': { sku: 'SKU-003', qty: 12 },
    'D-G-06': { sku: 'SKU-004', qty: 75 },
    'D-1-09': { sku: 'SKU-005', qty: 100 },
    'D-2-12': { sku: 'SKU-006', qty: 55 },
    'D-3-18': { sku: 'SKU-007', qty: 90 },
    'D-4-22': { sku: 'SKU-008', qty: 8 },
    'D-4-25': { sku: 'SKU-009', qty: 300 },
    'E-G-14': { sku: 'SKU-010', qty: 60 },
    'E-G-15': { sku: 'SKU-001', qty: 95 },
    'E-1-03': { sku: 'SKU-002', qty: 100 },
    'E-2-19': { sku: 'SKU-003', qty: 33 },
    'E-3-24': { sku: 'SKU-004', qty: 70 },
  };

  for (const row of ROWS) {
    for (const layer of ROW_LAYERS[row]) {
      for (const pos of POSITIONS) {
        const id = `${row}-${layer}-${String(pos).padStart(2, '0')}`;
        const maxCap = layer === 'G' ? 100 : layer === '1' ? 100 : layer === '2' ? 80 : layer === '3' ? 60 : 50;
        const prefill = preFilledBins[id];
        const product = prefill ? SAMPLE_PRODUCTS.find(p => p.sku === prefill.sku) : null;

        bins.push({
          id,
          row,
          layer,
          position: pos,
          sku: prefill ? prefill.sku : null,
          productName: product ? product.name : null,
          quantity: prefill ? prefill.qty : 0,
          maxCapacity: maxCap,
          unit: product ? product.unit : 'PCS',
          status: prefill ? getBinStatus(prefill.qty, maxCap) : 'empty',
          lastUpdated: now,
        });
      }
    }
  }

  return bins;
}

export const INITIAL_BINS = generateInitialBins();

export function updateBinStatus(bin: BinLocation): BinStatus {
  return getBinStatus(bin.quantity, bin.maxCapacity);
}
