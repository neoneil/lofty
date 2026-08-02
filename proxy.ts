import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  createServerClient,
} from "@supabase/ssr";

export async function proxy(
  request: NextRequest,
) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lofty-pathname", `${pathname}${request.nextUrl.search}`);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  /////////////////////////////////////////
  // maintenance mode

  const maintenanceMode =
    process.env
      .NEXT_PUBLIC_MAINTENANCE_MODE ===
    "true";

  // 放行 maintenance 页面

  if (
    pathname.startsWith(
      "/maintenance",
    )
  ) {
    return response;
  }

  // 放行静态资源

  if (
    pathname.startsWith(
      "/_next",
    ) ||
    pathname.startsWith(
      "/favicon",
    ) ||
    pathname.startsWith(
      "/lottie",
    )
  ) {
    return response;
  }

  // 开启维护模式

  if (maintenanceMode) {
    return NextResponse.redirect(
      new URL(
        "/maintenance",
        request.url,
      ),
    );
  }

  /////////////////////////////////////////
  // protected routes only

  const protectedRoutes = [
    "/account",
    "/achievements",
    "/admin",
    "/analytics",
    "/audio-collection",
    "/classroom",
    "/dashboard",
    "/downloads",
    "/homework",
    "/ielts",
    "/learning-video",
    "/mock-test",
    "/my-courses",
    "/pte",
    "/pte-templates",
    "/settings",
    "/study-plan",
    "/workspace",
  ];

  const isProtectedRoute =
    protectedRoutes.some(
      (route) =>
        pathname.startsWith(route),
    ); 

  // 非保护页面直接放行

  if (!isProtectedRoute) {
    return response;
  }

  /////////////////////////////////////////
  // auth only for protected routes

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet,
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) =>
                response.cookies.set(
                  name,
                  value,
                  options,
                ),
            );
          },
        },
      },
    );

  await supabase.auth.getUser();

  return response;

}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
