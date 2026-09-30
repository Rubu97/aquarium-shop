import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const selections = [
  { id: "fancy-guppy", title: "Cobra Guppy (Poecilia reticulata).JPG" },
  { id: "black-molly", title: "Black molly.jpg" },
  { id: "red-platy", title: "Red coral platy.jpg" },
  { id: "red-swordtail", title: "Xiphophorus hellerii red male 01.jpg" },
  { id: "zebra-danio", title: "Zebrafisch.jpg" },
  { id: "harlequin-rasbora", title: "01.Rasbora heteromorpha.jpg" },
  { id: "cherry-barb", title: "Cherry barb, Puntius titteya.jpg" },
  { id: "cardinal-tetra", title: "Cardinal Paracheirodon axelrodi (3).jpg" },
  { id: "black-skirt-tetra", title: "Gymnocorymbus ternetzi.JPG" },
  { id: "pearl-gourami", title: "Trichopodus leerii.jpg" },
  { id: "freshwater-angelfish", title: "Pterophyllum scalare.jpg" },
  { id: "german-blue-ram", title: "Mikrogeophagus ramirezi male.jpg" },
  {
    id: "discus", title: "Vibrant discus fish in lush aquarium habitat",
    directUrl: "https://images.pexels.com/photos/30363521/pexels-photo-30363521.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    source: "https://www.pexels.com/photo/vibrant-discus-fish-in-lush-aquarium-habitat-30363521/",
    artist: "Miguel Cuenca", license: "Pexels License", licenseUrl: "https://www.pexels.com/license/",
  },
  { id: "peppered-corydoras", title: "Corydoras paleatus.jpg" },
  { id: "bristlenose-pleco", title: "Ancistrus sp.jpg" },
];
const headers = { "User-Agent": "ExoticAquariumHouse/1.0 (local aquarium image sourcing with attribution)" };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fetchWithRetry(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(45000) });
      if (response.ok) return response;
      if (![429, 500, 502, 503, 504].includes(response.status)) throw new Error(`HTTP ${response.status} for ${url}`);
      const retry = Number(response.headers.get("retry-after"));
      await wait(retry > 0 ? retry * 1000 : 6000 * (attempt + 1));
    } catch (error) {
      if (attempt === 3) throw error;
      await wait(4000 * (attempt + 1));
    }
  }
  throw new Error(`Unable to download ${url}`);
}
function plainText(value) {
  return (value || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
const api = new URL("https://commons.wikimedia.org/w/api.php");
api.search = new URLSearchParams({
  action: "query", titles: selections.filter(item => !item.directUrl).map(item => `File:${item.title}`).join("|"),
  prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "960", format: "json", formatversion: "2",
});
const data = await (await fetchWithRetry(api)).json();
const credits = {};
await mkdir("public/images/fish", { recursive: true });
await mkdir("artifacts", { recursive: true });

for (const item of selections) {
  const info = item.directUrl ? null : data.query.pages.find(page => page.title === `File:${item.title}`)?.imageinfo?.[0];
  if (!item.directUrl && !info) throw new Error(`Photo missing: ${item.title}`);
  const metadata = info?.extmetadata;
  const license = item.license || plainText(metadata?.LicenseShortName?.value);
  if (!/^(CC BY|CC0|Pexels|Public domain|Copyrighted free use)/.test(license)) throw new Error(`Review the licence for ${item.title}: ${license}`);
  const sourceUrl = item.directUrl || info.thumburl || info.url;
  const buffer = Buffer.from(await (await fetchWithRetry(sourceUrl)).arrayBuffer());
  const target = `public/images/fish/${item.id}.jpg`;
  await sharp(buffer).rotate().resize({ width: 960, height: 720, fit: "contain", background: "#10271e" }).jpeg({ quality: 88, mozjpeg: true }).toFile(target);
  credits[item.id] = {
    title: item.title, artist: item.artist || plainText(metadata?.Artist?.value) || "Wikimedia Commons contributor",
    source: item.source || info.descriptionurl, license,
    licenseUrl: item.licenseUrl || metadata?.LicenseUrl?.value?.replace(/^http:/, "https:") || info.descriptionurl,
    changes: "Resized and padded for display; the storefront may crop the photo.",
  };
  console.log(`Saved ${target} · ${license} · ${credits[item.id].artist}`);
  await wait(800);
}
await writeFile("src/lib/fish-image-credits.json", JSON.stringify(credits, null, 2) + "\n");
const layers = [];
for (let index = 0; index < selections.length; index++) {
  const item = selections[index];
  const left = (index % 3) * 360;
  const top = Math.floor(index / 3) * 294;
  const image = await sharp(`public/images/fish/${item.id}.jpg`).resize(350, 260, { fit: "contain", background: "#10271e" }).toBuffer();
  layers.push({ input: image, left: left + 5, top: top + 3 });
  const label = `<svg width="360" height="28"><text x="12" y="19" fill="#eeeedd" font-family="sans-serif" font-size="14">${index + 1}. ${item.id}</text></svg>`;
  layers.push({ input: Buffer.from(label), left, top: top + 263 });
}
await sharp({ create: { width: 1080, height: 1470, channels: 3, background: "#091c15" } }).composite(layers).jpeg({ quality: 90 }).toFile("artifacts/new-fish-photos.jpg");
console.log("Saved all 15 local photos, photo credits, and visual review sheet.");
