// app/api/jobs/book/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/database";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-default-super-secret-key"
);

// Helper function to get the start of the current week (assuming Sunday is the first day)
function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = now.getDate() - day;
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0); // Set to the beginning of the day
  return startOfWeek;
}

export async function POST(request: NextRequest) {
  try {
    // --- 1. Authenticate the User ---
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    const { jobId } = await request.json();
    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // --- 2. Check Weekly Booking Limit (Overwork Prevention) ---
    const startOfWeek = getStartOfWeek();
    const allUserBookedJobs = await db.all(
      `SELECT date, bookedBy FROM jobs WHERE date >= ?`,
      [startOfWeek.toISOString().split("T")[0]] // Query for jobs from this week onwards
    );

    let currentWeekBookings = 0;
    for (const job of allUserBookedJobs) {
      const bookedBy: string[] = JSON.parse(job.bookedBy);
      if (bookedBy.includes(userId)) {
        currentWeekBookings++;
      }
    }

    if (currentWeekBookings >= 14) {
      return NextResponse.json(
        { error: "You have reached your weekly work limit of 14 slots." },
        { status: 403 }
      ); // 403 Forbidden
    }

    // --- 3. Check if the Job Slot is Available (Transaction for safety) ---
    await db.run("BEGIN TRANSACTION");
    const job = await db.get("SELECT * FROM jobs WHERE jobId = ?", [jobId]);

    if (!job) {
      await db.run("ROLLBACK");
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const bookedBy: string[] = JSON.parse(job.bookedBy);

    if (bookedBy.length >= job.slotsRequired) {
      await db.run("ROLLBACK");
      return NextResponse.json(
        { error: "This job slot is already full." },
        { status: 409 }
      );
    }

    if (bookedBy.includes(userId)) {
      await db.run("ROLLBACK");
      return NextResponse.json(
        { error: "You have already booked this slot." },
        { status: 409 }
      );
    }

    // --- 4. All Checks Passed - Book the Job ---
    const updatedBookedBy = [...bookedBy, userId];
    await db.run("UPDATE jobs SET bookedBy = ? WHERE jobId = ?", [
      JSON.stringify(updatedBookedBy),
      jobId,
    ]);

    await db.run("COMMIT");

    return NextResponse.json(
      { success: true, message: "Job booked successfully!" },
      { status: 200 }
    );
  } catch (error: any) {
    // In case of an error during transaction, rollback
    const db = await getDb();
    await db.run("ROLLBACK");

    if (error.code === "ERR_JWT_EXPIRED") {
      return NextResponse.json(
        { error: "Your session has expired. Please log in again." },
        { status: 401 }
      );
    }
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
