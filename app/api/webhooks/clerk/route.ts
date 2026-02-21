import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

// ============================================================
// Clerk Webhook — Sync users to MongoDB
// ============================================================

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("[Webhook] CLERK_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get the headers for verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[Webhook] Verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  await connectDB();

  const eventType = evt.type;

  switch (eventType) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;

      if (!primaryEmail) {
        return new Response("No email address found", { status: 400 });
      }

      await User.create({
        clerkId: id,
        email: primaryEmail,
        firstName: first_name || "",
        lastName: last_name || "",
        role: "dispatcher", // default role — admin can change later
        avatarUrl: image_url || "",
      });

      console.log(`[Webhook] User created: ${primaryEmail}`);
      break;
    }

    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          ...(primaryEmail && { email: primaryEmail }),
          firstName: first_name || "",
          lastName: last_name || "",
          avatarUrl: image_url || "",
        }
      );

      console.log(`[Webhook] User updated: ${id}`);
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;
      await User.findOneAndDelete({ clerkId: id });
      console.log(`[Webhook] User deleted: ${id}`);
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${eventType}`);
  }

  return new Response("OK", { status: 200 });
}
