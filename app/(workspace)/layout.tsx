import { AppLayout } from "@/components/layout-v2/app-layout";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { requireUser } from "@/lib/auth/require-user";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const context = await requireUser();
  const canAccessAdmin = await getAdminAccess(context);

  return (

    <AppLayout user={context.user} canAccessAdmin={canAccessAdmin}>

      {children}

    </AppLayout>

  );

}
