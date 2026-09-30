import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const sheets = [
  { file: "hardscape-sheet.jpg", ids: ["seiryu-rock", "lava-rock", "dragon-stone", "river-pebbles", "white-sand", "black-sand", "aquasoil", "spider-driftwood", "malaysian-driftwood"] },
  { file: "filtration-sheet.jpg", ids: ["sponge-filter", "double-sponge-filter", "internal-filter", "hang-on-back-filter", "nano-canister-filter", "large-canister-filter", "top-filter", "undergravel-filter", "quiet-air-pump"] },
  { file: "equipment-sheet.jpg", ids: ["ceramic-rings", "filter-foam", "activated-carbon", "filter-floss", "air-stone", "airline-tubing", null, "aquarium-siphon", null] },
];
await mkdir("public/images/accessories", { recursive: true });
await mkdir("artifacts", { recursive: true });
const all = [];
for (const sheet of sheets) {
  const path = `public/images/${sheet.file}`;
  const meta = await sharp(path).metadata();
  const tileW = Math.floor(meta.width / 3), tileH = Math.floor(meta.height / 3);
  for (let index = 0; index < sheet.ids.length; index++) {
    const id = sheet.ids[index]; if (!id) continue;
    const insetX = Math.ceil(tileW * 0.09), insetY = Math.ceil(tileH * 0.09);
    await sharp(path).extract({ left: (index % 3) * tileW + insetX, top: Math.floor(index / 3) * tileH + insetY, width: tileW - insetX * 2, height: tileH - insetY * 2 }).resize(800, 600, { fit: "contain", background: "#10271e" }).jpeg({ quality: 88, mozjpeg: true }).toFile(`public/images/accessories/${id}.jpg`);
    all.push(id); console.log(`Saved ${id}`);
  }
}
const composites = [];
for (let i = 0; i < all.length; i++) {
  const left = (i % 5) * 220, top = Math.floor(i / 5) * 194;
  composites.push({ input: await sharp(`public/images/accessories/${all[i]}.jpg`).resize(210, 160).toBuffer(), left: left + 5, top: top + 3 });
  composites.push({ input: Buffer.from(`<svg width="220" height="26"><text x="6" y="17" fill="#eeeedd" font-family="sans-serif" font-size="11">${all[i]}</text></svg>`), left, top: top + 165 });
}
await sharp({ create: { width: 1100, height: 970, channels: 3, background: "#091c15" } }).composite(composites).jpeg({ quality: 88 }).toFile("artifacts/new-accessories.jpg");
console.log(`Created ${all.length} individual accessory images.`);
