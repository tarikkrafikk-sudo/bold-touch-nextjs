import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Falls back to the literal string so this works even before
// WHATSAPP_VERIFY_TOKEN is added in Vercel — but once it's added there,
// that value wins, so the two should always match whatever token is
// entered in the Meta developer console's "Verify token" field.
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "Boldtouch123";

// Meta calls this once, when you click "Verify and save" on the
// developers.facebook.com webhook config screen, to confirm you control
// this URL. It must echo back hub.challenge as plain text with a 200.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified.");
    return new Response(challenge, { status: 200 });
  }

  console.error("WhatsApp webhook verification failed:", { mode, token });
  return new Response("Forbidden", { status: 403 });
}

// Meta calls this every time something happens on the subscribed WhatsApp
// number — an incoming message, a delivery/read status update, etc. Must
// always answer 200 quickly (Meta disables the webhook after repeated
// failures/timeouts), so this logs and acks first; real auto-reply logic
// goes in the TODO block below, as a separate async step.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Not valid JSON — still ack so Meta doesn't retry/disable the webhook.
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  console.log("WhatsApp webhook event:", JSON.stringify(body));

  // TODO (next step, once this is confirmed working): parse the incoming
  // message and auto-reply with product info / prices / order status.
  // Shape of an incoming text message, for reference:
  //   body.entry[0].changes[0].value.messages[0] = {
  //     from: "2126XXXXXXXX",       // sender's WhatsApp number
  //     type: "text",
  //     text: { body: "..." },
  //   }
  // To reply, POST to:
  //   https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages
  //   Authorization: Bearer ${WHATSAPP_TOKEN}
  //   { messaging_product: "whatsapp", to: <from>, type: "text", text: { body: "..." } }
  // (same credentials already used by app/api/send-whatsapp/route.ts)

  try {
    const entry = (body as any)?.entry?.[0];
    const value = entry?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (message) {
      console.log("Incoming WhatsApp message from", message.from, ":", message.text?.body ?? `[${message.type}]`);
    }
  } catch (err) {
    console.error("Webhook payload parse error:", err);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}
