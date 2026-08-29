import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { normalizeAiAccessProductScope } from "@/lib/billing/ai-access-packages";
import { sendPaymentReceiptEmail } from "@/lib/billing/payment-receipt-email";
import { getTuitionPackage } from "@/lib/billing/tuition-packages";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe/server";

export const runtime = "nodejs";

function getObjectId(value: string | { id?: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id ?? null;
}

function getSessionMetadata(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id || session.client_reference_id || "";
  const packageCode = session.metadata?.package_code || "";
  const accessDays = Number(session.metadata?.access_days);
  const productScope = normalizeAiAccessProductScope(session.metadata?.product_scope);

  return {
    userId,
    packageCode,
    accessDays,
    productScope,
  };
}

function isTuitionCheckoutSession(session: Stripe.Checkout.Session) {
  return session.metadata?.purchase_type === "tuition" || Boolean(getTuitionPackage(session.metadata?.package_code));
}

function getTuitionSessionMetadata(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id || session.client_reference_id || "";
  const packageCode = session.metadata?.package_code || "";
  const pkg = getTuitionPackage(packageCode);

  return {
    userId,
    pkg,
  };
}

async function getReceiptRecipient(userId: string, session: Stripe.Checkout.Session) {
  const sessionEmail = session.customer_details?.email ?? session.customer_email ?? null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle<{ full_name: string | null; email: string | null }>();

  return {
    email: sessionEmail ?? data?.email ?? null,
    name: data?.full_name ?? session.customer_details?.name ?? sessionEmail ?? data?.email ?? null,
  };
}

async function sendReceiptSafely(params: Parameters<typeof sendPaymentReceiptEmail>[0]) {
  const result = await sendPaymentReceiptEmail(params);
  if (!result.ok) {
    console.warn("Stripe receipt email skipped or failed:", result.error);
  }
}

async function markWebhookEvent(stripeEventId: string, values: { processedAt?: string | null; processingError?: string | null }) {
  const supabase = createAdminClient();

  await supabase
    .from("stripe_webhook_events")
    .update({
      processed_at: values.processedAt ?? null,
      processing_error: values.processingError ?? null,
    })
    .eq("stripe_event_id", stripeEventId);
}

async function recordWebhookEvent(event: Stripe.Event, payload: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stripe_webhook_events")
    .upsert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: JSON.parse(payload),
      processing_error: null,
    }, { onConflict: "stripe_event_id" });

  if (error) {
    throw new Error(`Failed to record Stripe webhook event: ${error.message}`);
  }
}

async function upsertBillingProfileFromSession(session: Stripe.Checkout.Session, userId: string, customerId: string | null) {
  if (!customerId) return;

  const supabase = createAdminClient();
  const { error: profileError } = await supabase
    .from("user_billing_profiles")
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      billing_email: session.customer_details?.email ?? session.customer_email ?? null,
    }, { onConflict: "user_id" });

  if (profileError) {
    throw new Error(`Failed to upsert billing profile: ${profileError.message}`);
  }
}

async function fulfillAiCheckoutSession(session: Stripe.Checkout.Session) {
  const { userId, packageCode, accessDays, productScope } = getSessionMetadata(session);

  if (!userId || !productScope || !packageCode || !Number.isFinite(accessDays)) {
    throw new Error(`Missing checkout metadata for session ${session.id}.`);
  }

  if (session.payment_status !== "paid") {
    return {
      ok: true,
      skipped: true,
      reason: `payment_status=${session.payment_status}`,
    };
  }

  const supabase = createAdminClient();
  const customerId = getObjectId(session.customer);
  const paymentIntentId = getObjectId(session.payment_intent);
  const { data: existingPurchase } = await supabase
    .from("ai_access_purchases")
    .select("status")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle<{ status: string | null }>();
  const shouldSendReceipt = !["fulfilled", "paid"].includes(String(existingPurchase?.status ?? ""));

  await upsertBillingProfileFromSession(session, userId, customerId);

  const { data, error } = await supabase.rpc("fulfill_ai_access_purchase_scoped", {
    p_user_id: userId,
    p_product_scope: productScope,
    p_package_code: packageCode,
    p_access_days: accessDays,
    p_stripe_checkout_session_id: session.id,
    p_stripe_customer_id: customerId,
    p_stripe_payment_intent_id: paymentIntentId,
    p_amount_total: session.amount_total,
    p_amount_subtotal: session.amount_subtotal,
    p_currency: session.currency ?? "aud",
    p_payment_status: session.payment_status,
    p_metadata: {
      checkout_session_id: session.id,
      product_scope: productScope,
      payment_method_collection: session.payment_method_collection,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    },
  });

  if (error) {
    throw new Error(`Failed to fulfill AI access purchase: ${error.message}`);
  }

  if (shouldSendReceipt) {
    const recipient = await getReceiptRecipient(userId, session);
    await sendReceiptSafely({
      to: recipient.email,
      studentName: recipient.name,
      receiptTitle: `${productScope.toUpperCase()} AI Access Receipt`,
      receiptType: "AI Access",
      checkoutSessionId: session.id,
      paymentIntentId,
      paidAt: new Date(),
      amountAudCents: session.amount_total,
      lineItems: [{
        label: `${productScope.toUpperCase()} AI Access`,
        description: `${accessDays} days one-time AI access package`,
        quantity: "1",
        amountAudCents: session.amount_total ?? 0,
      }],
    });
  }

  return data;
}

async function fulfillTuitionCheckoutSession(session: Stripe.Checkout.Session) {
  const { userId, pkg } = getTuitionSessionMetadata(session);

  if (!userId || !pkg) {
    throw new Error(`Missing tuition checkout metadata for session ${session.id}.`);
  }

  if (session.payment_status !== "paid") {
    return {
      ok: true,
      skipped: true,
      reason: `payment_status=${session.payment_status}`,
    };
  }

  const supabase = createAdminClient();
  const customerId = getObjectId(session.customer);
  const paymentIntentId = getObjectId(session.payment_intent);
  const { data: existingPayment } = await supabase
    .from("tuition_payments")
    .select("status")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle<{ status: string | null }>();
  const shouldSendReceipt = String(existingPayment?.status ?? "") !== "paid";

  await upsertBillingProfileFromSession(session, userId, customerId);

  const { data, error } = await supabase.rpc("fulfill_tuition_payment", {
    p_user_id: userId,
    p_package_code: pkg.code,
    p_package_label: pkg.label,
    p_lesson_count: pkg.lessonCount,
    p_total_hours: pkg.totalHours,
    p_stripe_checkout_session_id: session.id,
    p_stripe_customer_id: customerId,
    p_stripe_payment_intent_id: paymentIntentId,
    p_amount_total: session.amount_total,
    p_amount_subtotal: session.amount_subtotal,
    p_currency: session.currency ?? "aud",
    p_payment_status: session.payment_status,
    p_metadata: {
      checkout_session_id: session.id,
      purchase_type: "tuition",
      payment_method_collection: session.payment_method_collection,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    },
  });

  if (error) {
    throw new Error(`Failed to fulfill tuition payment: ${error.message}`);
  }

  if (shouldSendReceipt) {
    const recipient = await getReceiptRecipient(userId, session);
    await sendReceiptSafely({
      to: recipient.email,
      studentName: recipient.name,
      receiptTitle: "Tuition Payment Receipt",
      receiptType: "Tuition",
      checkoutSessionId: session.id,
      paymentIntentId,
      paidAt: new Date(),
      amountAudCents: session.amount_total,
      lineItems: [{
        label: `${pkg.label} Tuition`,
        description: `${pkg.lessonCount} lesson(s), ${pkg.totalHours} hour(s)`,
        quantity: "1",
        amountAudCents: session.amount_total ?? pkg.amountAudCents,
      }],
    });
  }

  return data;
}

async function markAiCheckoutSessionStatus(session: Stripe.Checkout.Session, status: "cancelled" | "failed") {
  const supabase = createAdminClient();

  await supabase
    .from("ai_access_purchases")
    .update({
      status,
      stripe_payment_status: session.payment_status,
    })
    .eq("stripe_checkout_session_id", session.id)
    .eq("status", "pending");
}

async function markTuitionCheckoutSessionStatus(session: Stripe.Checkout.Session, status: "cancelled" | "failed") {
  const supabase = createAdminClient();
  const timestampColumn = status === "cancelled" ? "cancelled_at" : "failed_at";

  await supabase
    .from("tuition_payments")
    .update({
      status,
      stripe_payment_status: session.payment_status,
      [timestampColumn]: new Date().toISOString(),
    })
    .eq("stripe_checkout_session_id", session.id)
    .eq("status", "pending");
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (isTuitionCheckoutSession(session)) {
    return fulfillTuitionCheckoutSession(session);
  }

  return fulfillAiCheckoutSession(session);
}

async function markCheckoutSessionStatus(session: Stripe.Checkout.Session, status: "cancelled" | "failed") {
  if (isTuitionCheckoutSession(session)) {
    await markTuitionCheckoutSessionStatus(session, status);
    return;
  }

  await markAiCheckoutSessionStatus(session, status);
}

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ ok: false, message: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ ok: false, message: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    await recordWebhookEvent(event, payload);

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "checkout.session.expired": {
        await markCheckoutSessionStatus(event.data.object as Stripe.Checkout.Session, "cancelled");
        break;
      }
      case "checkout.session.async_payment_failed": {
        await markCheckoutSessionStatus(event.data.object as Stripe.Checkout.Session, "failed");
        break;
      }
      default:
        break;
    }

    await markWebhookEvent(event.id, { processedAt: new Date().toISOString(), processingError: null });

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stripe webhook error.";
    console.error("Stripe webhook processing error:", message);
    await markWebhookEvent(event.id, { processedAt: null, processingError: message });

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
