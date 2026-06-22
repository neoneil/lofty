"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Lock, MonitorPlay, Sparkles, UserRound, Video } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";

type ZoomClient = {
  init: (options: Record<string, unknown>) => Promise<unknown>;
  join: (options: Record<string, unknown>) => Promise<unknown>;
  leaveMeeting?: () => void;
  destroyClient?: () => void;
};

declare global {
  interface Window {
    ZoomMtgEmbedded: {
      createClient: () => ZoomClient;
    };
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
  const clientRef = useRef<ZoomClient | null>(null);
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
          <div className="absolute left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-white/90 px-5 py-2 text-sm font-semibold text-black shadow-lg backdrop-blur-md dark:bg-[var(--card)]/90 dark:text-[var(--text)]">
            {status}
          </div>
        ) : null}

        <div id="meetingSDKElement" className="h-full w-full" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_430px] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_30%)]" />

          <div className="relative">
            <Badge variant="default">Live Classroom</Badge>

            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Join your online classroom
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
              Enter the Zoom meeting details provided by your teacher. The classroom will open directly inside this portal.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <InfoTile
                icon={<Video size={18} />}
                title="Zoom SDK"
                text="Embedded class room"
              />
              <InfoTile
                icon={<MonitorPlay size={18} />}
                title="Live Lesson"
                text="Join from browser"
              />
              <InfoTile
                icon={<Sparkles size={18} />}
                title="Teacher Led"
                text="Real-time support"
              />
            </div>
          </div>
        </div>

        <Card className="rounded-[var(--radius-lg)]">
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>Meeting Details</CardTitle>
            <CardDescription>
              Use the Meeting ID and password from your classroom invitation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <UserRound size={15} className="text-[var(--primary)]" />
                  Your name
                </span>
                <Input
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  placeholder="Vivi"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <MonitorPlay size={15} className="text-[var(--primary)]" />
                  Meeting ID
                </span>
                <Input
                  value={meetingNumber}
                  onChange={(event) => setMeetingNumber(event.target.value)}
                  placeholder="840 7968 1327"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <Lock size={15} className="text-[var(--primary)]" />
                  Password
                </span>
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="No password? Leave it empty"
                />
              </label>

              {status ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                  {status}
                </div>
              ) : null}

              <Button type="submit" fullWidth size="lg">
                Join Meeting
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function InfoTile({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card-soft)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="mt-4 text-sm font-semibold text-[var(--text)]">
        {title}
      </div>
      <div className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
        {text}
      </div>
    </div>
  );
}
