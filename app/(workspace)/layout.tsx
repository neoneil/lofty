import { AppLayout } from "@/components/layout-v2/app-layout";
import { requireUser } from "@/lib/auth/require-user";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { user } = await requireUser();

  return (

    <AppLayout user={user}>

      {children}

    </AppLayout>

  );

}
