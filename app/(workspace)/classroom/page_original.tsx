"use client";

import { useEffect, useRef } from "react";

type ZoomEmbeddedClient = {
  init: (params: Record<string, unknown>) => Promise<unknown>;
  join: (params: Record<string, unknown>) => Promise<unknown>;
  leaveMeeting?: () => void;
  destroyClient?: () => void;
};

type ZoomMtgEmbeddedSdk = {
  createClient: () => ZoomEmbeddedClient;
};

declare global {

  interface Window {
    ZoomMtgEmbedded: ZoomMtgEmbeddedSdk;
  }

}

export default function ClassroomPage() {

  const clientRef =
    useRef<ZoomEmbeddedClient | null>(null);

  const initializedRef =
    useRef(false);

  const joinedRef =
    useRef(false);

  useEffect(() => {

    if (
      initializedRef.current
    ) {
      return;
    }

    initializedRef.current =
      true;

    async function loadScript(
      src: string,
    ) {

      return new Promise(
        (
          resolve,
          reject,
        ) => {

          const existingScript =
            document.querySelector(
              `script[src="${src}"]`,
            );

          if (
            existingScript
          ) {

            resolve(true);

            return;

          }

          const script =
            document.createElement(
              "script",
            );

          script.src =
            src;

          script.async =
            true;

          script.onload =
            () =>
              resolve(true);

          script.onerror =
            () =>
              reject(
                new Error(
                  `Failed to load ${src}`,
                ),
              );

          document.body.appendChild(
            script,
          );

        },
      );

    }

    async function startMeeting() {

      try {

        if (
          joinedRef.current
        ) {

          console.log(
            "ZOOM ALREADY JOINED",
          );

          return;

        }

        console.log(
          "ZOOM START",
        );

        await loadScript(
          "/zoom/react.min.js",
        );

        await loadScript(
          "/zoom/react-dom.min.js",
        );

        await loadScript(
          "/zoom/zoom-meeting-embedded-4.0.7.min.js",
        );

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

        clientRef.current =
          client;

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
            "/api/zoom/join-classroom/signature",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
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
              isResizable:
                true,
            },
          },
        });

        console.log(
          "INIT SUCCESS",
        );

        await client.join({
          signature:
            data.signature,

          meetingNumber:
            "84079681327",

          password: "",

          userName:
            "Vivi",
        });

        joinedRef.current =
          true;

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

    return () => {

      try {

        console.log(
          "ZOOM CLEANUP",
        );

        if (
          clientRef.current
        ) {

          clientRef.current.leaveMeeting?.();

          clientRef.current.destroyClient?.();

          clientRef.current =
            null;

        }

        joinedRef.current =
          false;

      } catch (error) {

        console.error(
          "ZOOM DESTROY ERROR",
          error,
        );

      }

    };

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
