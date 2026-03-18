
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/site/container";

type PostsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { q } = await searchParams;
  const keyword = q?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (keyword) {
    query = query.or(
      `title.ilike.%${keyword}%,excerpt.ilike.%${keyword}%,content.ilike.%${keyword}%`
    );
  }

  const { data: posts, error } = await query;

  return (
    <main className="py-12 sm:py-16">
      <Container>
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Posts</h1>

          <form action="/posts" className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="q"
              defaultValue={keyword}
              placeholder="Search posts..."
              className="w-full rounded-xl border px-4 py-3"
            />
            <button
              type="submit"
              className="rounded-xl border px-5 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Search
            </button>
          </form>
        </div>

        {keyword ? (
          <p className="mb-6 text-sm text-gray-500">
            Search result for: <span className="font-medium">{keyword}</span>
          </p>
        ) : null}

        {error ? (
          <p>加载失败：{error.message}</p>
        ) : !posts || posts.length === 0 ? (
          <p className="text-gray-500">没有找到文章。</p>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm sm:p-6"
              >
                <h2 className="mb-2 text-xl font-semibold sm:text-2xl">
                  <Link href={`/posts/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>

                <p className="mb-3 text-sm text-gray-500">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString()
                    : new Date(post.created_at).toLocaleDateString()}
                </p>
                {post.cover_image && (
                  <Link href={`/posts/${post.slug}`}>
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="aspect-video w-full object-cover rounded-sm mb-6"
                    />
                  </Link>
                )}
                {post.excerpt && (
                  <p className="mb-4 text-gray-700">{post.excerpt}</p>
                )}

                <Link
                  href={`/posts/${post.slug}`}
                  className="text-sm font-medium text-black hover:underline"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
// import Link from "next/link";
// import { createClient } from "@/lib/supabase/server";

// export default async function PostsPage() {
//   const supabase = await createClient();

//   const { data: posts, error } = await supabase
//     .from("posts")
//     .select("id, title, slug, excerpt, published_at, created_at")
//     .eq("status", "published")
//     .order("published_at", { ascending: false });

//   if (error) {
//     return (
//       <main className="mx-auto max-w-4xl px-6 py-12">
//         <h1 className="mb-6 text-3xl font-bold">Posts</h1>
//         <p>加载失败：{error.message}</p>
//       </main>
//     );
//   }

//   return (
//     <main className="mx-auto max-w-4xl px-6 py-12">
//       <h1 className="mb-8 text-3xl font-bold">Posts</h1>

//       {!posts || posts.length === 0 ? (
//         <p>还没有已发布的文章。</p>
//       ) : (
//         <div className="space-y-6">
//           {posts.map((post) => (
//             <article key={post.id} className="rounded-lg border p-5">
//               <h2 className="mb-2 text-2xl font-semibold">
//                 <Link href={`/posts/${post.slug}`} className="hover:underline">
//                   {post.title}
//                 </Link>
//               </h2>

//               <p className="mb-3 text-sm text-gray-500">
//                 {post.published_at
//                   ? new Date(post.published_at).toLocaleDateString()
//                   : "Unpublished"}
//               </p>

//               {post.excerpt && (
//                 <p className="mb-4 text-gray-700">{post.excerpt}</p>
//               )}

//               <Link
//                 href={`/posts/${post.slug}`}
//                 className="inline-block rounded border px-3 py-2 text-sm"
//               >
//                 Read more
//               </Link>
//             </article>
//           ))}
//         </div>
//       )}
//     </main>
//   );
// }