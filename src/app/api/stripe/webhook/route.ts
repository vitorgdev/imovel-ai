import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = await getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;

      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanByPriceId(priceId) || "free";

        await db.collection("users").updateOne(
          { userId },
          {
            $set: {
              plan,
              stripeSubscriptionId: subscriptionId,
              updatedAt: new Date(),
            },
          }
        );
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      const priceId = subscription.items.data[0]?.price.id;
      const plan = getPlanByPriceId(priceId) || "free";

      if (userId) {
        const status = subscription.status;
        const isActive = status === "active" || status === "trialing";

        await db.collection("users").updateOne(
          { userId },
          {
            $set: {
              plan: isActive ? plan : "free",
              updatedAt: new Date(),
            },
          }
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await db.collection("users").updateOne(
          { userId },
          {
            $set: {
              plan: "free",
              stripeSubscriptionId: null,
              updatedAt: new Date(),
            },
          }
        );
      }
      break;
    }
  }

  return Response.json({ received: true });
}
