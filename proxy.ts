// proxy.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-default-super-secret-key"
);

export async function proxy(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")?.value;

  // If the user is trying to access the login page but is already logged in,
  // redirect them to the dashboard.
  if (authToken && request.nextUrl.pathname.startsWith("/login")) {
    try {
      await jwtVerify(authToken, secret);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
      // Token is invalid, let them proceed to login
    }
  }

  // If the user is trying to access a protected route (e.g., dashboard)
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!authToken) {
      // No token found, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // Verify the token
      await jwtVerify(authToken, secret);
      // Token is valid, allow the request to proceed
      return NextResponse.next();
    } catch (error) {
      // Token is invalid (expired, malformed, etc.), redirect to login
      console.log("Invalid token, redirecting to login.");
      const response = NextResponse.redirect(new URL("/login", request.url));
      // Clear the invalid cookie
      response.cookies.set("auth_token", "", { maxAge: -1 });
      return response;
    }
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

// This config specifies which routes the middleware should run on.
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
