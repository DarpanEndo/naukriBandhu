import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/database";
import { otpStore } from "@/lib/otpStore";

export async function POST(request: NextRequest) {
  try {
    const { mobileNumber, otp, userId } = await request.json();

    if (!mobileNumber || !otp || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const storedOtpData = otpStore.get(mobileNumber);

    if (!storedOtpData) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please try again." },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (Date.now() > storedOtpData.expires) {
      otpStore.delete(mobileNumber); // Clean up expired OTP
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP matches
    if (storedOtpData.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    const db = await getDb();
    let user;

    // Check if this is a new registration
    if (storedOtpData.pendingRegistration) {
      const registration = storedOtpData.pendingRegistration;

      // Insert the new user
      await db.run(
        "INSERT INTO laborers (userId, firstName, aadharLast4, mobileNumber) VALUES (?, ?, ?, ?)",
        [
          registration.userId,
          registration.firstName,
          registration.aadharLast4,
          registration.mobileNumber,
        ]
      );

      user = {
        userId: registration.userId,
        firstName: registration.firstName,
      };
    } else {
      // This is a login - fetch existing user
      user = await db.get(
        "SELECT userId, firstName FROM laborers WHERE userId = ? AND mobileNumber = ?",
        [userId, mobileNumber]
      );

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Clean up used OTP
    otpStore.delete(mobileNumber);

    // Create JWT token
    const secret = process.env.JWT_SECRET || "your-default-super-secret-key";
    const token = jwt.sign(
      { userId: user.userId, firstName: user.firstName },
      secret,
      { expiresIn: "7d" }
    );

    // Create response with token cookie
    const response = NextResponse.json(
      { success: true, message: "Login successful!" },
      { status: 200 }
    );

    // Set the token in a secure, httpOnly cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
