// app/api/gemini/process-voice/route.ts

import { NextRequest, NextResponse } from "next/server";

// --- Alternative Keyword-Based Parsing ---
// This function replaces the Gemini API call.

const parseVoiceCommand = (text: string) => {
  const lowercasedText = text.toLowerCase();
  const response: { location?: string; date?: string } = {};

  // 1. Check for locations
  const locations = ["yelahanka", "jalahalli", "marathahalli"];
  for (const loc of locations) {
    if (lowercasedText.includes(loc)) {
      // Capitalize the first letter for display
      response.location = loc.charAt(0).toUpperCase() + loc.slice(1);
      break; // Stop after finding the first location
    }
  }

  // 2. Check for dates
  const today = new Date("2025-11-02T12:00:00Z"); // Using a fixed date for consistency

  if (lowercasedText.includes("today")) {
    response.date = today.toISOString().split("T")[0]; // "2025-11-02"
  } else if (lowercasedText.includes("tomorrow")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    response.date = tomorrow.toISOString().split("T")[0];
  } else {
    // Simple regex to find a date like "November 5th" or "Nov 5"
    const dateRegex =
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})/i;
    const match = lowercasedText.match(dateRegex);
    if (match) {
      const monthName = match[1];
      const day = parseInt(match[2], 10);
      const monthMap: { [key: string]: number } = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const month = monthMap[monthName.substring(0, 3)];
      if (month !== undefined && day) {
        const year = 2025;
        // Format to YYYY-MM-DD
        response.date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
      }
    }
  }

  return response;
};

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Use our local parsing function instead of the API
    const jsonResponse = parseVoiceCommand(text);

    return NextResponse.json(jsonResponse, { status: 200 });
  } catch (error) {
    console.error("Local parsing error:", error);
    return NextResponse.json(
      { error: "Failed to process voice command locally" },
      { status: 500 }
    );
  }
}
