import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { aquariumRequests } from "@/db/schema";
import { aquariumEstimate, extraOptions, fishOptions, styleOptions, type AquariumConfig } from "@/lib/catalog";
import { aquariumConfigError, type GlassThickness, type TankDimensions } from "@/lib/aquarium";
import { cleanText, validateContact } from "@/lib/validation";

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try { data = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!data || typeof data !== "object") return Response.json({ error: "Invalid request." }, { status: 400 });
  const contact = validateContact(data);
  if ("error" in contact) return Response.json({ error: contact.error }, { status: 400 });
  const input = data.config as Record<string, unknown> | undefined;
  if (!input || typeof input !== "object" || !["new", "upgrade"].includes(input.purpose as string) || !["nano", "classic", "landscape", "custom"].includes(input.size as string) || !styleOptions.some(x => x.id === input.style) || !fishOptions.some(x => x.id === input.fish) || !Array.isArray(input.extras) || input.extras.length > extraOptions.length || input.extras.some(id => !extraOptions.some(x => x.id === id))) {
    return Response.json({ error: "Please choose valid aquarium options." }, { status: 400 });
  }
  let dimensionsFeet: TankDimensions | undefined;
  if (input.dimensionsFeet !== undefined) {
    if (!input.dimensionsFeet || typeof input.dimensionsFeet !== "object") return Response.json({ error: "Please choose valid tank dimensions in feet." }, { status: 400 });
    const dimensions = input.dimensionsFeet as Record<string, unknown>;
    dimensionsFeet = { length: dimensions.length as number, width: dimensions.width as number, height: dimensions.height as number };
  }
  const safeConfig: AquariumConfig = {
    purpose: input.purpose as AquariumConfig["purpose"], size: input.size as AquariumConfig["size"],
    style: input.style as AquariumConfig["style"], fish: input.fish as AquariumConfig["fish"],
    extras: [...new Set(input.extras as string[])],
    ...(dimensionsFeet ? { dimensionsFeet } : {}),
    ...(input.glassThickness !== undefined ? { glassThickness: input.glassThickness as GlassThickness } : {}),
  };
  const error = aquariumConfigError(safeConfig);
  if (error) return Response.json({ error }, { status: 400 });
  const estimate = aquariumEstimate(safeConfig);
  try {
    const id = `CUSTOM-${randomUUID().slice(0, 8).toUpperCase()}`;
    await db.insert(aquariumRequests).values({ id, customerName: contact.name, phone: contact.phone, email: contact.email || null, notes: cleanText(data.notes, 2000) || null, config: safeConfig, estimate });
    return Response.json({ request: { id, estimate, config: safeConfig } }, { status: 201 });
  } catch (error) {
    console.error("Aquarium enquiry:", error);
    return Response.json({ error: "We couldn’t save your request. Please try again or call 8822340240." }, { status: 500 });
  }
}
