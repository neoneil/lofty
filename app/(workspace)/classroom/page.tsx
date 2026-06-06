"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    ZoomMtgEmbedded: any;
  }
}

function waitForLayout() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export default function ClassroomPage() {
  const clientRef = useRef<any>(null);
  const joinedRef = useRef(false);

  const [meetingNumber, setMeetingNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("Vivi");
  const [shouldJoin, setShouldJoin] = useState(false);
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMeetingNumber = meetingNumber.replace(/\s/g, "");

    if (!cleanMeetingNumber) {
      setStatus("请输入 Meeting ID");
      return;
    }

    setMeetingNumber(cleanMeetingNumber);
    setShouldJoin(true);
  }

  useEffect(() => {
    if (!shouldJoin) {
      return;
    }

    let cancelled = false;

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
          return;
        }

        setStatus("正在加载 Zoom...");

        await loadScript("/zoom/react.min.js");
        await loadScript("/zoom/react-dom.min.js");
        await loadScript("/zoom/zoom-meeting-embedded-4.0.7.min.js");

        if (cancelled) {
          return;
        }

        await waitForLayout();

        if (cancelled) {
          return;
        }

        const ZoomMtgEmbedded = window.ZoomMtgEmbedded;

        if (!ZoomMtgEmbedded) {
          setStatus("Zoom SDK 加载失败");
          return;
        }

        const meetingSDKElement = document.getElementById("meetingSDKElement");

        if (!meetingSDKElement) {
          setStatus("会议容器不存在");
          return;
        }

        const client = ZoomMtgEmbedded.createClient();

        clientRef.current = client;

        setStatus("正在获取会议签名...");

        const response = await fetch("/api/zoom/join-classroom/signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingNumber,
            role: 0,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.signature) {
          console.warn("SIGNATURE FAILED", data);
          setStatus("获取 Zoom signature 失败");
          return;
        }

        setStatus("正在初始化会议...");

        await client.init({
          zoomAppRoot: meetingSDKElement,
          language: "en-US",
          customize: {
            video: {
              isResizable: true,
            },
          },
        });

        setStatus("正在加入会议...");

        try {
          await client.join({
            signature: data.signature,
            meetingNumber,
            password,
            userName: userName || "Student",
          });

          joinedRef.current = true;
          setStatus("");
        } catch (joinError) {
          console.warn("ZOOM JOIN WARNING", joinError);
          setStatus("加入会议失败，请检查 Meeting ID 或密码");
        }
      } catch (error) {
        console.warn("ZOOM ERROR", error);
        setStatus("Zoom 加载失败");
      }
    }

    startMeeting();

    return () => {
      cancelled = true;

      try {
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
  }, [shouldJoin, meetingNumber, password, userName]);

  if (shouldJoin) {
    return (
      <main className="relative h-[calc(100dvh-var(--topbar-height)-0.5rem)] w-full overflow-hidden bg-black">
        {status ? (
          <div className="absolute left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black shadow-lg">
            {status}
          </div>
        ) : null}

        <div id="meetingSDKElement" className="h-full w-full" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--bg)] px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Join Classroom
          </h1>

          <p className="mt-2 text-sm text-[var(--text-soft)]">
            Enter your Zoom Meeting ID to join the online class.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]">
              Your name
            </label>

            <input
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Vivi"
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]">
              Meeting ID
            </label>

            <input
              value={meetingNumber}
              onChange={(event) => setMeetingNumber(event.target.value)}
              placeholder="840 7968 1327"
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]">
              Password
            </label>

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="No password? Leave it empty"
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {status ? (
          <p className="mt-4 text-center text-sm text-red-500">
            {status}
          </p>
        ) : null}

        <button type="submit" className="mt-6 h-12 w-full rounded-2xl bg-[var(--primary)] text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]">
          Join Meeting
        </button>
      </form>
    </main>
  );
}
