import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/database";
import { sendOtp } from "@/lib/smsService";
import { otpStore } from "@/lib/otpStore";

export async function POST(request: NextRequest) {
  try {
    const { firstName, aadharLast4, mobileNumber } = await request.json();

    if (!firstName || !aadharLast4 || !mobileNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate Aadhar last 4 digits
    if (!/^\d{4}$/.test(aadharLast4)) {
      return NextResponse.json(
        { error: "Invalid Aadhar number format" },
        { status: 400 }
      );
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(mobileNumber)) {
      return NextResponse.json(
        { error: "Invalid mobile number format" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if mobile number is already registered
    const existingUser = await db.get(
      "SELECT userId FROM laborers WHERE mobileNumber = ?",
      [mobileNumber]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "Mobile number already registered" },
        { status: 409 }
      );
    }

    // Generate userId (firstName + aadharLast4)
    const userId = `${firstName.toLowerCase()}${aadharLast4}`;

    // Check if userId already exists
    const existingUserId = await db.get(
      "SELECT userId FROM laborers WHERE userId = ?",
      [userId]
    );

    if (existingUserId) {
      return NextResponse.json(
        { error: "User ID already exists" },
        { status: 409 }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(mobileNumber, {
      otp,
      expires: otpExpiry,
      pendingRegistration: {
        userId,
        firstName,
        aadharLast4,
        mobileNumber,
      },
    });

    // Send OTP
    const smsSent = await sendOtp(mobileNumber, otp);

    if (!smsSent) {
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 500 }
      );
    }

    // In development, send OTP in response for testing
    const devResponse =
      process.env.NODE_ENV === "development" ? { otpForTesting: otp } : {};

    return NextResponse.json({
      message: "OTP sent successfully",
      userId, // Send back userId for the verification step
      ...devResponse,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
