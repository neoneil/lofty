"use client";

import { useEffect } from "react";

type Props = {
  meetingNumber: string;
  password?: string;
  userName: string;
};

export default function ZoomMeeting({
  meetingNumber,
  password = "",
  userName,
}: Props) {

  useEffect(() => {

    async function startMeeting() {

      try {

        const ZoomMtgEmbedded =
          (
            await import(
              "@zoom/meetingsdk/embedded"
            )
          ).default;

        const client =
          ZoomMtgEmbedded.createClient();

        const meetingSDKElement =
          document.getElementById(
            "meetingSDKElement",
          );

        if (!meetingSDKElement) {
          return;
        }

        const response =
          await fetch(
            "/api/zoom/signature",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                meetingNumber,
                role: 0,
              }),
            },
          );

        const data =
          await response.json();

        console.log(
          "SIGNATURE",
          data,
        );

        await client.init({
          zoomAppRoot:
            meetingSDKElement,

          language:
            "en-US",

          customize: {
            video: {
              isResizable: true,
            },
          },
        });

        await client.join({
          sdkKey:
            process.env
              .NEXT_PUBLIC_ZOOM_CLIENT_ID!,

          signature:
            data.signature,

          meetingNumber,

          password,

          userName,
        });

        console.log(
          "JOIN SUCCESS",
        );

      } catch (error) {

        console.error(
          "ZOOM ERROR",
          error,
        );

      }

    }

    startMeeting();

  }, [
    meetingNumber,
    password,
    userName,
  ]);

  return (
    <div
      id="meetingSDKElement"
      className="h-screen w-full"
    />
  );

}