import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  ///////////////////////////////////////// maintenance mode

  const maintenanceMode =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  const pathname = request.nextUrl.pathname;

  // 放行 maintenance 页面
  if (pathname.startsWith("/maintenance")) {
    return response;
  }

  // 放行静态资源
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/lottie")
  ) {
    return response;
  }

  // 开启维护模式
  if (maintenanceMode) {
    return NextResponse.redirect(
      new URL("/maintenance", request.url)
    );
  }
  //////////////////////////////////////////////////// maintenance mode ends here




  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};