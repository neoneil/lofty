import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/site/container";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = profile?.role ?? null;
  }

  const canManagePosts = role === "admin" || role === "editor";

  const { data: posts } = await supabase
    .from("posts")
    .select("title, slug, excerpt, published_at, cover_image")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(6);

  return (
    <main className="py-12 sm:py-16 lg:py-20">
      <Container>
        <section className="mb-14 sm:mb-16">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-sm">
              Personal Blog
            </p>

            <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Thoughts on code, learning, and building things.
            </h1>

            <p className="max-w-2xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
              I write about web development, education, tools, and practical
              ideas worth sharing.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/posts"
                className="btn-primary"
              >
                Browse Posts
              </Link>

              {canManagePosts && (
                <Link
                  href="/admin/posts/new"
                  className="btn-secondary"
                >
                  Write Post
                </Link>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <h2 className="text-xl font-semibold sm:text-2xl">Latest Posts</h2>

            <Link
              href="/posts"
              className="text-sm text-gray-500 hover:text-black"
            >
              View all →
            </Link>
          </div>

          {!posts || posts.length === 0 ? (
            <p className="text-gray-500">No published posts yet.</p>
          ) : (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="card overflow-hidden"
                >

                  {post.cover_image && (
                    <Link href={`/posts/${post.slug}`}>
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="aspect-video w-full object-cover rounded-sm"
                      />
                    </Link>
                  )}
                  <p className="mb-3 text-sm text-gray-500">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : ""}
                  </p>

                  <h3 className="mb-3 text-xl font-semibold leading-tight sm:text-2xl">
                    <Link href={`/posts/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h3>

                  {post.excerpt && (
                    <p className="mb-5 text-sm leading-7 text-gray-600 sm:text-base">
                      {post.excerpt}
                    </p>
                  )}

                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-sm font-medium text-black hover:underline"
                  >
                    Read article →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
// import Link from "next/link";
// import { createClient } from "@/lib/supabase/server";
// import LogoutButton from "@/components/auth/logout-button";

// export default async function HomePage() {
//   const supabase = await createClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   const { data: posts, error } = await supabase
//     .from("posts")
//     .select("title, slug, excerpt, published_at")
//     .eq("status", "published")
//     .order("published_at", { ascending: false })
//     .limit(5);

//   return (
//     <main className="mx-auto max-w-4xl px-6 py-12">
//       <h1 className="mb-6 text-3xl font-bold">My Blog</h1>
//       <p className="mb-8 text-gray-600">
//         Thoughts on parenting and Tarot.
//       </p>
//       <div className="mb-8">
//         <Link href="/posts" className="rounded border px-3 py-2">
//           View Posts
//         </Link>
//       </div>

//       {user ? (
//         <div className="mb-10 space-y-4">
//           <p>已登录：{user.email}</p>
//           <LogoutButton />
//         </div>
//       ) : (
//         <div className="mb-10 space-x-4">
//           <Link href="/login" className="rounded border px-3 py-2">
//             Login
//           </Link>
//           <Link href="/sign-up" className="rounded border px-3 py-2">
//             Sign up
//           </Link>
//         </div>
//       )}

//       <section>
//         <h2 className="mb-6 text-2xl font-semibold">Latest Posts</h2>

//         {error ? (
//           <p>加载文章失败：{error.message}</p>
//         ) : !posts || posts.length === 0 ? (
//           <p>还没有已发布的文章。</p>
//         ) : (
//           <div className="space-y-6">
//             {posts.map((post) => (
//               <article key={post.slug} className="rounded-lg border p-5">
//                 <h3 className="mb-2 text-xl font-semibold">
//                   <Link
//                     href={`/posts/${post.slug}`}
//                     className="hover:underline"
//                   >
//                     {post.title}
//                   </Link>
//                 </h3>

//                 <p className="mb-3 text-sm text-gray-500">
//                   {post.published_at
//                     ? new Date(post.published_at).toLocaleDateString()
//                     : ""}
//                 </p>

//                 {post.excerpt && (
//                   <p className="text-gray-700">{post.excerpt}</p>
//                 )}
//               </article>
//             ))}
//           </div>
//         )}
//       </section>
//     </main>
//   );
// }
