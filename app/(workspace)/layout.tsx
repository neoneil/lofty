import { AppLayout } from "@/components/layout-v2/app-layout";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <AppLayout>

      {children}

    </AppLayout>

  );

}