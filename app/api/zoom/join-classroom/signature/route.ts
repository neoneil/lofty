import { NextRequest } from "next/server";

import * as jwt from "jsonwebtoken";

export async function POST(
  request: NextRequest,
) {

  try {

    const {
      meetingNumber,
      role,
    } =
      await request.json();

    const sdkKey =
      process.env
        .ZOOM_CLIENT_ID!;

    const sdkSecret =
      process.env
        .ZOOM_CLIENT_SECRET!;

    const iat =
      Math.floor(
        Date.now() / 1000,
      ) - 30;

    const exp =
      iat + 60 * 60 * 2;

    const payload = {
      sdkKey,
      mn: meetingNumber,
      role,
      iat,
      exp,
      appKey: sdkKey,
      tokenExp: exp,
    };

    const signature =
      jwt.sign(
        payload,
        sdkSecret,
        {
          algorithm:
            "HS256",
        },
      );

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
      },
      {
        status: 500,
      },
    );

  }

}