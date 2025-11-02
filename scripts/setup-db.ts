// scripts/setup-db.ts
import { getDb } from "../lib/database";
import { readFile } from "fs/promises";
import path from "path";

async function setup() {
  try {
    console.log("Setting up database...");
    const db = await getDb();

    console.log("Dropping existing tables if they exist...");
    await db.run("DROP TABLE IF EXISTS laborers");
    await db.run("DROP TABLE IF EXISTS jobs");

    console.log("Creating tables...");

    // Create laborers table
    await db.run(
      "CREATE TABLE IF NOT EXISTS laborers (userId TEXT PRIMARY KEY, firstName TEXT NOT NULL, aadharLast4 TEXT NOT NULL, mobileNumber TEXT UNIQUE NOT NULL)"
    );

    // Create jobs table
    await db.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        jobId TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        wage INTEGER NOT NULL,
        wageBonus INTEGER NOT NULL,
        slotsRequired INTEGER NOT NULL,
        bookedBy TEXT NOT NULL DEFAULT '[]',
        workType TEXT NOT NULL,
        requirements TEXT NOT NULL DEFAULT '[]',
        address TEXT NOT NULL
      )
    `);

    console.log("Reading initial data...");
    const laborersPath = path.join(process.cwd(), "data", "laborers.json");
    const jobsPath = path.join(process.cwd(), "data", "jobs.json");

    const laborersData = JSON.parse(await readFile(laborersPath, "utf8"));
    const jobsData = JSON.parse(await readFile(jobsPath, "utf8"));

    console.log("Inserting data...");

    // Insert laborers
    const insertLaborerStmt = await db.prepare(`
    INSERT INTO laborers (userId, firstName, aadharLast4, mobileNumber)
    VALUES (?, ?, ?, ?)
  `);

    for (const laborer of laborersData) {
      await insertLaborerStmt.run(
        laborer.userId,
        laborer.firstName,
        laborer.aadharLast4,
        laborer.mobileNumber
      );
    }

    // Insert jobs
    const insertJobStmt = await db.prepare(`
    INSERT INTO jobs (
      jobId, title, description, wage, wageBonus, 
      slotsRequired, bookedBy, workType, requirements, address
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const job of jobsData) {
      await insertJobStmt.run(
        job.jobId,
        job.title,
        job.description,
        job.wage,
        job.wageBonus,
        job.slotsRequired,
        JSON.stringify(job.bookedBy || []),
        job.workType,
        JSON.stringify(job.requirements || []),
        job.address
      );
    }

    console.log("Database setup complete!");
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setup();
