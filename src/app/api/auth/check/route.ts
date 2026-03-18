import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";

const FREE_LIMIT = 3;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json(
      { authenticated: false, used: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT },
      { headers: CORS_HEADERS }
    );
  }

  const db = await getDb();
  const used = await db.collection("analyses").countDocuments({ userId });

  return Response.json(
    {
      authenticated: true,
      userId,
      used,
      limit: FREE_LIMIT,
      remaining: Math.max(0, FREE_LIMIT - used),
    },
    { headers: CORS_HEADERS }
  );
}
