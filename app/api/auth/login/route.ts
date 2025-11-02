// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/database";
import { otpStore } from "@/lib/otpStore";
import { sendOtp } from "@/lib/smsService";

export async function POST(request: NextRequest) {
  try {
    const { userId, mobileNumber } = await request.json();

    // Basic validation
    if (!userId || !mobileNumber) {
      return NextResponse.json(
        { error: "User ID and Mobile Number are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if the laborer exists in the database
    const laborer = await db.get(
      "SELECT * FROM laborers WHERE userId = ? AND mobileNumber = ?",
      [userId, mobileNumber]
    );

    if (!laborer) {
      return NextResponse.json(
        { error: "Invalid credentials or user not found" },
        { status: 404 }
      );
    }

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const expiryTime = Date.now() + 5 * 60 * 1000; // OTP is valid for 5 minutes

    // Store the OTP
    otpStore.set(mobileNumber, { otp, expires: expiryTime });

    // Send OTP via console
    await sendOtp(mobileNumber, otp);

    return NextResponse.json(
      {
        success: true,
        message: "OTP has been generated.",
        // The line below is for testing only. Remove in production.
        otpForTesting: otp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
