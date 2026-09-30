import type { AquariumConfig } from "@/lib/catalog";

export type TankDimensions = { length: number; width: number; height: number };
export type GlassThickness = 6 | 8 | 10 | 12;

export const glassOptions = [
  { mm: 6, rate: 220 }, { mm: 8, rate: 300 }, { mm: 10, rate: 420 }, { mm: 12, rate: 550 },
] as const;
export const feetPresets = [
  { size: "nano", label: "1 ft", name: "Little cube", dimensions: { length: 1, width: 1, height: 1 } },
  { size: "classic", label: "2 ft", name: "Everyday wonder", dimensions: { length: 2, width: 1, height: 1.25 } },
  { size: "landscape", label: "3 ft", name: "Landscape escape", dimensions: { length: 3, width: 1.25, height: 1.25 } },
] as const;
export const defaultDimensions: TankDimensions = { length: 2, width: 1, height: 1.25 };
export function tankDimensions(config: AquariumConfig): TankDimensions {
  return config.dimensionsFeet || feetPresets.find(p => p.size === config.size)?.dimensions || defaultDimensions;
}
export function dimensionsLabel(config: AquariumConfig) {
  const d = tankDimensions(config);
  return `${d.length} × ${d.width} × ${d.height} ft`;
}
export function tankVolume(config: AquariumConfig) {
  if (!config.dimensionsFeet && config.size !== "custom") return config.size === "nano" ? 30 : config.size === "classic" ? 60 : 120;
  const d = tankDimensions(config);
  const result = d.length * d.width * d.height * 28.3168466;
  return Number.isFinite(result) && result > 0 ? Math.round(result) : 0;
}
export function tankGlassEstimate(config: AquariumConfig) {
  if (config.purpose === "upgrade") return 0;
  const d = tankDimensions(config);
  const surface = 2 * d.length * d.height + 2 * d.width * d.height + d.length * d.width;
  const rate = glassOptions.find(o => o.mm === config.glassThickness)?.rate || 300;
  return Number.isFinite(surface) && surface > 0 ? Math.ceil((surface * rate + 750) / 50) * 50 : 0;
}
export function aquariumConfigError(config: AquariumConfig): string | null {
  if (config.size === "custom" && (!config.dimensionsFeet || !config.glassThickness)) return "Choose your tank dimensions and glass thickness.";
  if (config.dimensionsFeet) {
    const d = config.dimensionsFeet;
    if (![d.length, d.width, d.height].every(v => typeof v === "number" && Number.isFinite(v))) return "Please enter valid tank dimensions in feet.";
    if (d.length < 1 || d.length > 6 || d.width < 0.5 || d.width > 3 || d.height < 0.5 || d.height > 2.5) return "Choose length 1–6 ft, width 0.5–3 ft and height 0.5–2.5 ft. Contact us for larger designs.";
  }
  if (config.glassThickness !== undefined && !glassOptions.some(o => o.mm === config.glassThickness)) return "Choose 6 mm, 8 mm, 10 mm or 12 mm glass.";
  const volume = tankVolume(config);
  if (config.fish === "community" && (volume < 60 || tankDimensions(config).length < 1.8)) return "A tetra community needs at least 60 L and generous horizontal swimming space. Enlarge the tank or choose a betta.";
  if (config.fish === "goldfish" && volume < 120) return "Please choose at least 120 L for a goldfish retreat.";
  if (config.fish === "betta" && volume < 20) return "Please choose at least 20 L for a betta sanctuary.";
  return null;
}
export function aquariumSummary(config: AquariumConfig) {
  return `${config.purpose === "upgrade" ? "Upgrade existing aquarium" : "Custom glass aquarium"}: ${dimensionsLabel(config)} (L × W × H), ${config.glassThickness || 8} mm glass, approx. ${tankVolume(config)} L gross volume. Landscape: ${config.style}. Fish: ${config.fish}. Extras: ${config.extras.join(", ") || "none"}. Final glass, bracing and fabrication to be approved by the shop.`;
}
