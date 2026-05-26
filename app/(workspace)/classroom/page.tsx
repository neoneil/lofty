


"use client";

import { useEffect } from "react";

declare global {

  interface Window {
    ZoomMtgEmbedded: any;
  }

}

export default function ClassroomPage() {

  useEffect(() => {

    async function loadZoom() {

      try {

        const reactScript =
          document.createElement(
            "script",
          );

        reactScript.src =
          "https://source.zoom.us/4.0.7/lib/vendor/react.min.js";

        document.body.appendChild(
          reactScript,
        );

        const reactDomScript =
          document.createElement(
            "script",
          );

        reactDomScript.src =
          "https://source.zoom.us/4.0.7/lib/vendor/react-dom.min.js";

        document.body.appendChild(
          reactDomScript,
        );

        const zoomScript =
          document.createElement(
            "script",
          );

        zoomScript.src =
  "https://source.zoom.us/zoom-meeting-embedded-4.0.7.min.js";

        zoomScript.onload =
          async () => {

            console.log(
              "ZOOM SDK LOADED",
            );

            const ZoomMtgEmbedded =
              window.ZoomMtgEmbedded;

            if (
              !ZoomMtgEmbedded
            ) {

              console.error(
                "ZoomMtgEmbedded missing",
              );

              return;

            }

            const client =
              ZoomMtgEmbedded.createClient();

            const meetingSDKElement =
              document.getElementById(
                "meetingSDKElement",
              );

            if (
              !meetingSDKElement
            ) {

              console.error(
                "meetingSDKElement missing",
              );

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
                    meetingNumber:
                      "84079681327",
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

            console.log(
              "INIT SUCCESS",
            );

            await client.join({
              sdkKey:
                process.env
                  .NEXT_PUBLIC_ZOOM_CLIENT_ID!,

              signature:
                data.signature,

              meetingNumber:
                "84079681327",

              password: "",

              userName:
                "tester",
            });

            console.log(
              "JOIN SUCCESS",
            );

            document.body.style.background =
              "green";

          };

        zoomScript.onerror =
          () => {

            console.error(
              "ZOOM SDK LOAD FAILED",
            );

          };

        document.body.appendChild(
          zoomScript,
        );

      } catch (error) {

        console.error(
          "ZOOM ERROR",
          error,
        );

      }

    }

    loadZoom();

  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <div
        id="meetingSDKElement"
        className="h-full w-full"
      />
    </main>
  );

}