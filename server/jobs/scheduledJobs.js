const cron = require("node-cron");
const {
  processVendorSettlements,
  generateFinancialReport,
} = require("../services/paymentSettlementService.js");
const Ride = require("../models/Ride.js");
const { sendIgoRequest } = require("../services/igoService.js");
const igoConfig = require("../config/igoConfig.js");

/**
 * Scheduled Jobs Service
 *
 * This module sets up all scheduled background jobs for the application
 * using node-cron. Jobs include:
 *
 * 1. Daily settlement processing
 * 2. Weekly financial reports
 * 3. Status check for active rides
 * 4. Cleanup of old temporary data
 */

// Define job schedules
const SCHEDULES = {
  DAILY_SETTLEMENT: "0 1 * * *", // 1 AM every day
  WEEKLY_REPORT: "0 2 * * 0", // 2 AM every Sunday
  HOURLY_RIDE_STATUS_CHECK: "0 * * * *", // Every hour
  CLEANUP_OLD_DATA: "0 3 * * 0", // 3 AM every Sunday
};

/**
 * Initialize all scheduled jobs
 */
const initScheduledJobs = () => {
  // Skip scheduling in test environment
  if (process.env.NODE_ENV === "test") {
    console.log("Skipping scheduled jobs in test environment");
    return;
  }

  // Daily settlement processing
  cron.schedule(SCHEDULES.DAILY_SETTLEMENT, async () => {
    console.log("Running daily vendor settlement job");
    try {
      // Process settlements for the previous day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await processVendorSettlements(yesterday, today);
      console.log(
        `Settlement job completed: ${result.ridesProcessed} rides processed`
      );
    } catch (error) {
      console.error("Error in daily settlement job:", error);
    }
  });

  // Weekly financial report generation
  cron.schedule(SCHEDULES.WEEKLY_REPORT, async () => {
    console.log("Running weekly financial report job");
    try {
      // Generate report for the last week
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await generateFinancialReport(lastWeekStart, today);
      console.log(
        `Weekly report generated with ${result.summary?.totalRides || 0} rides`
      );
    } catch (error) {
      console.error("Error in weekly report job:", error);
    }
  });

  // Hourly check for active ride statuses
  cron.schedule(SCHEDULES.HOURLY_RIDE_STATUS_CHECK, async () => {
    console.log("Running hourly ride status check");
    try {
      // Find all rides in active states that haven't been updated recently
      const activeStatuses = [
        igoConfig.rideStatuses.BOOKED,
        igoConfig.rideStatuses.DRIVER_ASSIGNED,
        igoConfig.rideStatuses.DRIVER_ARRIVED,
        igoConfig.rideStatuses.JOURNEY_STARTED,
      ];

      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const staleRides = await Ride.find({
        status: { $in: activeStatuses },
        updatedAt: { $lt: twoHoursAgo },
      });

      console.log(`Found ${staleRides.length} potentially stale rides`);

      // Check status for each stale ride
      for (const ride of staleRides) {
        if (!ride.igoAuthorizationReference) continue;

        try {
          console.log(`Checking status for ride ${ride._id}`);

          // Request status from iGo
          const statusResponse = await sendIgoRequest(
            igoConfig.buildXmlRequest({
              AgentBookingStatusRequest: {
                Agent: igoConfig.buildAgentSection(),
                Vendor: igoConfig.buildVendorSection(),
                AuthorizationReference: ride.igoAuthorizationReference,
              },
            })
          );

          if (statusResponse && statusResponse.AgentBookingStatusResponse) {
            const igoStatus = statusResponse.AgentBookingStatusResponse.Status;
            console.log(`Received status ${igoStatus} for ride ${ride._id}`);

            // Only update if the status is different
            if (ride.status !== igoStatus) {
              ride.status = igoStatus;
              ride.eventHistory.push({
                event: "STATUS_UPDATED_BY_SYSTEM",
                timestamp: new Date(),
                details: `Status updated from job: ${igoStatus}`,
              });
              await ride.save();
              console.log(`Updated ride ${ride._id} status to ${igoStatus}`);
            }
          }
        } catch (error) {
          console.error(`Error checking ride ${ride._id} status:`, error);
        }
      }
    } catch (error) {
      console.error("Error in hourly ride status check job:", error);
    }
  });

  // Weekly cleanup of old data
  cron.schedule(SCHEDULES.CLEANUP_OLD_DATA, async () => {
    console.log("Running weekly data cleanup job");
    try {
      // Clean up expired or temporary data older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // In a real implementation, you would clean up:
      // - Temporary files
      // - Log files
      // - Failed booking attempts
      // - Expired tokens
      // - etc.

      console.log("Weekly cleanup job completed");
    } catch (error) {
      console.error("Error in weekly cleanup job:", error);
    }
  });

  console.log("All scheduled jobs initialized");
};

// Export schedules for testing and debugging
const JobSchedules = SCHEDULES;

module.exports = {
  initScheduledJobs,
  JobSchedules,
};
