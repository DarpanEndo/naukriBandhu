import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-default-super-secret-key"
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      userId: payload.userId,
      firstName: payload.firstName,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
