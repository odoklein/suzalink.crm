import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow access to portal routes (they have their own token validation)
    if (path.startsWith("/portal/")) {
      return NextResponse.next();
    }

    // Allow access to login page
    if (path === "/login") {
      return NextResponse.next();
    }

    // Allow access to API routes (they handle their own auth)
    if (path.startsWith("/api/")) {
      return NextResponse.next();
    }

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role-based access control
    const userRole = token.role;

    // Admin and Manager can access everything
    if (userRole === "ADMIN" || userRole === "MANAGER") {
      return NextResponse.next();
    }

    // BD role restrictions
    if (userRole === "BD") {
      // BDs cannot access admin-only routes
      if (path.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow portal, login, and API routes without auth
        if (path.startsWith("/portal/") || path === "/login" || path.startsWith("/api/")) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

