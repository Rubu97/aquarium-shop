import { mkdir, writeFile, readFile } from "node:fs/promises";
import sharp from "sharp";

const plants = [
  ["amazon-sword", "Echinodorus grisebachii aquarium"],
  ["cryptocoryne-wendtii", '"Cryptocoryne wendtii"'],
  ["vallisneria", '"Vallisneria spiralis"'],
  ["java-moss", '"Taxiphyllum barbieri"'],
  ["christmas-moss", '"Vesicularia montagnei"'],
  ["monte-carlo", '"Micranthemum" "Monte Carlo"'],
  ["dwarf-hairgrass", '"Eleocharis parvula"'],
  ["hygrophila-polysperma", '"Hygrophila polysperma"'],
  ["ludwigia-repens", '"Ludwigia repens"'],
  ["rotala-rotundifolia", '"Rotala rotundifolia"'],
  ["water-wisteria", '"Hygrophila difformis"'],
  ["bacopa-caroliniana", '"Bacopa caroliniana"'],
  ["hornwort", '"Ceratophyllum demersum"'],
  ["dwarf-sagittaria", '"Sagittaria subulata"'],
  ["amazon-frogbit", '"Limnobium laevigatum"'],
];
const headers = { "User-Agent": "ExoticAquariumHouse/1.0 (plant photography with visible attribution)" };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function get(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(45000) });
    if (response.ok) return response;
    if (![429, 500, 502, 503, 504].includes(response.status)) throw new Error(`HTTP ${response.status}: ${url}`);
    await wait(15000 * (attempt + 1));
  }
  throw new Error(`Unable to fetch ${url}`);
}
const plain = value => (value || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
await mkdir("artifacts", { recursive: true });
await mkdir("public/images/plants", { recursive: true });
const mode = process.argv[2] || "search";
if (mode === "search") {
  const candidates = {};
  for (const [id, query] of plants) {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.search = new URLSearchParams({ action: "query", generator: "search", gsrsearch: `${query} filetype:bitmap -map -distribution`, gsrnamespace: "6", gsrlimit: "4", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "960", format: "json", formatversion: "2" });
    const data = await (await get(url)).json();
    candidates[id] = (data.query?.pages || []).sort((a, b) => a.index - b.index).map(page => {
      const image = page.imageinfo?.[0], meta = image?.extmetadata;
      return { title: page.title, url: image?.thumburl || image?.url, source: image?.descriptionurl, artist: plain(meta?.Artist?.value) || "Wikimedia Commons contributor", license: plain(meta?.LicenseShortName?.value), licenseUrl: meta?.LicenseUrl?.value || image?.descriptionurl, description: plain(meta?.ImageDescription?.value).slice(0, 140) };
    }).filter(image => /^(CC BY|CC0|Public domain|Copyrighted free use)/.test(image.license));
    console.log(id, candidates[id].map((x, index) => `${index}: ${x.title} · ${x.license}`).join(" | "));
    await wait(3000);
  }
  await writeFile("artifacts/plant-candidates.json", JSON.stringify(candidates, null, 2));
} else {
  const candidates = JSON.parse(await readFile("artifacts/plant-candidates.json", "utf8"));
  const selection = JSON.parse(await readFile("scripts/plant-image-selection.json", "utf8"));
  const credits = {};
  for (const [id] of plants) {
    const chosen = candidates[id]?.[selection[id] ?? 0];
    if (!chosen?.url) throw new Error(`Choose a licensed photo for ${id}`);
    const bytes = Buffer.from(await (await get(chosen.url)).arrayBuffer());
    await sharp(bytes).rotate().resize(960, 720, { fit: "contain", background: "#10271e" }).jpeg({ quality: 86, mozjpeg: true }).toFile(`public/images/plants/${id}.jpg`);
    credits[id] = { ...chosen, changes: "Resized and padded for display; storefront cropping may apply." };
    console.log(`Saved ${id}: ${chosen.title}`);
    await wait(700);
  }
  await writeFile("src/lib/plant-image-credits.json", JSON.stringify(credits, null, 2) + "\n");
  const composites = [];
  for (let i = 0; i < plants.length; i++) {
    const id = plants[i][0], left = (i % 3) * 320, top = Math.floor(i / 3) * 254;
    composites.push({ input: await sharp(`public/images/plants/${id}.jpg`).resize(310, 225, { fit: "contain" }).toBuffer(), left: left + 5, top: top + 3 });
    composites.push({ input: Buffer.from(`<svg width="320" height="25"><text x="8" y="17" fill="#eeeedd" font-family="sans-serif" font-size="12">${id}</text></svg>`), left, top: top + 228 });
  }
  await sharp({ create: { width: 960, height: 1270, channels: 3, background: "#091c15" } }).composite(composites).jpeg({ quality: 88 }).toFile("artifacts/new-plants.jpg");
}
