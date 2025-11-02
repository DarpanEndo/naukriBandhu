// app/api/auth/logout/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// This function handles POST requests to /api/auth/logout
export async function POST() {
  try {
    // Clear the authentication cookie by setting its maxAge to a past date
    (await cookies()).set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: -1, // Expire the cookie immediately
      path: "/",
    });

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
