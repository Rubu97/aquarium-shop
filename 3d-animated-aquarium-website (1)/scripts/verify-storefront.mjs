import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { config } from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { pgTable, text, integer, jsonb } from "drizzle-orm/pg-core";

config({ path: ".env" });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const productTable = pgTable("products", { id: text("id").primaryKey(), stock: integer("stock") });
const orderTable = pgTable("orders", { id: text("id").primaryKey(), name: text("customer_name"), items: jsonb("items") });
const requestTable = pgTable("aquarium_requests", { id: text("id").primaryKey(), name: text("customer_name"), config: jsonb("config"), estimate: integer("estimate") });
const subscriberTable = pgTable("subscribers", { email: text("email").primaryKey() });
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errors = [];
await mkdir("artifacts", { recursive: true });

async function whatsappMessage(locator) {
  const href = await locator.getAttribute("href");
  assert.ok(href);
  const url = new URL(href);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/918822340240");
  assert.equal(await locator.getAttribute("target"), "_blank");
  const message = url.searchParams.get("text");
  assert.ok(message?.startsWith("Hello EXOTIC AQUARIUM HOUSE!"));
  return message;
}
async function loadCollectionImages(page) {
  await page.evaluate(() => document.querySelectorAll(".product-card img").forEach(img => img.loading = "eager"));
  await page.waitForFunction(() => [...document.querySelectorAll(".product-card img")].every(img => img.complete && img.naturalWidth > 0));
}
async function contactRoutes(context) {
  // No external service is contacted or messaged during browser tests.
  for (const pattern of ["https://wa.me/**", "https://api.whatsapp.com/**", "https://web.whatsapp.com/**", "https://www.google.com/maps/**"]) {
    await context.route(pattern, route => route.fulfill({ status: 200, contentType: "text/html", body: "<title>External navigation verified</title><p>Browser handoff verified. No message sent.</p>" }));
  }
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
  await contactRoutes(context);
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.waitForTimeout(300);
  assert.equal(await page.locator(".product-card").count(), 4);
  assert.ok(await page.getByText("KAMAL JYOTI CHOUDHURY", { exact: true }).count());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: "artifacts/storefront-desktop.png" });
  const catalogue = await (await page.request.get(`${base}/api/products`)).json();
  assert.equal(catalogue.products.length, 67);
  assert.equal(catalogue.products.filter(p => p.category === "Fish").length, 18);
  assert.equal(catalogue.products.filter(p => p.category === "Plants").length, 18);
  assert.equal(catalogue.products.filter(p => p.category === "Accessories").length, 28);
  const newPlants = catalogue.products.filter(p => p.image.startsWith("/images/plants/"));
  const newAccessories = catalogue.products.filter(p => p.image.startsWith("/images/accessories/"));
  assert.equal(newPlants.length, 15); assert.equal(newAccessories.length, 25);
  assert.equal(new Set(newPlants.map(p => p.image)).size, 15);
  assert.equal(new Set(newAccessories.map(p => p.image)).size, 25);
  assert.ok([...newPlants, ...newAccessories].every(p => p.price > 0 && p.stock > 0 && p.care));
  console.log("PASS Database catalogue: 18 fish, 18 plants, 28 accessories and 3 ready-made tanks");

  await page.getByRole("button", { name: "Plants", exact: true }).click();
  assert.equal(await page.locator(".product-card").count(), 18);
  await loadCollectionImages(page);
  await page.locator(".shop-section").screenshot({ path: "artifacts/plants-collection.png" });
  await page.getByRole("button", { name: "View Amazon Sword", exact: true }).click();
  assert.match(await page.locator(".detail-price").textContent(), /199/);
  await page.locator(".photo-credit").waitFor();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Accessories", exact: true }).click();
  assert.equal(await page.locator(".product-card").count(), 28);
  await loadCollectionImages(page);
  await page.locator(".shop-section").screenshot({ path: "artifacts/accessories-collection.png" });
  for (const name of ["Red Lava Rock", "White Aquarium Sand", "Spider Driftwood", "Single Sponge Filter", "Double Sponge Filter", "Internal Power Filter", "Hang-on-Back Filter", "Large Canister Filter", "Aquarium Top Filter", "Undergravel Filter Plate"]) assert.ok(await page.getByRole("button", { name: `View ${name}`, exact: true }).count());
  console.log("PASS Fifteen new plants and twenty-five accessories with unique loading images and prices");

  await page.getByRole("link", { name: "Get directions", exact: true }).click();
  const directions = page.getByRole("dialog", { name: "Directions to Exotic Aquarium House", exact: true });
  await directions.waitFor();
  const mapLink = directions.locator("[data-external-directions]");
  const mapUrl = new URL(await mapLink.getAttribute("href"));
  assert.equal(mapUrl.hostname, "www.google.com");
  assert.equal(mapUrl.pathname, "/maps/dir/");
  assert.equal(mapUrl.searchParams.get("api"), "1");
  assert.equal(mapUrl.searchParams.get("destination"), "26.1673526,91.5608686");
  assert.equal(await directions.getByRole("link", { name: "Original location link" }).getAttribute("href"), "https://maps.app.goo.gl/SyAZnxWmk8oprgHPA");
  await directions.getByRole("button", { name: "Copy directions link", exact: true }).click();
  await directions.getByRole("button", { name: "Copied", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), mapUrl.href);
  const mapPopupPromise = page.waitForEvent("popup");
  await mapLink.click(); const mapPopup = await mapPopupPromise;
  await mapPopup.waitForLoadState("domcontentloaded");
  assert.equal(new URL(mapPopup.url()).searchParams.get("destination"), "26.1673526,91.5608686");
  await mapPopup.close();
  await directions.getByRole("button", { name: "Close dialog", exact: true }).click();
  console.log("PASS Exact saved location pin, direct Maps directions, original link and copy fallback");

  await page.getByRole("button", { name: "Fish", exact: true }).click();
  await page.getByRole("button", { name: "View Fancy Guppy", exact: true }).click();
  await page.getByRole("button", { name: "Increase quantity", exact: true }).click();
  const productMessage = await whatsappMessage(page.locator(".product-detail-whatsapp"));
  assert.match(productMessage, /2 × ₹120 = ₹240/);
  await page.locator(".product-detail-whatsapp").click();
  const whatsapp = page.getByRole("dialog", { name: "Send your WhatsApp order", exact: true });
  await whatsapp.waitFor();
  assert.equal(await whatsapp.getByRole("textbox", { name: "Your WhatsApp order message" }).inputValue(), productMessage);
  await whatsapp.getByRole("button", { name: "Copy order message", exact: true }).click();
  await whatsapp.getByRole("button", { name: "Copied", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), productMessage);
  const apiUrl = new URL(await whatsapp.locator("[data-external-whatsapp]").getAttribute("href"));
  assert.equal(apiUrl.hostname, "api.whatsapp.com");
  assert.equal(apiUrl.searchParams.get("phone"), "918822340240");
  assert.equal(apiUrl.searchParams.get("text"), productMessage);
  const webUrl = new URL(await whatsapp.locator("[data-whatsapp-web]").getAttribute("href"));
  assert.equal(webUrl.hostname, "web.whatsapp.com");
  assert.equal(webUrl.searchParams.get("phone"), "918822340240");
  await page.screenshot({ path: "artifacts/whatsapp-fallback.png" });
  const chatPopupPromise = page.waitForEvent("popup");
  await whatsapp.locator("[data-external-whatsapp]").click(); const chatPopup = await chatPopupPromise;
  await chatPopup.waitForLoadState("domcontentloaded");
  assert.equal(new URL(chatPopup.url()).searchParams.get("text"), productMessage);
  await chatPopup.close();
  await page.keyboard.press("Escape");
  assert.equal(await whatsapp.count(), 0);
  assert.equal(await page.getByRole("dialog", { name: "Fancy Guppy", exact: true }).count(), 1);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  console.log("PASS WhatsApp message review, correct number, app/Web links, copy and nested-dialog keyboard handling");

  await page.getByRole("button", { name: "Add Koi Halfmoon Betta to bag", exact: true }).click();
  await page.getByRole("button", { name: "Open shopping bag with 1 items", exact: true }).click();
  await page.getByRole("button", { name: "Increase Koi Halfmoon Betta quantity", exact: true }).click();
  assert.match(await whatsappMessage(page.locator(".cart-footer .button-whatsapp")), /2 × ₹450 = ₹900/);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  assert.match(await whatsappMessage(page.locator(".floating-whatsapp")), /Estimated item subtotal: ₹900/);
  await page.getByRole("button", { name: "Open shopping bag with 2 items", exact: true }).click();
  await page.getByRole("button", { name: "Continue to checkout", exact: true }).click();
  await page.locator('.checkout-form input[name="name"]').fill("Preview Test");
  await page.locator('.checkout-form input[name="phone"]').fill("9000000000");
  const orderResponse = page.waitForResponse(r => r.url().endsWith("/api/orders") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Place order request", exact: true }).click();
  const savedOrder = await (await orderResponse).json();
  assert.equal(savedOrder.order.total, 900);
  await page.getByText("Thank you for your order!", { exact: true }).waitFor();
  assert.ok((await whatsappMessage(page.locator(".order-success .button-whatsapp"))).includes(savedOrder.order.id));
  await page.getByRole("button", { name: "Keep exploring", exact: true }).click();
  assert.equal(await page.locator(".bag-count").textContent(), "0");
  console.log("PASS Persistent cart, unchanged database checkout and order-reference WhatsApp follow-up");

  await page.getByRole("button", { name: "Build your aquarium", exact: true }).click();
  await page.locator(".scene-container canvas").waitFor({ timeout: 30000 });
  for (const mm of [6, 8, 10, 12]) {
    await page.getByRole("button", { name: `${mm} mm glass`, exact: true }).click();
    assert.equal(await page.getByRole("button", { name: `${mm} mm glass`, exact: true }).getAttribute("aria-pressed"), "true");
  }
  await page.getByRole("combobox", { name: "Choose fish", exact: true }).selectOption("goldfish");
  await page.getByRole("spinbutton", { name: "Tank length in feet", exact: true }).fill("4");
  await page.getByRole("spinbutton", { name: "Tank width in feet", exact: true }).fill("1.5");
  await page.getByRole("spinbutton", { name: "Tank height in feet", exact: true }).fill("1.5");
  await page.getByRole("button", { name: /Wild & rocky/ }).click();
  assert.match(await page.locator(".preview-tags").textContent(), /4 × 1.5 × 1.5 ft/);
  assert.match(await page.locator(".preview-tags").textContent(), /12 mm glass/);
  assert.match(await page.locator(".estimate-box strong").textContent(), /17,746/);
  const designMessage = await whatsappMessage(page.locator(".builder-whatsapp"));
  assert.match(designMessage, /4 × 1.5 × 1.5 ft/); assert.match(designMessage, /12 mm glass/);
  await page.getByRole("button", { name: "Pause aquarium animation", exact: true }).click();
  await page.screenshot({ path: "artifacts/custom-feet-glass-builder.png" });
  await page.getByRole("button", { name: "Make it happen", exact: true }).click();
  await page.locator('.builder-contact input[name="name"]').fill("Preview Test");
  await page.locator('.builder-contact input[name="phone"]').fill("9000000000");
  const designResponse = page.waitForResponse(r => r.url().endsWith("/api/aquarium-requests") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Request my custom aquarium", exact: true }).click();
  const design = await (await designResponse).json();
  assert.equal(design.request.estimate, 17746);
  assert.deepEqual(design.request.config.dimensionsFeet, { length: 4, width: 1.5, height: 1.5 });
  assert.equal(design.request.config.glassThickness, 12);
  const storedDesign = await db.select().from(requestTable).where(eq(requestTable.id, design.request.id));
  assert.equal(storedDesign[0].config.glassThickness, 12);
  assert.deepEqual(storedDesign[0].config.dimensionsFeet, { length: 4, width: 1.5, height: 1.5 });
  await page.getByText("Your little world is taking shape.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Back to the little wonders", exact: true }).click();
  console.log("PASS Real-time 3D proportions, 6/8/10/12 mm options, price estimate and persisted feet/glass enquiry");

  const goodConfig = { purpose: "new", size: "custom", dimensionsFeet: { length: 2, width: 1, height: 1.25 }, glassThickness: 8, style: "nature", fish: "community", extras: [] };
  for (const invalid of [
    { ...goodConfig, glassThickness: 4 },
    { ...goodConfig, dimensionsFeet: { length: 99, width: 1, height: 1 } },
    { ...goodConfig, dimensionsFeet: { length: "2", width: 1, height: 1 } },
    { ...goodConfig, dimensionsFeet: { length: 1, width: 0.5, height: 0.5 }, fish: "goldfish" },
    { ...goodConfig, dimensionsFeet: null },
  ]) {
    const response = await page.request.post(`${base}/api/aquarium-requests`, { data: { name: "Preview Test", phone: "9000000000", config: invalid } });
    assert.equal(response.status(), 400);
  }
  const combinedOrder = await page.request.post(`${base}/api/orders`, { data: { name: "Preview Test", phone: "9000000000", fulfillment: "pickup", items: [{ productId: "amazon-sword", quantity: 2 }, { productId: "lava-rock", quantity: 1 }, { productId: "hang-on-back-filter", quantity: 1 }], total: 1 } });
  assert.equal(combinedOrder.status(), 201); assert.equal((await combinedOrder.json()).order.total, 1496);
  const upgrade = await page.request.post(`${base}/api/aquarium-requests`, { data: { name: "Preview Test", phone: "9000000000", config: { ...goodConfig, purpose: "upgrade" }, estimate: 1 } });
  assert.equal(upgrade.status(), 201); assert.equal((await upgrade.json()).request.estimate, 1979);
  await page.locator('.newsletter-form input[name="email"]').fill("aquarium-preview-test@example.com");
  await page.getByRole("button", { name: "Subscribe to the newsletter", exact: true }).click();
  await page.locator(".newsletter-message.success").waitFor();
  console.log("PASS New plant/accessory orders, server-calculated prices, invalid tank rejection, upgrades and newsletter");

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await contactRoutes(mobileContext);
  const mobile = await mobileContext.newPage();
  mobile.on("pageerror", error => errors.push(error.message));
  await mobile.goto(base, { waitUntil: "networkidle" });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await mobile.locator(".floating-whatsapp").click();
  const mobileWhatsapp = mobile.getByRole("dialog", { name: "Send your WhatsApp order", exact: true });
  await mobileWhatsapp.waitFor();
  await mobile.screenshot({ path: "artifacts/mobile-whatsapp-panel.png" });
  await mobileWhatsapp.getByRole("button", { name: "Close dialog", exact: true }).click();
  await mobile.getByRole("link", { name: "Get directions", exact: true }).click();
  const mobileDirections = mobile.getByRole("dialog", { name: "Directions to Exotic Aquarium House", exact: true });
  await mobileDirections.waitFor();
  assert.ok(await mobileDirections.getByRole("button", { name: "Copy directions link", exact: true }).count());
  await mobileDirections.getByRole("button", { name: "Close dialog", exact: true }).click();
  await mobile.getByRole("button", { name: "Open navigation", exact: true }).click();
  await mobile.locator(".mobile-nav").getByRole("button", { name: "Build your aquarium", exact: true }).click();
  await mobile.locator(".scene-container canvas").waitFor();
  await mobile.getByRole("spinbutton", { name: "Tank length in feet", exact: true }).fill("3.5");
  await mobile.getByRole("button", { name: "10 mm glass", exact: true }).click();
  await mobile.getByRole("button", { name: "Make it happen", exact: true }).click();
  assert.match(await mobile.locator(".builder-contact").textContent(), /3.5 × 1 × 1.25 ft · 10 mm glass/);
  await mobile.screenshot({ path: "artifacts/mobile-glass-builder.png" });
  await mobile.getByRole("button", { name: "Close dialog", exact: true }).click();
  await mobile.getByRole("button", { name: "Plants", exact: true }).click();
  assert.equal(await mobile.locator(".product-card").count(), 18);
  await mobile.getByRole("button", { name: "Accessories", exact: true }).click();
  assert.equal(await mobile.locator(".product-card").count(), 28);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  console.log("PASS Mobile collections, directions/WhatsApp fallbacks and custom feet/mm controls");
  assert.deepEqual(errors, [], `Browser errors: ${errors.join(", ")}`);
  console.log("PASS No browser runtime errors; no real WhatsApp messages sent");
} finally {
  await browser.close();
  await db.transaction(async tx => {
    const testOrders = await tx.select().from(orderTable).where(eq(orderTable.name, "Preview Test"));
    for (const order of testOrders) for (const item of order.items || []) await tx.update(productTable).set({ stock: sql`${productTable.stock} + ${item.quantity}` }).where(eq(productTable.id, item.productId));
    await tx.delete(orderTable).where(eq(orderTable.name, "Preview Test"));
    await tx.delete(requestTable).where(eq(requestTable.name, "Preview Test"));
    await tx.delete(subscriberTable).where(eq(subscriberTable.email, "aquarium-preview-test@example.com"));
  });
  await pool.end();
  console.log("Removed preview test data and restored inventory.");
}
