import { auth } from "@clerk/nextjs/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/user";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { plan } = (await request.json()) as { plan: PlanKey };

  if (plan !== "basic" && plan !== "pro") {
    return Response.json({ error: "Plano inválido" }, { status: 400 });
  }

  const priceId = PLANS[plan].priceId;
  if (!priceId) {
    return Response.json({ error: "Plano não configurado" }, { status: 400 });
  }

  const user = await getOrCreateUser(userId);

  // Reuse or create Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId },
    });
    customerId = customer.id;

    const db = await getDb();
    await db.collection("users").updateOne(
      { userId },
      { $set: { stripeCustomerId: customerId, updatedAt: new Date() } }
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${request.headers.get("origin")}/dashboard?success=true`,
    cancel_url: `${request.headers.get("origin")}/precos`,
    subscription_data: {
      metadata: { userId, plan },
    },
  });

  return Response.json({ url: session.url });
}
