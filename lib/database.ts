// lib/database.ts

import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";

// Let's declare a global variable to hold our database connection
// This is done to cache the connection across hot-reloads in development
// otherwise, a new connection would be established on every code change.
declare global {
  var db: Database | undefined;
}

let db: Database;

export async function getDb() {
  if (db) return db;

  try {
    // Define the path to the database file
    const dbPath = path.join(process.cwd(), "naukribandhu.db");

    const newDb = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log("Database connection established.");
    db = newDb;
    return db;
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw new Error("Could not connect to the database.");
  }
}
