"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();

  const clientRef = useRef<ZoomEmbeddedClient | null>(null);
  const initializedRef = useRef(false);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const meetingNumber = searchParams.get("meetingNumber") || "";
    const password = searchParams.get("password") || "";
    const userName = searchParams.get("name") || "Student";
    const role = Number(searchParams.get("role") || 0);

    if (!meetingNumber) {
      console.warn("Missing meetingNumber");
      return;
    }

    async function loadScript(src: string) {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);

        if (existingScript) {
          resolve(true);
          return;
        }

        const script = document.createElement("script");

        script.src = src;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error(`Failed to load ${src}`));

        document.body.appendChild(script);
      });
    }

    async function startMeeting() {
      try {
        if (joinedRef.current) {
          console.log("ZOOM ALREADY JOINED");
          return;
        }

        console.log("ZOOM START", {
          meetingNumber,
          role,
          userName,
        });

        await loadScript("/zoom/react.min.js");
        await loadScript("/zoom/react-dom.min.js");
        await loadScript("/zoom/zoom-meeting-embedded-4.0.7.min.js");

        const ZoomMtgEmbedded = window.ZoomMtgEmbedded;

        if (!ZoomMtgEmbedded) {
          console.warn("ZoomMtgEmbedded missing");
          return;
        }

        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        const meetingSDKElement = document.getElementById("meetingSDKElement");

        if (!meetingSDKElement) {
          console.warn("meetingSDKElement missing");
          return;
        }

        const response = await fetch("/api/zoom/join-classroom/signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingNumber,
            role,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.signature) {
          console.warn("SIGNATURE FAILED", data);
          return;
        }

        await client.init({
          zoomAppRoot: meetingSDKElement,
          language: "en-US",
          customize: {
            video: {
              isResizable: true,
            },
          },
        });

        console.log("INIT SUCCESS");

        try {
          await client.join({
            signature: data.signature,
            meetingNumber,
            password,
            userName,
          });

          joinedRef.current = true;

          console.log("JOIN SUCCESS");
        } catch (joinError) {
          console.warn("ZOOM JOIN WARNING", joinError);
        }
      } catch (error) {
        console.warn("ZOOM ERROR", error);
      }
    }

    startMeeting();

    return () => {
      try {
        console.log("ZOOM CLEANUP");

        if (clientRef.current) {
          clientRef.current.leaveMeeting?.();
          clientRef.current.destroyClient?.();
          clientRef.current = null;
        }

        joinedRef.current = false;
      } catch (error) {
        console.warn("ZOOM DESTROY WARNING", error);
      }
    };
  }, [searchParams]);

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <div id="meetingSDKElement" className="h-full w-full" />
    </main>
  );
}
