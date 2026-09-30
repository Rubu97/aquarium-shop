import { randomUUID } from "node:crypto";
import { inArray, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { FREE_SHIPPING_AT, SHIPPING_FEE, type OrderLine } from "@/lib/catalog";
import { cleanText, validateContact } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try { data = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!data || typeof data !== "object") return Response.json({ error: "Invalid request." }, { status: 400 });
  const contact = validateContact(data);
  if ("error" in contact) return Response.json({ error: contact.error }, { status: 400 });
  if (data.fulfillment !== "pickup" && data.fulfillment !== "delivery") return Response.json({ error: "Please choose pickup or delivery." }, { status: 400 });
  const address = cleanText(data.address, 500);
  const postcode = cleanText(data.postcode, 6);
  if (data.fulfillment === "delivery" && (address.length < 10 || !/^[1-9]\d{5}$/.test(postcode))) {
    return Response.json({ error: "Please enter your full delivery address and a valid 6-digit PIN code." }, { status: 400 });
  }
  if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 30) return Response.json({ error: "Your cart is empty or invalid." }, { status: 400 });
  const quantities = new Map<string, number>();
  for (const item of data.items) {
    if (!item || typeof item.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return Response.json({ error: "Please check the quantities in your cart." }, { status: 400 });
    }
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (quantity > 20) return Response.json({ error: "You can order up to 20 of each product." }, { status: 400 });
    quantities.set(item.productId, quantity);
  }
  try {
    const result = await db.transaction(async tx => {
      const ids = [...quantities.keys()].sort();
      const available = await tx.select().from(products).where(inArray(products.id, ids)).orderBy(products.id).for("update");
      if (available.length !== ids.length) throw new Error("One of your products is no longer available.");
      const items: OrderLine[] = available.map(p => {
        const quantity = quantities.get(p.id)!;
        if (p.stock < quantity) throw new Error(`Only ${p.stock} ${p.name} available. Please update your cart.`);
        return { productId: p.id, name: p.name, price: p.price, quantity };
      });
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const deliveryFee = data.fulfillment === "pickup" || subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;
      const id = `EAH-${randomUUID().slice(0, 8).toUpperCase()}`;
      await tx.insert(orders).values({
        id, customerName: contact.name, phone: contact.phone, email: contact.email || null,
        fulfillment: data.fulfillment as string, address: address || null, postcode: postcode || null,
        items, subtotal, deliveryFee, total: subtotal + deliveryFee,
        paymentMethod: data.fulfillment === "pickup" ? "pay_at_shop" : "cash_on_delivery",
      });
      for (const item of items) {
        await tx.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` }).where(eq(products.id, item.productId));
      }
      return { id, total: subtotal + deliveryFee, fulfillment: data.fulfillment, status: "pending_confirmation" };
    });
    return Response.json({ order: result }, { status: 201 });
  } catch (error) {
    console.error("Order creation:", error);
    const message = error instanceof Error ? error.message : "";
    const stockError = message.includes("available");
    return Response.json({ error: stockError ? message : "We couldn’t save your order. Please try again or call 8822340240." }, { status: stockError ? 409 : 500 });
  }
}
