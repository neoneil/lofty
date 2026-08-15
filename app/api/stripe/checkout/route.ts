import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { getServerUser } from "@/lib/auth/server-auth";
import { AI_ACCESS_PACKAGES, getAiAccessPackage, getAiAccessProductScopeConfig, getScopedStripePriceEnvVar, normalizeAiAccessProductScope, type AiAccessProductScope } from "@/lib/billing/ai-access-packages";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";

export const runtime = "nodejs";

function getConfiguredPriceId(priceEnvVar: string) {
  return process.env[priceEnvVar]?.trim() || null;
}

function getConfiguredScopedPriceId(pkg: (typeof AI_ACCESS_PACKAGES)[number], productScope: AiAccessProductScope) {
  return getConfiguredPriceId(getScopedStripePriceEnvVar(pkg, productScope)) ?? getConfiguredPriceId(pkg.priceEnvVar);
}

function createLineItem(pkg: (typeof AI_ACCESS_PACKAGES)[number], productScope: AiAccessProductScope): Stripe.Checkout.SessionCreateParams.LineItem {
  const configuredPriceId = getConfiguredScopedPriceId(pkg, productScope);
  const scopeConfig = getAiAccessProductScopeConfig(productScope);

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
        name: `${scopeConfig?.label ?? productScope.toUpperCase()} ${pkg.days} 天权限`,
        description: "LoftyPTE AI 学习助手一次性时间包",
        metadata: {
          product_scope: productScope,
          package_code: pkg.code,
          access_days: String(pkg.days),
        },
      },
    },
  };
}

function buildCheckoutUrlErrorRedirect(origin: string, nextPath: string, reason: string) {
  const safePath = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/membership';
  const separator = safePath.includes('?') ? '&' : '?';
  return origin + safePath + separator + 'payment=error&reason=' + encodeURIComponent(reason);
}

export async function GET(req: Request) {
  const origin = getAppOrigin(req);
  const url = new URL(req.url);
  const nextPath = url.searchParams.get('next') ?? '/membership';
  const packageCode = url.searchParams.get('packageCode') ?? '';
  const productScope = url.searchParams.get('productScope') ?? url.searchParams.get('product_scope') ?? '';

  const response = await POST(new Request(req.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ packageCode, productScope }),
  }));

  let data: { ok?: boolean; url?: string; message?: string } | null = null;

  try {
    data = await response.json() as { ok?: boolean; url?: string; message?: string };
  } catch {
    data = null;
  }

  if (response.status === 401) {
    return NextResponse.redirect(origin + '/login-v2?next=' + encodeURIComponent(nextPath));
  }

  if (!response.ok || !data?.ok || !data.url) {
    console.error('Stripe checkout redirect failed:', data?.message ?? response.statusText);
    return NextResponse.redirect(buildCheckoutUrlErrorRedirect(origin, nextPath, data?.message ?? 'checkout_failed'));
  }

  return NextResponse.redirect(data.url);
}

export async function POST(req: Request) {
  const context = await getServerUser();

  if (!context) {
    return NextResponse.json({ ok: false, message: "请先登录后再购买。" }, { status: 401 });
  }

  let packageCode = "";
  let productScope: AiAccessProductScope | null = null;

  try {
    const body = await req.json() as { packageCode?: string; productScope?: string; product_scope?: string };
    packageCode = body.packageCode ?? "";
    productScope = normalizeAiAccessProductScope(body.productScope ?? body.product_scope);
  } catch {
    return NextResponse.json({ ok: false, message: "请求格式不正确。" }, { status: 400 });
  }

  const pkg = getAiAccessPackage(packageCode);

  if (!pkg) {
    return NextResponse.json({ ok: false, message: "请选择有效的 AI 时间包。" }, { status: 400 });
  }

  if (!productScope) {
    return NextResponse.json({ ok: false, message: "请选择 IELTS AI 或 PTE AI。" }, { status: 400 });
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
    line_items: [createLineItem(pkg, productScope)],
    success_url: `${origin}/settings/ai-usage?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/settings/ai-usage?payment=cancelled`,
    metadata: {
      user_id: context.user.id,
      product_scope: productScope,
      package_code: pkg.code,
      access_days: String(pkg.days),
    },
    payment_intent_data: {
      metadata: {
        user_id: context.user.id,
        product_scope: productScope,
        package_code: pkg.code,
        access_days: String(pkg.days),
      },
    },
  });

  const { error: purchaseError } = await adminSupabase
    .from("ai_access_purchases")
    .insert({
      user_id: context.user.id,
      product_scope: productScope,
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
        scoped_price_env_var: getScopedStripePriceEnvVar(pkg, productScope),
        configured_price_id: getConfiguredScopedPriceId(pkg, productScope),
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
