import { db } from "@/db";
import { subscribers } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const email = typeof data?.email === "string" ? data.email.trim().toLowerCase() : "";
    if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    await db.insert(subscribers).values({ email }).onConflictDoNothing();
    return Response.json({ message: "You’re on the list. A little wonder is coming your way!" });
  } catch {
    return Response.json({ error: "Unable to subscribe right now. Please try again." }, { status: 500 });
  }
}
