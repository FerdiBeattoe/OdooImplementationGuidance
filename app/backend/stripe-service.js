import Stripe from "stripe";

import {
  createLicence,
  getLicenceConfig,
  getPrice,
  getRemainingEarlyAdopterSlots,
  isEarlyAdopter,
} from "./licence-service.js";

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return typeof secretKey === "string" && secretKey.trim() !== ""
    ? secretKey.trim()
    : null;
}

function getWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  return typeof webhookSecret === "string" && webhookSecret.trim() !== ""
    ? webhookSecret.trim()
    : null;
}

function getStripeClient() {
  const secretKey = getStripeSecretKey();
  return secretKey ? new Stripe(secretKey) : null;
}

function parseWebhookPayload(payload) {
  if (Buffer.isBuffer(payload)) {
    return JSON.parse(payload.toString("utf8"));
  }

  if (typeof payload === "string") {
    return JSON.parse(payload);
  }

  return payload;
}

export async function createPaymentIntent(projectId) {
  if (typeof projectId !== "string" || projectId.trim() === "") {
    throw new Error("projectId is required.");
  }

  const normalizedProjectId = projectId.trim();
  const config = await getLicenceConfig();
  const price = await getPrice();
  const earlyAdopter = await isEarlyAdopter();
  const remainingSlots = await getRemainingEarlyAdopterSlots();
  const metadata = {
    project_id: normalizedProjectId,
    early_adopter: String(earlyAdopter),
    price: price.toFixed(2),
    licence_duration_days: String(config.duration_days),
  };

  const stripe = getStripeClient();
  if (!stripe) {
    return {
      id: `mock_pi_${normalizedProjectId}`,
      client_secret: "mock_secret_test",
      price,
      early_adopter: earlyAdopter,
      remaining_slots: remainingSlots,
      currency: config.currency,
      metadata,
      mock: true,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(price * 100),
    currency: config.currency.toLowerCase(),
    metadata,
  });

  return {
    id: paymentIntent.id,
    client_secret: paymentIntent.client_secret,
    price,
    early_adopter: earlyAdopter,
    remaining_slots: remainingSlots,
    currency: config.currency,
    metadata,
    mock: false,
  };
}

export async function confirmPayment(paymentIntentId) {
  if (typeof paymentIntentId !== "string" || paymentIntentId.trim() === "") {
    throw new Error("paymentIntentId is required.");
  }

  const normalizedPaymentIntentId = paymentIntentId.trim();
  const stripe = getStripeClient();
  if (!stripe) {
    return {
      id: normalizedPaymentIntentId,
      status: "succeeded",
      mock: true,
    };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(normalizedPaymentIntentId);
  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    metadata: paymentIntent.metadata ?? {},
    mock: false,
  };
}

export async function handleWebhook(payload, signature) {
  const stripe = getStripeClient();
  let event;

  if (!stripe) {
    event = parseWebhookPayload(payload);
  } else {
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is required when Stripe is enabled.");
    }
    if (typeof signature !== "string" || signature.trim() === "") {
      throw new Error("Stripe signature is required.");
    }

    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  if (event?.type !== "payment_intent.succeeded") {
    return {
      ok: true,
      handled: false,
      event_type: event?.type ?? null,
    };
  }

  const paymentIntent = event.data?.object ?? {};
  const projectId = paymentIntent.metadata?.project_id;
  if (typeof projectId !== "string" || projectId.trim() === "") {
    throw new Error("payment_intent metadata.project_id is required.");
  }

  const licence = await createLicence(projectId, paymentIntent.id);
  return {
    ok: true,
    handled: true,
    event_type: event.type,
    payment_intent_id: paymentIntent.id,
    licence,
  };
}
