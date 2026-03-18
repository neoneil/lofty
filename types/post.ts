export type PostStatus = "draft" | "published";
export type PostCategory = "Understanding Children" | "Teaching Practice" | "Family Education" | "Teacher Reflection";
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  status: PostStatus;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category: PostCategory;
}