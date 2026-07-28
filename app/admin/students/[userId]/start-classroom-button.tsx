"use client";

export default function StartClassroomButton({
  studentId,
}: {
  studentId: string;
}) {
  async function handleCreateClassroom() {
    const meetingWindow = window.open("", "_blank");

    try {
      const response = await fetch("/api/zoom/create-classroom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
        }),
      });

      const data = await response.json();

      console.log("CREATE CLASSROOM RESPONSE", {
        status: response.status,
        data,
      });

      if (!response.ok) {
        meetingWindow?.close();
        alert(data.message || "Create classroom failed");
        return;
      }

      const params = new URLSearchParams();
      if (data.password) params.set("pwd", data.password);
      const suffix = params.toString() ? `?${params.toString()}` : "";

      if (meetingWindow) {
        meetingWindow.location.href = `https://zoom.us/j/${data.meetingId}${suffix}`;
      } else {
        window.open(`https://zoom.us/j/${data.meetingId}${suffix}`, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      meetingWindow?.close();
      console.error("CREATE CLASSROOM BUTTON ERROR", error);
      alert("Create classroom failed");
    }
  }

  return (
    <button onClick={handleCreateClassroom} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
      Start Zoom Class
    </button>
  );
}
