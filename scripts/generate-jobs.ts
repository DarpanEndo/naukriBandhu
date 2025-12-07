// scripts/generate-jobs.ts
import { writeFile } from "fs/promises";
import path from "path";

const locations = [
  { name: "Yelahanka", variations: "yelahanka yelankha" },
  { name: "Jalahalli", variations: "jalahalli jalalli jalhalli" },
  { name: "Whitefield", variations: "whitefield white field" },
  { name: "Electronic City", variations: "electronic city ecity e-city" },
  { name: "Indiranagar", variations: "indiranagar indira nagar" },
  { name: "HSR Layout", variations: "hsr layout hsr" },
  { name: "Koramangala", variations: "koramangala kormangala" },
  { name: "BTM Layout", variations: "btm layout btm" },
  { name: "JP Nagar", variations: "jp nagar jayanagar" },
  { name: "Banashankari", variations: "banashankari banashankri" },
];

const workTypes = [
  "Construction",
  "Loading/Unloading",
  "Gardening",
  "Cleaning",
  "Painting",
  "Moving",
  "Warehouse",
  "Event Setup",
  "Road Work",
  "Plumbing",
];

const employers = [
  "Krishna Construction Co",
  "City Movers & Packers",
  "Green Earth Gardens",
  "Clean Pro Services",
  "Metro Project",
  "BuildRight Construction",
  "Event Management Pro",
  "City Maintenance",
  "Road Builders Corp",
  "Warehouse Solutions",
];

function generateJobs() {
  const jobs = [];
  let jobId = 1;

  // Generate jobs from Nov 1 to Nov 25, 2025
  for (let day = 1; day <= 25; day++) {
    // Generate 4-5 jobs per day
    const jobsPerDay = Math.floor(Math.random() * 2) + 4;

    for (let j = 0; j < jobsPerDay; j++) {
      const location = locations[Math.floor(Math.random() * locations.length)];
      const workType = workTypes[Math.floor(Math.random() * workTypes.length)];
      const employer = employers[Math.floor(Math.random() * employers.length)];

      const wageMin = Math.floor(Math.random() * 400) + 600; // 600-1000
      const wageMax = wageMin + Math.floor(Math.random() * 400) + 100; // min + 100-500

      const job = {
        jobId: `job_${jobId.toString().padStart(3, "0")}`,
        employer,
        location: location.name,
        normalizedLocation: location.variations,
        date: `2025-11-${day.toString().padStart(2, "0")}`,
        startTime: `${Math.floor(Math.random() * 4) + 6}:00`, // 6:00 - 9:00
        endTime: `${Math.floor(Math.random() * 6) + 16}:00`, // 16:00 - 21:00
        wageMin,
        wageMax,
        wageBonus: Math.floor(Math.random() * 200) + 50, // 50-250
        slotsRequired: Math.floor(Math.random() * 8) + 2, // 2-10
        bookedBy: [],
        workType,
        requirements: ["Basic tools knowledge", "Physical labor"],
        address: `Near ${location.name}, Bangalore`,
      };

      jobs.push(job);
      jobId++;
    }
  }

  return jobs;
}

async function main() {
  const jobs = generateJobs();
  const outputPath = path.join(process.cwd(), "data", "jobs.json");
  await writeFile(outputPath, JSON.stringify(jobs, null, 2));
  console.log(`Generated ${jobs.length} jobs`);
}

main().catch(console.error);
