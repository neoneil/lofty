import { AppLayout } from "@/components/layout-v2/app-layout";

import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (

    <AppLayout user={user}>

      {children}

    </AppLayout>

  );

}