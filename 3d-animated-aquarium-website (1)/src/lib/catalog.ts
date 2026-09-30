import { additionalFish } from "@/lib/additional-fish";
import { additionalPlants } from "@/lib/additional-plants";
import { additionalAccessories } from "@/lib/additional-accessories";
import { tankGlassEstimate, type GlassThickness, type TankDimensions } from "@/lib/aquarium";

export type Category = "Fish" | "Aquariums" | "Plants" | "Accessories";
export type Product = {
  id: string; name: string; subtitle: string; category: Category; description: string;
  price: number; originalPrice: number | null; image: string; badge: string | null;
  rating: number; stock: number; care: string;
};
export type CartItem = { productId: string; quantity: number };
export type OrderLine = { productId: string; name: string; price: number; quantity: number };
export type AquariumConfig = {
  purpose: "new" | "upgrade";
  size: "nano" | "classic" | "landscape" | "custom";
  dimensionsFeet?: TankDimensions;
  glassThickness?: GlassThickness;
  style: "nature" | "minimal" | "rock";
  fish: "community" | "betta" | "goldfish";
  extras: string[];
};
export const formatPrice = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
export const SHIPPING_FEE = 150;
export const FREE_SHIPPING_AT = 3000;

// Retained for older saved aquarium enquiries.
export const tankOptions = [
  { id: "nano", name: "The little escape", label: "30 L", dimensions: "30 × 30 × 35 cm", price: 3499 },
  { id: "classic", name: "The everyday wonder", label: "60 L", dimensions: "60 × 30 × 35 cm", price: 5999 },
  { id: "landscape", name: "The statement piece", label: "120 L", dimensions: "90 × 40 × 40 cm", price: 9999 },
] as const;
export const styleOptions = [
  { id: "nature", name: "Lush & natural", description: "Living greens, moss & driftwood", price: 1499 },
  { id: "minimal", name: "Quiet & minimal", description: "Clean sand with a few soft greens", price: 799 },
  { id: "rock", name: "Wild & rocky", description: "Sculptural stone & a green carpet", price: 1199 },
] as const;
export const fishOptions = [
  { id: "community", name: "Tropical community", description: "A colourful school of 6 neon tetras", price: 480 },
  { id: "betta", name: "Betta sanctuary", description: "One show-stopping halfmoon betta", price: 450 },
  { id: "goldfish", name: "Goldfish retreat", description: "One fancy goldfish · 120 L recommended", price: 550 },
] as const;
export const extraOptions = [
  { id: "filter", name: "Quiet-flow filtration", price: 1299 },
  { id: "light", name: "Full-spectrum LED light", price: 899 },
  { id: "heater", name: "Adjustable aquarium heater", price: 649 },
] as const;
export function aquariumEstimate(config: AquariumConfig) {
  const tank = config.purpose === "upgrade" ? 0 : config.dimensionsFeet || config.glassThickness ? tankGlassEstimate(config) : (tankOptions.find(x => x.id === config.size)?.price ?? 0);
  return tank + (styleOptions.find(x => x.id === config.style)?.price ?? 0) + (fishOptions.find(x => x.id === config.fish)?.price ?? 0) + extraOptions.filter(x => config.extras.includes(x.id)).reduce((sum, x) => sum + x.price, 0);
}

export const productSeeds: Product[] = [
  { id: "koi-betta", name: "Koi Halfmoon Betta", subtitle: "A little fish. A lot of personality.", category: "Fish", description: "A beautiful, individually selected koi halfmoon betta with flowing fins and a vibrant orange-and-white pattern. An ideal centrepiece for a peaceful, planted aquarium. Each fish has its own unique markings.", price: 450, originalPrice: 599, image: "/images/betta.jpg", badge: "BESTSELLER", rating: 4.9, stock: 18, care: "Freshwater · 24–28°C · 20 L+ · Keep one male per tank" },
  { id: "neon-tetras", name: "Neon Tetra School", subtitle: "Little flashes of electric blue · pack of 6", category: "Fish", description: "Bring your aquarium to life with six healthy, active neon tetras. Their electric blue and red colours look beautiful against green plants. Best kept together in a mature freshwater community aquarium.", price: 480, originalPrice: null, image: "/images/neon-tetra.jpg", badge: "COMMUNITY FAVOURITE", rating: 4.8, stock: 25, care: "Freshwater · 22–26°C · 60 L+ · School of 6" },
  { id: "nature-cube", name: "Nature Cube Aquarium", subtitle: "Your own little corner of nature · 30 L", category: "Aquariums", description: "A beautifully clear, rimless 30-litre glass aquarium. The compact cube gives you an uninterrupted view of your underwater world. Includes the glass tank and a protective base mat; plants, fish and equipment are sold separately.", price: 3499, originalPrice: 3999, image: "/images/aquarium-tank.jpg", badge: "OUR PICK", rating: 4.9, stock: 8, care: "30 × 30 × 35 cm · Ultra-clear glass · Tank & mat included" },
  { id: "anubias-nana", name: "Anubias Nana", subtitle: "Easy greens for a thriving underwater world", category: "Plants", description: "A hardy, slow-growing freshwater plant with rich green leaves. Perfect for beginners and low-light aquariums. Attach the rhizome to stone or driftwood rather than burying it in the substrate.", price: 249, originalPrice: 299, image: "/images/aquatic-plants.jpg", badge: "BEGINNER FRIENDLY", rating: 4.8, stock: 40, care: "Low light · No CO₂ needed · One healthy potted plant" },
  { id: "fancy-goldfish", name: "Fancy Goldfish", subtitle: "A golden glow with graceful flowing fins", category: "Fish", description: "One carefully selected fancy goldfish with a bright orange colour and a wonderfully curious personality. Fancy goldfish need generous swimming space and powerful filtration. Ask us to help choose the right setup.", price: 550, originalPrice: null, image: "/images/aquarium-hero.jpg", badge: "SHOP FAVOURITE", rating: 4.9, stock: 12, care: "Freshwater · 18–24°C · 120 L recommended · One fish" },
  { id: "landscape-tank", name: "Landscape Aquarium", subtitle: "More room for your imagination · 120 L", category: "Aquariums", description: "A spacious 120-litre rimless glass aquarium for a beautiful planted landscape or a freshwater community. Includes the glass tank and base mat. We can help you plan the lighting, filtration and livestock separately.", price: 9999, originalPrice: 11999, image: "/images/aquarium-tank.jpg", badge: "DREAM BIGGER", rating: 4.9, stock: 4, care: "90 × 40 × 40 cm · Clear glass · Tank & mat included" },
  { id: "java-fern", name: "Java Fern Bundle", subtitle: "Effortless texture, naturally beautiful", category: "Plants", description: "Three healthy Java fern stems, ready to attach to driftwood or stone. These forgiving plants add depth and movement to your aquarium, without demanding bright lighting or CO₂.", price: 349, originalPrice: null, image: "/images/aquatic-plants.jpg", badge: null, rating: 4.7, stock: 30, care: "Low to medium light · 3 stems · Do not bury rhizome" },
  { id: "quiet-filter", name: "Quiet-Flow Canister Filter", subtitle: "Crystal-clear water. Peaceful little worlds.", category: "Accessories", description: "Compact external filtration for freshwater aquariums up to 60 litres. Quiet operation and easy-to-clean filter media help keep your underwater world healthy. Includes filter media and connecting tubes.", price: 1299, originalPrice: 1599, image: "/images/aquarium-accessories.jpg", badge: "ESSENTIAL", rating: 4.8, stock: 15, care: "Up to 60 L · Media & tubes included · 220–240 V" },
  { id: "led-light", name: "Full-Spectrum LED Light", subtitle: "Let your underwater world shine", category: "Accessories", description: "A slim full-spectrum LED light for 30–60 cm freshwater tanks. Bring out the colours of your fish and give easy-care plants the light they need. Includes adjustable mounting legs.", price: 899, originalPrice: 1099, image: "/images/aquarium-accessories.jpg", badge: null, rating: 4.7, stock: 20, care: "30–60 cm tanks · Adjustable legs · 220–240 V" },
  { id: "carpet-plants", name: "Living Green Carpet", subtitle: "A lush foundation for your aquascape", category: "Plants", description: "A healthy starter portion of carpet plants to bring a fresh green foreground to your aquascape. Medium to bright lighting recommended. We will help you choose the best variety for your tank.", price: 399, originalPrice: null, image: "/images/aquatic-plants.jpg", badge: "AQUASCAPE ESSENTIAL", rating: 4.8, stock: 22, care: "Medium to bright light · One starter portion" },
  { id: "classic-tank", name: "Classic Rimless Aquarium", subtitle: "A beautiful balance of space & simplicity · 60 L", category: "Aquariums", description: "A versatile 60-litre rimless freshwater tank with a protective base mat. A lovely choice for a small tetra community or a planted aquascape. Decorations and equipment are sold separately.", price: 5999, originalPrice: 6999, image: "/images/aquarium-tank.jpg", badge: null, rating: 4.9, stock: 6, care: "60 × 30 × 35 cm · Clear glass · Tank & mat included" },
  { id: "aquarium-heater", name: "Adjustable Aquarium Heater", subtitle: "A little warmth for tropical life", category: "Accessories", description: "An adjustable 50-watt heater with suction mounts for small tropical aquariums. Helps keep a steady temperature for bettas and tropical community fish. Always use an independent thermometer.", price: 649, originalPrice: 799, image: "/images/aquarium-accessories.jpg", badge: null, rating: 4.7, stock: 18, care: "50 W · 20–60 L · Adjustable thermostat · 220–240 V" },
  ...additionalFish, ...additionalPlants, ...additionalAccessories,
];
