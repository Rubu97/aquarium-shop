import { db } from "@/db";
import { products } from "@/db/schema";
import { productSeeds, type Product } from "@/lib/catalog";

export async function getCatalog(): Promise<Product[]> {
  try {
    await db.insert(products).values(productSeeds).onConflictDoNothing();
    const rows = await db.select().from(products);
    return rows.sort((a, b) => productSeeds.findIndex(p => p.id === a.id) - productSeeds.findIndex(p => p.id === b.id)) as Product[];
  } catch (error) {
    // The catalogue remains browsable while the initial database is being provisioned.
    console.error("Catalogue database unavailable:", error instanceof Error ? error.message : error);
    return productSeeds;
  }
}
