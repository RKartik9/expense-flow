import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { User, type UserDoc } from "@/lib/models/user";
import { Category, DEFAULT_CATEGORIES } from "@/lib/models/category";

export async function seedDefaultCategories(userId: string) {
  await Promise.all(
    DEFAULT_CATEGORIES.map((c) =>
      Category.updateOne(
        { userId, name: c.name },
        { $setOnInsert: { ...c, userId, isDefault: true } },
        { upsert: true }
      )
    )
  );
}

/**
 * Returns the MongoDB user for the signed-in Clerk user, creating it on first
 * access (fallback in case the Clerk webhook hasn't fired yet).
 * Throws if not authenticated.
 */
export async function requireUser(): Promise<UserDoc> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  await connectDB();
  let user = await User.findOne({ clerkId, deletedAt: null });
  if (!user) {
    const cu = await currentUser();
    if (!cu) throw new Error("Unauthorized");
    const email = cu.emailAddresses[0]?.emailAddress ?? `${clerkId}@unknown.local`;
    user = await User.findOneAndUpdate(
      { clerkId },
      {
        $setOnInsert: {
          clerkId,
          email: email.toLowerCase(),
          name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || email.split("@")[0],
          imageUrl: cu.imageUrl,
        },
      },
      { upsert: true, new: true }
    );
    await seedDefaultCategories(String(user!._id));
  } else {
    // Touch lastActiveAt at most once per hour (powers admin "active users" metric)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!user.lastActiveAt || user.lastActiveAt < hourAgo) {
      await User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } });
    }
  }
  return user!;
}

export async function requireAdmin(): Promise<UserDoc> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Forbidden: admin access required");
  return user;
}
