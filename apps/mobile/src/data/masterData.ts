export type CatalogKey = 'assets' | 'utilities' | 'tooling' | 'measuring' | 'spareParts' | 'consumables' | 'safety' | 'suppliers';

export type MasterRecord = {
  id: string;
  code: string;
  name: string;
  secondary: string;
  status: 'active' | 'warning' | 'inactive';
  location?: string;
  nextDue?: string;
  quantity?: number;
  unit?: string;
};

export const masterData: Record<CatalogKey, MasterRecord[]> = {
  assets: [
    { id: 'a1', code: 'ST-02', name: 'Stamping Machine', secondary: '250T', status: 'active', location: 'Line A', nextDue: '2026-09-15' },
    { id: 'a2', code: 'PR-03', name: 'Press Machine', secondary: 'Hydraulic', status: 'warning', location: 'Line B', nextDue: '2026-09-10' },
    { id: 'a3', code: 'WD-01', name: 'Winding Machine', secondary: 'Coil winding', status: 'active', location: 'Line C', nextDue: '2026-09-22' },
  ],
  utilities: [
    { id: 'u1', code: 'AC-01', name: 'Air Compressor', secondary: '75 kW', status: 'active', location: 'Utility room', nextDue: '2026-09-18' },
    { id: 'u2', code: 'CH-01', name: 'Chiller', secondary: 'Cooling system', status: 'active', location: 'Utility room', nextDue: '2026-09-25' },
  ],
  tooling: [
    { id: 't1', code: 'JIG-WPC-01', name: 'WPC Assembly Jig', secondary: 'Fixture', status: 'active', location: 'WPC line', nextDue: '2026-10-01' },
    { id: 't2', code: 'MOLD-004', name: 'Housing Mold', secondary: 'Injection mold', status: 'warning', location: 'Tooling rack A', nextDue: '2026-09-12' },
  ],
  measuring: [
    { id: 'm1', code: 'CAL-023', name: 'Digital Caliper', secondary: '0–150 mm', status: 'active', location: 'QC room', nextDue: '2026-11-30' },
    { id: 'm2', code: 'LCR-005', name: 'LCR Meter', secondary: 'Bench tester', status: 'warning', location: 'QC room', nextDue: '2026-09-14' },
    { id: 'm3', code: 'TQ-011', name: 'Torque Meter', secondary: 'Digital', status: 'active', location: 'Assembly QC', nextDue: '2026-12-15' },
  ],
  spareParts: [
    { id: 's1', code: 'BRG-6204', name: 'Bearing 6204', secondary: 'Machine spare part', status: 'active', quantity: 12, unit: 'EA', location: 'Spare warehouse' },
    { id: 's2', code: 'SNS-PX01', name: 'Proximity Sensor', secondary: '24VDC', status: 'warning', quantity: 2, unit: 'EA', location: 'Spare warehouse' },
    { id: 's3', code: 'BLT-A32', name: 'Drive Belt A32', secondary: 'V-belt', status: 'active', quantity: 8, unit: 'EA', location: 'Spare warehouse' },
  ],
  consumables: [
    { id: 'c1', code: 'OIL-46', name: 'Hydraulic Oil ISO VG46', secondary: 'Maintenance oil', status: 'active', quantity: 60, unit: 'L', location: 'Chemical store' },
    { id: 'c2', code: 'GRS-EP2', name: 'Grease EP2', secondary: 'Lubricant', status: 'active', quantity: 14, unit: 'KG', location: 'Chemical store' },
  ],
  safety: [
    { id: 'sf1', code: 'LC-ST02', name: 'Light Curtain', secondary: 'ST-02 safety device', status: 'active', location: 'Line A', nextDue: '2026-09-20' },
    { id: 'sf2', code: 'ES-PR03', name: 'Emergency Stop', secondary: 'PR-03 safety device', status: 'active', location: 'Line B', nextDue: '2026-09-20' },
  ],
  suppliers: [
    { id: 'v1', code: 'SUP-CAL-01', name: 'Calibration Service Provider', secondary: 'External calibration', status: 'active', nextDue: '2027-01-15' },
    { id: 'v2', code: 'SUP-MTN-02', name: 'Machine Repair Provider', secondary: 'Mechanical & electrical repair', status: 'active', nextDue: '2027-03-30' },
  ],
};
