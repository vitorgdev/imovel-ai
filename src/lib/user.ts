import { getDb } from "./mongodb";
import { stripe, getPlanByPriceId, PLANS, type PlanKey } from "./stripe";

export interface UserDoc {
  userId: string;
  plan: PlanKey;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getOrCreateUser(userId: string): Promise<UserDoc> {
  const db = await getDb();
  const users = db.collection<UserDoc>("users");

  const existing = await users.findOne({ userId });
  if (existing) return existing;

  const now = new Date();
  const newUser: UserDoc = {
    userId,
    plan: "free",
    createdAt: now,
    updatedAt: now,
  };
  await users.insertOne(newUser);
  return (await users.findOne({ userId }))!;
}

/**
 * Syncs the user's plan with Stripe if they have a customer ID.
 * This is a fallback in case the webhook didn't fire.
 */
async function syncPlanFromStripe(user: UserDoc): Promise<UserDoc> {
  if (!user.stripeCustomerId) return user;

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    const db = await getDb();

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      const priceId = sub.items.data[0]?.price.id;
      const plan = getPlanByPriceId(priceId) || "free";

      if (plan !== user.plan) {
        await db.collection("users").updateOne(
          { userId: user.userId },
          {
            $set: {
              plan,
              stripeSubscriptionId: sub.id,
              updatedAt: new Date(),
            },
          }
        );
        return { ...user, plan, stripeSubscriptionId: sub.id };
      }
    } else if (user.plan !== "free") {
      // No active subscriptions, revert to free
      await db.collection("users").updateOne(
        { userId: user.userId },
        { $set: { plan: "free" as PlanKey, updatedAt: new Date() } }
      );
      return { ...user, plan: "free" as PlanKey };
    }
  } catch (err) {
    console.error("Failed to sync plan from Stripe:", err);
  }

  return user;
}

export async function getUserUsage(userId: string) {
  let user = await getOrCreateUser(userId);

  // Sync with Stripe to ensure plan is up-to-date
  user = await syncPlanFromStripe(user);

  const plan = PLANS[user.plan];

  // Count analyses this billing period (current month)
  const db = await getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const used = await db.collection("analyses").countDocuments({
    userId,
    createdAt: { $gte: monthStart },
  });

  return {
    plan: user.plan,
    planName: plan.name,
    used,
    limit: plan.limit,
    remaining: Math.max(0, plan.limit - used),
  };
}
