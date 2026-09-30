import { pgTable, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import type { AquariumConfig, OrderLine } from "@/lib/catalog";

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  image: text("image").notNull(),
  badge: text("badge"),
  rating: real("rating").notNull().default(4.8),
  stock: integer("stock").notNull().default(20),
  care: text("care").notNull(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  fulfillment: text("fulfillment").notNull(),
  address: text("address"),
  postcode: text("postcode"),
  items: jsonb("items").$type<OrderLine[]>().notNull(),
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  total: integer("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending_confirmation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aquariumRequests = pgTable("aquarium_requests", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  config: jsonb("config").$type<AquariumConfig>().notNull(),
  estimate: integer("estimate").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscribers = pgTable("subscribers", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
