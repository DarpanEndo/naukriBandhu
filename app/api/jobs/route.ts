// app/api/jobs/route.ts

import { NextResponse } from "next/server";
import { getDb } from "@/lib/database"; // Using '@/' alias for absolute import

// This function handles GET requests to /api/jobs
export async function GET() {
  try {
    const db = await getDb();

    // Fetch all jobs from the database
    const jobs = await db.all("SELECT * FROM jobs");

    // The 'bookedBy' column is stored as a JSON string.
    // We need to parse it back into an array for each job.
    const parsedJobs = jobs.map((job) => ({
      ...job,
      bookedBy: JSON.parse(job.bookedBy),
    }));

    return NextResponse.json(parsedJobs, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    // Return a server error response
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
