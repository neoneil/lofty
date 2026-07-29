
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete } from "@/lib/api/client";

type DeletePostButtonProps = {
  postId: string;
  postTitle: string;
};

export default function DeletePostButton({
  postId,
  postTitle,
}: DeletePostButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${postTitle}"?`
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      await apiDelete(`/api/admin/posts/${postId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 text-sm font-semibold text-[var(--danger)] transition hover:border-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {message ? (
        <p className="max-w-48 text-right text-xs text-[var(--danger)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
