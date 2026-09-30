import { formatPrice, FREE_SHIPPING_AT, SHIPPING_FEE, type Product } from "@/lib/catalog";

export const SHOP_WHATSAPP_NUMBER = "918822340240";
export type WhatsAppOrderItem = { name: string; price: number; quantity: number; details?: string };
export type WhatsAppOrderOptions = {
  items?: readonly WhatsAppOrderItem[];
  fulfillment?: "pickup" | "delivery";
  availabilityOnly?: boolean;
  orderReference?: string;
  orderTotal?: number;
  message?: string;
};
export function toWhatsAppItem(product: Product, quantity = 1): WhatsAppOrderItem {
  return { name: product.name, price: product.price, quantity, details: product.subtitle };
}
export function whatsappOrderMessage({ items = [], fulfillment, availabilityOnly = false, orderReference, orderTotal, message: customMessage }: WhatsAppOrderOptions = {}): string {
  if (customMessage) return customMessage;
  const validItems = items.filter(item => item.name && Number.isFinite(item.price) && item.price >= 0 && Number.isInteger(item.quantity) && item.quantity > 0);
  const message = ["Hello EXOTIC AQUARIUM HOUSE!", ""];
  if (orderReference) message.push(`I'd like to discuss my website order ${orderReference}.`);
  else if (availabilityOnly) message.push("Could you let me know when this product will be available?");
  else if (validItems.length) message.push("I'd like to request the following order:");
  else message.push("I'd like to place an order for fish, an aquarium, plants or accessories. Please help me choose and confirm availability.");
  if (validItems.length) {
    message.push("");
    validItems.forEach((item, index) => {
      message.push(`${index + 1}. ${item.name}`);
      if (item.details) message.push(`   ${item.details}`);
      if (!availabilityOnly) message.push(`   ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}`);
    });
    if (!availabilityOnly) {
      const subtotal = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      message.push("", `Estimated item subtotal: ${formatPrice(subtotal)}`);
      if (fulfillment === "delivery") {
        const fee = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;
        message.push(`Estimated local delivery: ${fee ? formatPrice(fee) : "Free"} (subject to coverage confirmation)`, `Estimated total: ${formatPrice(subtotal + fee)}`);
      }
    }
  }
  if (orderReference && typeof orderTotal === "number" && Number.isFinite(orderTotal)) message.push("", `Website order total: ${formatPrice(orderTotal)}`);
  if (!availabilityOnly) {
    message.push("");
    if (fulfillment === "pickup") message.push("Preference: Shop pickup in Sualkuchi. Payment at the shop.");
    else if (fulfillment === "delivery") message.push("Preference: Local delivery. Please confirm coverage and cash-on-delivery arrangements.");
    else message.push("Please let me know the shop-pickup and local-delivery options.");
    message.push("Please confirm availability, final pricing and safe transport before fulfilment.");
    if (!orderReference) message.push("This is an order request, not a confirmed or paid order.");
  }
  return message.join("\n");
}
export function whatsappOrderLink(options: WhatsAppOrderOptions = {}) {
  return `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappOrderMessage(options))}`;
}
export function whatsappBrowserLink(message: string) {
  return `https://api.whatsapp.com/send/?phone=${SHOP_WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
}
export function whatsappWebLink(message: string) {
  return `https://web.whatsapp.com/send?phone=${SHOP_WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
}
