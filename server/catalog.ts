export const CATALOG = {
  MegapackXL: { w: 40, d: 10, energyMWh: 4, cost: 120000, release: 2022 },
  Megapack2: { w: 30, d: 10, energyMWh: 3, cost: 80000, release: 2021 },
  Megapack: { w: 30, d: 10, energyMWh: 2, cost: 50000, release: 2005 },
  PowerPack: { w: 10, d: 10, energyMWh: 1, cost: 10000, release: 2000 },
  Transformer: { w: 10, d: 10, energyMWh: -0.5, cost: 10000, release: null }
} as const;

export const BATTERY_TYPES = ["MegapackXL", "Megapack2", "Megapack", "PowerPack"] as const;

