import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/user";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await getOrCreateUser(userId);

  if (!user.stripeCustomerId) {
    return Response.json({ error: "Nenhuma assinatura encontrada" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${request.headers.get("origin")}/dashboard`,
  });

  return Response.json({ url: session.url });
}
