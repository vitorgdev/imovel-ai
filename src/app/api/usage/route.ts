import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";

const FREE_LIMIT = 3;

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ used: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT });
  }

  const db = await getDb();
  const used = await db.collection("analyses").countDocuments({ userId });

  return Response.json({
    used,
    limit: FREE_LIMIT,
    remaining: Math.max(0, FREE_LIMIT - used),
  });
}
