import Storefront from "@/components/storefront";
import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getCatalog();
  return <Storefront initialProducts={products} />;
}
