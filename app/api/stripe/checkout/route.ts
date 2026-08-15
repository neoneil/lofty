import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { getServerUser } from "@/lib/auth/server-auth";
import { AI_ACCESS_PACKAGES, getAiAccessPackage } from "@/lib/billing/ai-access-packages";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";

export const runtime = "nodejs";

function getConfiguredPriceId(priceEnvVar: string) {
  return process.env[priceEnvVar]?.trim() || null;
}

function createLineItem(pkg: (typeof AI_ACCESS_PACKAGES)[number]): Stripe.Checkout.SessionCreateParams.LineItem {
  const configuredPriceId = getConfiguredPriceId(pkg.priceEnvVar);

  if (configuredPriceId) {
    return {
      price: configuredPriceId,
      quantity: 1,
    };
  }

  return {
    quantity: 1,
    price_data: {
      currency: "aud",
      unit_amount: pkg.amountAudCents,
      product_data: {
        name: pkg.label,
        description: "LoftyPTE AI 学习助手一次性时间包",
        metadata: {
          package_code: pkg.code,
          access_days: String(pkg.days),
        },
      },
    },
  };
}

export async function POST(req: Request) {
  const context = await getServerUser();

  if (!context) {
    return NextResponse.json({ ok: false, message: "请先登录后再购买。" }, { status: 401 });
  }

  let packageCode = "";

  try {
    const body = await req.json() as { packageCode?: string };
    packageCode = body.packageCode ?? "";
  } catch {
    return NextResponse.json({ ok: false, message: "请求格式不正确。" }, { status: 400 });
  }

  const pkg = getAiAccessPackage(packageCode);

  if (!pkg) {
    return NextResponse.json({ ok: false, message: "请选择有效的 AI 时间包。" }, { status: 400 });
  }

  const stripe = getStripeClient();
  const adminSupabase = createAdminClient();
  const origin = getAppOrigin(req);
  const userEmail = context.user.email ?? undefined;

  const { data: billingProfile, error: profileLoadError } = await adminSupabase
    .from("user_billing_profiles")
    .select("stripe_customer_id, billing_email")
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (profileLoadError) {
    console.error("Stripe billing profile load error:", profileLoadError);
    return NextResponse.json({ ok: false, message: "读取支付资料失败，请稍后再试。" }, { status: 500 });
  }

  let stripeCustomerId = billingProfile?.stripe_customer_id ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        user_id: context.user.id,
      },
    });

    stripeCustomerId = customer.id;

    const { error: profileSaveError } = await adminSupabase
      .from("user_billing_profiles")
      .upsert({
        user_id: context.user.id,
        stripe_customer_id: stripeCustomerId,
        billing_email: userEmail ?? billingProfile?.billing_email ?? null,
      }, { onConflict: "user_id" });

    if (profileSaveError) {
      console.error("Stripe billing profile save error:", profileSaveError);
      return NextResponse.json({ ok: false, message: "保存支付资料失败，请稍后再试。" }, { status: 500 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    client_reference_id: context.user.id,
    line_items: [createLineItem(pkg)],
    success_url: `${origin}/settings/ai-usage?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/settings/ai-usage?payment=cancelled`,
    metadata: {
      user_id: context.user.id,
      package_code: pkg.code,
      access_days: String(pkg.days),
    },
    payment_intent_data: {
      metadata: {
        user_id: context.user.id,
        package_code: pkg.code,
        access_days: String(pkg.days),
      },
    },
  });

  const { error: purchaseError } = await adminSupabase
    .from("ai_access_purchases")
    .insert({
      user_id: context.user.id,
      package_code: pkg.code,
      access_days: pkg.days,
      status: "pending",
      currency: "aud",
      amount_total: pkg.amountAudCents,
      amount_subtotal: pkg.amountAudCents,
      stripe_customer_id: stripeCustomerId,
      stripe_checkout_session_id: session.id,
      metadata: {
        checkout_created_by: "app",
        price_env_var: pkg.priceEnvVar,
        configured_price_id: getConfiguredPriceId(pkg.priceEnvVar),
      },
    });

  if (purchaseError) {
    console.error("Stripe purchase pending insert error:", purchaseError);
    return NextResponse.json({ ok: false, message: "创建订单失败，请稍后再试。" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    url: session.url,
    sessionId: session.id,
  });
}
