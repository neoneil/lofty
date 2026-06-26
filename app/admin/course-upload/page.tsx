import { requireAdmin } from "@/lib/auth/require-admin";
import CourseUploadClient from "./course-upload-client";

export default async function CourseUploadPage() {
  await requireAdmin("/admin/course-upload");

  return <CourseUploadClient />;
}
