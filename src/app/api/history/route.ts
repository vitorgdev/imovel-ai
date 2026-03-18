import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }

    const db = await getDb();
    const analyses = await db
      .collection("analyses")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return Response.json(analyses);
  } catch (error) {
    console.error("History error:", error);
    return Response.json({ error: "Erro ao buscar histórico" }, { status: 500 });
  }
}
