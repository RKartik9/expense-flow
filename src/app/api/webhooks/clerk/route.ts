import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { SplitParticipant } from "@/lib/models/split-participant";
import { GroupMember } from "@/lib/models/group-member";
import { seedDefaultCategories } from "@/lib/auth";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let evt: WebhookEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const data = evt.data;
    const email = data.email_addresses?.[0]?.email_address?.toLowerCase();
    if (!email) return NextResponse.json({ ok: true });

    const name =
      [data.first_name, data.last_name].filter(Boolean).join(" ") || email.split("@")[0];

    const user = await User.findOneAndUpdate(
      { clerkId: data.id },
      { $set: { email, name, imageUrl: data.image_url }, $setOnInsert: { clerkId: data.id } },
      { upsert: true, new: true }
    );

    if (evt.type === "user.created") {
      await seedDefaultCategories(String(user._id));
      // Link pending split shares and group invitations sent to this email
      await SplitParticipant.updateMany(
        { email, userId: null },
        { $set: { userId: user._id, name } }
      );
      await GroupMember.updateMany(
        { invitedEmail: email, userId: null },
        { $set: { userId: user._id, status: "active", joinedAt: new Date() } }
      );
    }
  }

  if (evt.type === "user.deleted") {
    await User.findOneAndUpdate({ clerkId: evt.data.id }, { $set: { deletedAt: new Date() } });
  }

  return NextResponse.json({ ok: true });
}
