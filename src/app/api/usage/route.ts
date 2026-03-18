import { auth } from "@clerk/nextjs/server";
import { getUserUsage } from "@/lib/user";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ plan: "free", planName: "Free", used: 0, limit: 3, remaining: 3 });
  }

  const usage = await getUserUsage(userId);
  return Response.json(usage);
}
