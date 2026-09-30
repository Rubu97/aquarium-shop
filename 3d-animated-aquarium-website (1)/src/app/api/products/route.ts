import { getCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ products: await getCatalog() });
}
