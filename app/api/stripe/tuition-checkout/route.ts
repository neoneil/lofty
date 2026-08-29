import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { getServerUser, type ServerUserContext } from "@/lib/auth/server-auth";
import { getTuitionPackage } from "@/lib/billing/tuition-packages";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/server";

export const runtime = "nodejs";

type TuitionCheckoutBuildResult =
  | { ok: true; session: Stripe.Checkout.Session }
  | { ok: false; status: number; message: string };

function buildCheckoutUrlErrorRedirect(origin: string, nextPath: string, reason: string) {
  const safePath = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/membership";
  const separator = safePath.includes("?") ? "&" : "?";
  return origin + safePath + separator + "payment=error&reason=" + encodeURIComponent(reason);
}

async function getOrCreateStripeCustomer(context: ServerUserContext) {
  const stripe = getStripeClient();
  const adminSupabase = createAdminClient();
  const userEmail = context.user.email ?? undefined;

  const { data: billingProfile, error: profileLoadError } = await adminSupabase
    .from("user_billing_profiles")
    .select("stripe_customer_id, billing_email")
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (profileLoadError) {
    throw new Error("读取支付资料失败，请稍后再试。");
  }

  let stripeCustomerId = billingProfile?.stripe_customer_id ?? null;

  if (stripeCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(stripeCustomerId);
      if (existingCustomer.deleted) stripeCustomerId = null;
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
      throw new Error("保存支付资料失败，请稍后再试。");
    }
  }

  return stripeCustomerId;
}

async function buildTuitionCheckoutSession(req: Request, context: ServerUserContext, packageCode: string): Promise<TuitionCheckoutBuildResult> {
  const pkg = getTuitionPackage(packageCode);

  if (!pkg) {
    return { ok: false, status: 400, message: "请选择有效的学费套餐。" };
  }

  const stripe = getStripeClient();
  const adminSupabase = createAdminClient();
  const origin = getAppOrigin(req);

  let stripeCustomerId: string;

  try {
    stripeCustomerId = await getOrCreateStripeCustomer(context);
  } catch (error) {
    console.error("Stripe tuition billing profile error:", error);
    return { ok: false, status: 500, message: error instanceof Error ? error.message : "读取支付资料失败，请稍后再试。" };
  }

  const metadata = {
    purchase_type: "tuition",
    user_id: context.user.id,
    package_code: pkg.code,
    package_label: pkg.label,
    lesson_count: String(pkg.lessonCount),
    total_hours: String(pkg.totalHours),
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    client_reference_id: context.user.id,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "aud",
        unit_amount: pkg.amountAudCents,
        product_data: {
          name: `${pkg.label}学费`,
          description: `Lofty Education 一对一课程：${pkg.description}`,
          metadata,
        },
      },
    }],
    success_url: `${origin}/membership?payment=tuition_success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/membership?payment=tuition_cancelled`,
    metadata,
    payment_intent_data: {
      metadata,
    },
  });

  if (!session.url) {
    console.error("Stripe tuition checkout session missing url:", session.id);
    return { ok: false, status: 500, message: "Stripe 支付页面创建失败，请稍后再试。" };
  }

  const { error: paymentError } = await adminSupabase
    .from("tuition_payments")
    .insert({
      user_id: context.user.id,
      package_code: pkg.code,
      package_label: pkg.label,
      lesson_count: pkg.lessonCount,
      total_hours: pkg.totalHours,
      status: "pending",
      currency: "aud",
      amount_total: pkg.amountAudCents,
      amount_subtotal: pkg.amountAudCents,
      stripe_customer_id: stripeCustomerId,
      stripe_checkout_session_id: session.id,
      metadata: {
        checkout_created_by: "app",
        purchase_type: "tuition",
      },
    });

  if (paymentError) {
    console.error("Stripe tuition payment pending insert error:", paymentError);
    return { ok: false, status: 500, message: "创建学费订单失败，请稍后再试。" };
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

    const result = await buildTuitionCheckoutSession(req, context, url.searchParams.get("packageCode") ?? "");

    if (!result.ok) {
      console.error("Stripe tuition checkout redirect failed:", result.message);
      return NextResponse.redirect(buildCheckoutUrlErrorRedirect(origin, nextPath, result.message));
    }

    return NextResponse.redirect(result.session.url as string);
  } catch (error) {
    console.error("Stripe tuition checkout GET error:", error);
    return NextResponse.redirect(buildCheckoutUrlErrorRedirect(origin, nextPath, "tuition_checkout_failed"));
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

      return NextResponse.json({ ok: false, message: "请先登录后再支付学费。" }, { status: 401 });
    }

    let packageCode = "";

    if (isFormPost) {
      const formData = await req.formData();
      packageCode = String(formData.get("packageCode") ?? "");
      nextPath = String(formData.get("next") ?? "/membership");
    } else {
      try {
        const body = await req.json() as { packageCode?: string };
        packageCode = body.packageCode ?? "";
      } catch {
        return NextResponse.json({ ok: false, message: "请求格式不正确。" }, { status: 400 });
      }
    }

    const result = await buildTuitionCheckoutSession(req, context, packageCode);

    if (!result.ok) {
      if (isFormPost) {
        console.error("Stripe tuition checkout form redirect failed:", result.message);
        return NextResponse.redirect(buildCheckoutUrlErrorRedirect(origin, nextPath, result.message), 303);
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
    console.error("Stripe tuition checkout POST error:", error);

    if (isFormPost) {
      return NextResponse.redirect(buildCheckoutUrlErrorRedirect(origin, nextPath, error instanceof Error ? error.message : "tuition_checkout_failed"), 303);
    }

    return NextResponse.json({ ok: false, message: "创建学费支付页面失败，请稍后再试。" }, { status: 500 });
  }
}
