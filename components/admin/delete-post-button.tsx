
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DeletePostButtonProps = {
  postId: string;
  postTitle: string;
};

export default function DeletePostButton({
  postId,
  postTitle,
}: DeletePostButtonProps) {
  const supabase = createClient();
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

    // 1. 先查文章，拿 cover_image
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("cover_image")
      .eq("id", postId)
      .single();

    if (fetchError) {
      setMessage(fetchError.message);
      setLoading(false);
      return;
    }

    // 2. 如果有封面图，先删 storage 文件
    if (post?.cover_image) {
      try {
        const url = new URL(post.cover_image);

        // 从完整 public URL 里取出 bucket 后面的路径
        // 例如:
        // /storage/v1/object/public/images/covers/123.png
        // 变成:
        // covers/123.png
        const path = url.pathname.split("/images/")[1];

        if (path) {
          const { error: storageError } = await supabase.storage
            .from("images")
            .remove([path]);

          if (storageError) {
            setMessage(storageError.message);
            setLoading(false);
            return;
          }
        }
      } catch {
        setMessage("Invalid cover image URL");
        setLoading(false);
        return;
      }
    }

    // 3. 再删数据库里的 post
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      setMessage(deleteError.message);
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
        className="rounded border px-3 py-2 text-sm"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { createClient } from "@/lib/supabase/client";

// type DeletePostButtonProps = {
//   postId: string;
//   postTitle: string;
// };

// export default function DeletePostButton({
//   postId,
//   postTitle,
// }: DeletePostButtonProps) {
//   const supabase = createClient();
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   async function handleDelete() {
//     const confirmed = window.confirm(
//       `Are you sure you want to delete "${postTitle}"?`
//     );

//     if (!confirmed) return;

//     setLoading(true);
//     setMessage("");

//     const { error } = await supabase.from("posts").delete().eq("id", postId);

//     if (error) {
//       setMessage(error.message);
//       setLoading(false);
//       return;
//     }

//     router.refresh();
//   }

//   return (
//     <div className="flex flex-col items-end gap-2">
//       <button
//         type="button"
//         onClick={handleDelete}
//         disabled={loading}
//         className="rounded border px-3 py-2 text-sm"
//       >
//         {loading ? "Deleting..." : "Delete"}
//       </button>

//       {message ? <p className="text-sm text-red-600">{message}</p> : null}
//     </div>
//   );
// }