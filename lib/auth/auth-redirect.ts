import { headers } from "next/headers";

import { getSafeNextPath } from "@/lib/auth/safe-next-path";

const PATHNAME_HEADER = "x-lofty-pathname";

export async function getAuthNextPath(explicitPath?: string) {
  const requestHeaders = await headers();
  const requestPath = getSafeNextPath(requestHeaders.get(PATHNAME_HEADER), "");
  const explicitNext = getSafeNextPath(explicitPath, "");

  if (requestPath && explicitNext && !requestPath.startsWith("/api/")) {
    const requestPathname = requestPath.split("?", 1)[0];
    const explicitPathname = explicitNext.split("?", 1)[0];
    if (requestPathname === explicitPathname) return requestPath;
  }

  return explicitNext || requestPath || "/";
}

export async function getLoginUrl(nextPath?: string) {
  const next = await getAuthNextPath(nextPath);
  return next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
}
