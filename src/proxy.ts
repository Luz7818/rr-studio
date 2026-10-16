import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** SaaS 模式下:未登录访问应用页跳 /login,已登录访问登录页跳回 /。本地模式(next dev 无 env)直接放行 */
export async function proxy(request: NextRequest) {
  if (!configured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let user: { id?: string } | null = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    // Supabase 不可达时按未登录处理,不阻塞页面
  }

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  // 落地页与定价页对未登录访客开放
  const isPublicPage = pathname === "/" || pathname === "/pricing";

  if (!user && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|auth/callback|_next/static|_next/image|favicon.ico).*)"],
};
