import { withAuth } from "next-auth/middleware";

const PUBLIC = ["/login", "/invite", "/forgot", "/reset"];

export default withAuth(
  function middleware() {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (PUBLIC.some((p) => pathname.startsWith(p))) return true;
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
