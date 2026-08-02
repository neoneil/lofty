import "server-only";

import { type User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const DEVICE_COOKIE_NAME = "lofty_device_id";
const DEVICE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

type LoginMethod = "email" | "google" | "magic_link" | "unknown";
type LoginResult = "success" | "failed" | "blocked";

type DeviceContext = {
  deviceId: string;
  userAgent: string | null;
  ipAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  osName: string | null;
  osVersion: string | null;
  browserName: string | null;
  browserVersion: string | null;
  deviceLabel: string;
};

export type LoginAuditCookie = {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    sameSite: "lax";
    secure: boolean;
    path: "/";
    maxAge: number;
  };
};

export type LoginAuditResult = {
  deviceId: string;
  cookie: LoginAuditCookie;
};

export function applyLoginAuditCookie(response: NextResponse, audit: LoginAuditResult | null) {
  if (!audit) return;
  response.cookies.set(audit.cookie.name, audit.cookie.value, audit.cookie.options);
}

export function getLoginDeviceId(request: NextRequest) {
  return request.cookies.get(DEVICE_COOKIE_NAME)?.value ?? null;
}

export async function recordSuccessfulLogin(request: NextRequest, user: User, method: LoginMethod): Promise<LoginAuditResult | null> {
  const context = buildDeviceContext(request);
  const admin = createAdminClient();
  const now = new Date().toISOString();

  try {
    const { data: existingDevice, error: existingError } = await admin
      .from("user_devices")
      .select("id")
      .eq("user_id", user.id)
      .eq("device_id", context.deviceId)
      .maybeSingle();

    if (existingError) {
      console.error("login audit device lookup failed:", existingError);
      return buildAuditResult(context.deviceId);
    }

    const isNewDevice = !existingDevice;
    let userDeviceId = existingDevice?.id ?? null;

    if (existingDevice) {
      const { error: updateError } = await admin
        .from("user_devices")
        .update({
          device_label: context.deviceLabel,
          device_type: context.deviceType,
          os_name: context.osName,
          os_version: context.osVersion,
          browser_name: context.browserName,
          browser_version: context.browserVersion,
          user_agent: context.userAgent,
          ip_address: context.ipAddress,
          country: context.country,
          region: context.region,
          city: context.city,
          timezone: context.timezone,
          last_seen_at: now,
          last_login_at: now,
        })
        .eq("id", existingDevice.id);

      if (updateError) console.error("login audit device update failed:", updateError);
    } else {
      const { data: insertedDevice, error: insertError } = await admin
        .from("user_devices")
        .insert({
          user_id: user.id,
          device_id: context.deviceId,
          device_label: context.deviceLabel,
          device_type: context.deviceType,
          os_name: context.osName,
          os_version: context.osVersion,
          browser_name: context.browserName,
          browser_version: context.browserVersion,
          user_agent: context.userAgent,
          ip_address: context.ipAddress,
          country: context.country,
          region: context.region,
          city: context.city,
          timezone: context.timezone,
          first_seen_at: now,
          last_seen_at: now,
          last_login_at: now,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("login audit device insert failed:", insertError);
      } else {
        userDeviceId = insertedDevice.id;
      }
    }

    await insertLoginEvent({
      userId: user.id,
      userDeviceId,
      context,
      method,
      result: "success",
      isNewDevice,
      attemptedEmail: user.email ?? null,
    });
  } catch (error) {
    console.error("login audit success record failed:", error);
  }

  return buildAuditResult(context.deviceId);
}

export async function recordFailedLogin(request: NextRequest, attemptedEmail: string | null, method: LoginMethod, reason?: string) {
  const context = buildDeviceContext(request, { createIfMissing: false });

  try {
    await insertLoginEvent({
      userId: null,
      userDeviceId: null,
      context,
      method,
      result: "failed",
      isNewDevice: false,
      attemptedEmail,
      metadata: reason ? { reason } : {},
    });
  } catch (error) {
    console.error("login audit failed record failed:", error);
  }
}

async function insertLoginEvent({
  userId,
  userDeviceId,
  context,
  method,
  result,
  isNewDevice,
  attemptedEmail,
  metadata = {},
}: {
  userId: string | null;
  userDeviceId: string | null;
  context: DeviceContext;
  method: LoginMethod;
  result: LoginResult;
  isNewDevice: boolean;
  attemptedEmail: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("login_events").insert({
    user_id: userId,
    user_device_id: userDeviceId,
    device_id: context.deviceId,
    event_type: "login",
    login_method: method,
    result,
    is_new_device: isNewDevice,
    attempted_email: attemptedEmail,
    ip_address: context.ipAddress,
    country: context.country,
    region: context.region,
    city: context.city,
    timezone: context.timezone,
    user_agent: context.userAgent,
    metadata,
  });

  if (error) console.error("login audit event insert failed:", error);
}

function buildAuditResult(deviceId: string): LoginAuditResult {
  return {
    deviceId,
    cookie: {
      name: DEVICE_COOKIE_NAME,
      value: deviceId,
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
      },
    },
  };
}

function buildDeviceContext(request: NextRequest, options: { createIfMissing?: boolean } = {}): DeviceContext {
  const createIfMissing = options.createIfMissing ?? true;
  const existingDeviceId = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
  const deviceId = existingDeviceId || (createIfMissing ? crypto.randomUUID() : `unknown-${crypto.randomUUID()}`);
  const userAgent = normalizeHeader(request.headers.get("user-agent"));
  const parsed = parseUserAgent(userAgent);

  return {
    deviceId,
    userAgent,
    ipAddress: getClientIp(request),
    country: getFirstHeader(request, ["cf-ipcountry", "x-vercel-ip-country"]),
    region: getFirstHeader(request, ["x-vercel-ip-country-region", "cf-region"]),
    city: decodeHeaderValue(getFirstHeader(request, ["x-vercel-ip-city", "cf-ipcity"])),
    timezone: getFirstHeader(request, ["x-vercel-ip-timezone"]),
    deviceType: parsed.deviceType,
    osName: parsed.osName,
    osVersion: parsed.osVersion,
    browserName: parsed.browserName,
    browserVersion: parsed.browserVersion,
    deviceLabel: buildDeviceLabel(parsed),
  };
}

function getClientIp(request: NextRequest) {
  const raw = getFirstHeader(request, [
    "cf-connecting-ip",
    "x-real-ip",
    "x-forwarded-for",
    "x-client-ip",
  ]);
  if (!raw) return null;

  const first = raw.split(",")[0]?.trim();
  if (!first) return null;

  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(first)) {
    return first.split(":")[0] ?? null;
  }

  return first;
}

function getFirstHeader(request: NextRequest, names: string[]) {
  for (const name of names) {
    const value = normalizeHeader(request.headers.get(name));
    if (value) return value;
  }
  return null;
}

function normalizeHeader(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function decodeHeaderValue(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseUserAgent(userAgent: string | null) {
  const ua = userAgent ?? "";
  const deviceType = /ipad|tablet|kindle|silk/i.test(ua)
    ? "tablet"
    : /mobile|iphone|ipod|android.*mobile/i.test(ua)
      ? "mobile"
      : ua
        ? "desktop"
        : "unknown";

  const os = matchFirst(ua, [
    { name: "iOS", pattern: /(?:iPhone|iPad|iPod).*OS ([\d_]+)/i, transform: underscoreVersion },
    { name: "Android", pattern: /Android ([\d.]+)/i },
    { name: "Windows", pattern: /Windows NT ([\d.]+)/i },
    { name: "macOS", pattern: /Mac OS X ([\d_]+)/i, transform: underscoreVersion },
    { name: "Linux", pattern: /Linux/i },
  ]);

  const browser = matchFirst(ua, [
    { name: "Edge", pattern: /Edg\/([\d.]+)/i },
    { name: "Chrome", pattern: /Chrome\/([\d.]+)/i },
    { name: "Firefox", pattern: /Firefox\/([\d.]+)/i },
    { name: "Safari", pattern: /Version\/([\d.]+).*Safari/i },
  ]);

  return {
    deviceType: deviceType as DeviceContext["deviceType"],
    osName: os.name,
    osVersion: os.version,
    browserName: browser.name,
    browserVersion: browser.version,
  };
}

function matchFirst(userAgent: string, matchers: Array<{ name: string; pattern: RegExp; transform?: (value: string) => string }>) {
  for (const matcher of matchers) {
    const match = userAgent.match(matcher.pattern);
    if (match) {
      const version = match[1] ? matcher.transform?.(match[1]) ?? match[1] : null;
      return { name: matcher.name, version };
    }
  }
  return { name: null, version: null };
}

function underscoreVersion(value: string) {
  return value.replaceAll("_", ".");
}

function buildDeviceLabel(parsed: Pick<DeviceContext, "browserName" | "osName" | "deviceType">) {
  if (parsed.browserName && parsed.osName) return `${parsed.browserName} on ${parsed.osName}`;
  if (parsed.browserName) return parsed.browserName;
  if (parsed.osName) return parsed.osName;
  return parsed.deviceType === "unknown" ? "Unknown device" : parsed.deviceType;
}
