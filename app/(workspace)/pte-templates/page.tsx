import { requireUser } from "@/lib/auth/require-user";
import { getServerUserWithRole } from "@/lib/auth/server-auth";
import PteTemplatesClient from "@/components/site/pte-templates-client";

export default async function PTETemplatesPage() {
  const userContext = await requireUser("/pte-templates");
  const isAdmin = Boolean(await getServerUserWithRole(["admin"], userContext));

  return <PteTemplatesClient canDownloadPdf={isAdmin} />;
}
