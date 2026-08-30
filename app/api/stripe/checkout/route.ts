import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { getServerUser, type ServerUserContext } from "@/lib/auth/server-auth";
import { AI_ACCESS_PACKAGES, getAiAccessPackage, getAiAccessProductScopeConfig, getScopedStripePriceEnvVar, normalizeAiAccessProductScope, type AiAccessProductScope } from "@/lib/billing/ai-access-packages";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";

export const runtime = "nodejs";
const GENERIC_CHECKOUT_ERROR = "支付页面打开失败，请刷新后重试。若仍然失败，请联系管理员处理。";

type CheckoutBuildResult =
  | { ok: true; session: Stripe.Checkout.Session }
  | { ok: false; status: number; message: string };

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
  const safePath = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/membership";
  const separator = safePath.includes("?") ? "&" : "?";
  return origin + safePath + separator + "payment=error&reason=" + encodeURIComponent(reason);
}

function getPublicCheckoutError(result: Exclude<CheckoutBuildResult, { ok: true }>) {
  return result.status >= 500 ? GENERIC_CHECKOUT_ERROR : result.message;
}

async function buildCheckoutSession(req: Request, context: ServerUserContext, packageCode: string, rawProductScope: string | null | undefined): Promise<CheckoutBuildResult> {
  const pkg = getAiAccessPackage(packageCode);
  const productScope = normalizeAiAccessProductScope(rawProductScope);

  if (!pkg) {
    return { ok: false, status: 400, message: "请选择有效的 AI 时间包。" };
  }

  if (!productScope) {
    return { ok: false, status: 400, message: "请选择 IELTS AI 或 PTE AI。" };
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
    return { ok: false, status: 500, message: "读取支付资料失败，请稍后再试。" };
  }

  let stripeCustomerId = billingProfile?.stripe_customer_id ?? null;

  if (stripeCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(stripeCustomerId);
      if (existingCustomer.deleted) {
        console.warn("Stored Stripe customer was deleted; creating a new customer:", stripeCustomerId);
        stripeCustomerId = null;
      }
    } catch (error) {
      console.warn("Stored Stripe customer is not usable for the current Stripe key; creating a new customer:", stripeCustomerId, error);
      stripeCustomerId = null;
    }
  }

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
      return { ok: false, status: 500, message: "保存支付资料失败，请稍后再试。" };
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "alipay"],
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

  if (!session.url) {
    console.error("Stripe checkout session missing url:", session.id);
    return { ok: false, status: 500, message: "Stripe 支付页面创建失败，请稍后再试。" };
  }

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
    return { ok: false, status: 500, message: "创建订单失败，请稍后再试。" };
  }

  return { ok: true, session };
}

export async function GET(req: Request) {
  const origin = getAppOrigin(req);
  const url = new URL(req.url);
  const nextPath = url.searchParams.get("next") ?? "/membership";

  try {
    const context = await getServerUser();

    if (!context) {
      return NextResponse.redirect(origin + "/login-v2?next=" + encodeURIComponent(nextPath));
    }

    const result = await buildCheckoutSession(
      req,
      context,
      url.searchParams.get("packageCode") ?? "",
      url.searchParams.get("productScope") ?? url.searchParams.get("product_scope"),
    );

    if (!result.ok) {
      console.error("Stripe checkout redirect failed:", result.message);
      return NextResponse.redirect(buildCheckoutUrlErrorRedirect(origin, nextPath, getPublicCheckoutError(result)));
    }

    return NextResponse.redirect(result.session.url as string);
  } catch (error) {
    console.error("Stripe checkout GET error:", error);
    return NextResponse.redirect(buildCheckoutUrlErrorRedirect(origin, nextPath, "checkout_failed"));
  }
}

export async function POST(req: Request) {
  const origin = getAppOrigin(req);
  const contentType = req.headers.get("content-type") ?? "";
  const isFormPost = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  let nextPath = "/membership";

  try {
    const context = await getServerUser();

    if (!context) {
      if (isFormPost) {
        return NextResponse.redirect(origin + "/login-v2?next=" + encodeURIComponent(nextPath), 303);
      }

      return NextResponse.json({ ok: false, message: "请先登录后再购买。" }, { status: 401 });
    }

    let packageCode = "";
    let productScope: string | null = null;

    if (isFormPost) {
      const formData = await req.formData();
      packageCode = String(formData.get("packageCode") ?? "");
      productScope = String(formData.get("productScope") ?? formData.get("product_scope") ?? "");
      nextPath = String(formData.get("next") ?? "/membership");
    } else {
      try {
        const body = await req.json() as { packageCode?: string; productScope?: string; product_scope?: string };
        packageCode = body.packageCode ?? "";
        productScope = body.productScope ?? body.product_scope ?? null;
      } catch {
        return NextResponse.json({ ok: false, message: "请求格式不正确。" }, { status: 400 });
      }
    }

    const result = await buildCheckoutSession(req, context, packageCode, productScope);

    if (!result.ok) {
      if (isFormPost) {
        console.error("Stripe checkout form redirect failed:", result.message);
        return NextResponse.redirect(buildCheckoutUrlErrorRedirect(origin, nextPath, getPublicCheckoutError(result)), 303);
      }

      return NextResponse.json({ ok: false, message: result.message }, { status: result.status });
    }

    if (isFormPost) {
      return NextResponse.redirect(result.session.url as string, 303);
    }

    return NextResponse.json({
      ok: true,
      url: result.session.url,
      sessionId: result.session.id,
    });
  } catch (error) {
    console.error("Stripe checkout POST error:", error);

    if (isFormPost) {
      return NextResponse.redirect(buildCheckoutUrlErrorRedirect(origin, nextPath, GENERIC_CHECKOUT_ERROR), 303);
    }

    return NextResponse.json({ ok: false, message: "创建支付页面失败，请稍后再试。" }, { status: 500 });
  }
}
