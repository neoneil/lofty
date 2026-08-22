import type { Metadata } from "next";

import { BookBuilderClient } from "@/components/admin/book-builder/book-builder-client";
import { getBookBuilderCatalog } from "@/lib/book-builder/catalog";
import type { BookBuilderStudent } from "@/lib/book-builder/types";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "一键成书 | Lofty Admin",
};

export default async function BookBuilderPage() {
  await requireAdminOrEditor("/admin/book-builder");
  const [catalog, profileResult] = await Promise.all([
    getBookBuilderCatalog(),
    createAdminClient().from("profiles").select("id, full_name, email, role").order("full_name", { ascending: true }).limit(500),
  ]);

  if (profileResult.error) {
    console.error("book builder student summary query failed", { message: profileResult.error.message });
  }

  const students: BookBuilderStudent[] = (profileResult.data ?? [])
    .filter((profile) => profile.role !== "admin" && profile.role !== "editor")
    .map((profile) => ({
      id: profile.id,
      name: profile.full_name?.trim() || profile.email || "Student",
      email: profile.email,
    }));

  return <BookBuilderClient catalog={catalog} students={students} />;
}
