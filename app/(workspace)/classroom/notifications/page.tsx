"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatRelativeTime } from "@/lib/date";

type ZoomNotification = {
  id: string;
  title: string;
  message: string;
  classroom_id: string | null;
  meeting_id: string | null;
  meeting_password: string | null;
  is_read: boolean;
  created_at: string;
};

function getMeetingId(notification: ZoomNotification) {
  if (notification.meeting_id) {
    return notification.meeting_id;
  }

  const match = notification.message.match(/Meeting ID:\s*([0-9\s]+)/i);

  return match?.[1]?.replace(/\s/g, "") || "";
}

function openZoomMeeting(meetingId: string, password?: string | null) {
  const cleanMeetingId = meetingId.replace(/\s/g, "");

  const confirmed = window.confirm(`Join Zoom meeting?\n\nMeeting ID: ${cleanMeetingId}`);

  if (!confirmed) {
    return;
  }

  const zoomUrl = password ? `https://zoom.us/j/${cleanMeetingId}?pwd=${encodeURIComponent(password)}` : `https://zoom.us/j/${cleanMeetingId}`;

  window.open(zoomUrl, "_blank", "noopener,noreferrer");
}

export default function ClassroomNotificationsPage() {
  const [notifications, setNotifications] = useState<ZoomNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response = await fetch("/api/zoom/student-notifications");
        const data = await response.json();

        if (!response.ok) {
          console.warn(data);
          return;
        }

        setNotifications(data.notifications || []);
      } catch (error) {
        console.warn("LOAD ZOOM NOTIFICATIONS ERROR", error);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  async function copyMeetingId(meetingId: string) {
    await navigator.clipboard.writeText(meetingId);
    alert(`Meeting ID copied: ${meetingId}`);
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text)]">Zoom Classroom Notifications</h1>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Copy your Meeting ID or open Zoom directly.</p>
        </div>

        <div className="mb-6">
          <Link href="/classroom" className="inline-flex rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white">
            Go to Web Classroom
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-soft)]">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-soft)]">No Zoom classroom notifications yet.</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const meetingId = getMeetingId(notification);

              return (
                <div key={notification.id} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--text)]">{notification.title}</h2>
                      <p className="mt-2 text-sm text-[var(--text-soft)]">{notification.message}</p>
                      <p className="mt-3 text-xs text-[var(--text-faint)]" title={formatDate(notification.created_at)}>{formatRelativeTime(notification.created_at)}</p>
                    </div>

                    {!notification.is_read ? (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">New</span>
                    ) : null}
                  </div>

                  {meetingId ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900">Meeting ID: {meetingId}</div>
                        <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900">Password: {notification.meeting_password || "No password"}</div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button onClick={() => copyMeetingId(meetingId)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-gray-50">
                          Copy Meeting ID
                        </button>

                        <button onClick={() => openZoomMeeting(meetingId, notification.meeting_password)} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]">
                          Join Zoom Class
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}