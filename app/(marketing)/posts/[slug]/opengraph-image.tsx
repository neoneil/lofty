import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  const title = post?.title ?? "My Blog";
  const excerpt = post?.excerpt ?? "Read the latest article on My Blog";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #111, #333)",
          color: "white",
          padding: "60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: "90%",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            opacity: 0.8,
            maxWidth: "80%",
          }}
        >
          {excerpt}
        </div>
      </div>
    ),
    size
  );
}