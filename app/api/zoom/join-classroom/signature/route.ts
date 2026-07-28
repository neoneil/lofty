import { NextRequest } from "next/server";

import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function readLocalEnvValue(name: string) {
  try {
    const envFile = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    const line = envFile
      .split(/\r?\n/)
      .find((item) => item.startsWith(`${name}=`));
    const rawValue = line?.slice(name.length + 1).trim();

    if (!rawValue) {
      return "";
    }

    return rawValue.replace(/^['"]|['"]$/g, "");
  } catch {
    return "";
  }
}

function getServerEnvValue(...names: string[]) {
  for (const name of names) {
    const processValue = process.env[name]?.trim();

    if (processValue) {
      return processValue;
    }

    const localValue = readLocalEnvValue(name);

    if (localValue) {
      return localValue;
    }
  }

  return "";
}

function createZoomSignature({
  meetingNumber,
  role,
  sdkKey,
  sdkSecret,
}: {
  meetingNumber: string;
  role: 0 | 1;
  sdkKey: string;
  sdkSecret: string;
}) {
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sdkKey,
    mn: meetingNumber,
    role,
    iat,
    exp,
    appKey: sdkKey,
    tokenExp: exp,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", sdkSecret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

export async function POST(
  request: NextRequest,
) {

  try {

    const {
      meetingNumber,
      role,
    } =
      await request.json();

    const cleanMeetingNumber = String(meetingNumber ?? "").replace(/\s/g, "");
    const zoomRole = role === 1 ? 1 : 0;
    const sdkKey = getServerEnvValue("ZOOM_CLIENT_ID", "NEXT_PUBLIC_ZOOM_CLIENT_ID");
    const sdkSecret = getServerEnvValue("ZOOM_CLIENT_SECRET");

    if (!cleanMeetingNumber) {
      return Response.json(
        {
          ok: false,
          message: "Missing meeting number",
        },
        {
          status: 400,
        },
      );
    }

    if (!sdkKey || !sdkSecret) {
      return Response.json(
        {
          ok: false,
          message: "Zoom SDK credentials are missing",
        },
        {
          status: 500,
        },
      );
    }

    const signature = createZoomSignature({
      meetingNumber: cleanMeetingNumber,
      role: zoomRole,
      sdkKey,
      sdkSecret,
    });

    return Response.json({
      ok: true,
      signature,
    });

  } catch (error) {

    console.error(
      "SIGNATURE ERROR",
      error,
    );

    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to create Zoom signature",
      },
      {
        status: 500,
      },
    );

  }

}
