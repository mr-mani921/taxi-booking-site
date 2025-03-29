#!/usr/bin/env node

/**
 * This script allows manual execution of the daily settlement process.
 * It can be run via npm: npm run settlement:daily
 * Or directly: node scripts/runDailySettlement.js
 *
 * Optional command line arguments:
 * --date YYYY-MM-DD  : Process settlements for a specific date
 * --dry-run          : Run without making actual transfers
 * --yesterday        : Process settlements for yesterday (default)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { processVendorSettlements } from "../services/paymentSettlementService.js";
import connectDB from "../config/dbConfig.js";

// Get directory name from ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");

// Load environment variables
dotenv.config({ path: envPath });

// Parse command line arguments
const args = process.argv.slice(2);
let targetDate = null;
let dryRun = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--date" && i + 1 < args.length) {
    const dateStr = args[i + 1];
    targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      console.error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD format.`);
      process.exit(1);
    }
    i++; // Skip the next argument as it's the date value
  } else if (args[i] === "--dry-run") {
    dryRun = true;
  } else if (args[i] === "--yesterday") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    targetDate = yesterday;
  }
}

// Default to yesterday if no date provided
if (!targetDate) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  targetDate = yesterday;
}

// Set up date range for the settlement (full day)
const startDate = new Date(targetDate);
startDate.setHours(0, 0, 0, 0);

const endDate = new Date(targetDate);
endDate.setHours(23, 59, 59, 999);

const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// Main function to run the settlement
async function runSettlement() {
  try {
    // Connect to the database
    await connectDB();

    console.log(
      `Starting ${dryRun ? "DRY RUN " : ""}settlement process for ${formatDate(
        targetDate
      )}`
    );
    console.log(
      `Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // Process settlements
    const result = await processVendorSettlements(startDate, endDate, dryRun);

    // Display results
    console.log("\nSettlement Results:");
    console.log("===================");
    console.log(`Status: ${result.success ? "Success" : "Failed"}`);

    if (result.success) {
      console.log(`Rides processed: ${result.ridesProcessed}`);
      console.log(
        `Total vendor payments: $${result.totalVendorPayments.toFixed(2)}`
      );
      console.log(
        `Total platform commission: $${result.totalPlatformCommission.toFixed(
          2
        )}`
      );

      if (result.vendorDetails?.length > 0) {
        console.log("\nVendor Breakdown:");
        result.vendorDetails.forEach((vendor) => {
          console.log(
            `- ${vendor.vendorId}: ${
              vendor.rideCount
            } rides, $${vendor.totalPayment.toFixed(
              2
            )} paid, $${vendor.totalCommission.toFixed(2)} commission`
          );
        });
      }
    } else {
      console.error(`Error: ${result.error}`);
    }

    console.log("\nSettlement completed");
    process.exit(0);
  } catch (error) {
    console.error("Error running settlement:", error);
    process.exit(1);
  }
}

// Run the settlement process
runSettlement();
