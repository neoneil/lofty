import { AppLayout } from "@/components/layout-v2/app-layout";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { requireUser } from "@/lib/auth/require-user";
import { normalizeProfileExamType } from "@/lib/profile/exam-type";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const context = await requireUser();
  const canAccessAdmin = await getAdminAccess(context);
  const { data: profile } = await context.supabase
    .from("profiles")
    .select("exam_type")
    .eq("id", context.user.id)
    .maybeSingle();
  const examType = normalizeProfileExamType(profile?.exam_type);

  return (

    <AppLayout user={context.user} canAccessAdmin={canAccessAdmin} examType={examType}>

      {children}

    </AppLayout>

  );

}
