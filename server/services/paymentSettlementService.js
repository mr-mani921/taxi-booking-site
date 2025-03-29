import Ride from "../models/Ride.js";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Payment Settlement Service
 *
 * This service is responsible for:
 * 1. Processing vendor settlements for completed rides
 * 2. Generating financial reports
 * 3. Tracking payment transfers to vendors
 */

/**
 * Process vendor settlements for completed rides within a date range
 * This function would typically be called by a scheduled job
 *
 * @param {Date} startDate - Start date for settlement period
 * @param {Date} endDate - End date for settlement period
 * @param {Boolean} dryRun - If true, only generate report without making actual transfers
 * @returns {Object} Settlement report with summary and details
 */
export const processVendorSettlements = async (
  startDate,
  endDate,
  dryRun = false
) => {
  try {
    // Get all completed and paid rides within the date range
    // that haven't been settled with vendors yet
    const rides = await Ride.find({
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentDate: { $gte: startDate, $lte: endDate },
      "settlementDetails.settled": { $ne: true },
    });

    if (rides.length === 0) {
      return {
        success: true,
        message: "No rides found for settlement in the specified period",
        settlementDate: new Date(),
        periodStart: startDate,
        periodEnd: endDate,
        ridesProcessed: 0,
        totalVendorPayments: 0,
        totalPlatformCommission: 0,
      };
    }

    // Group rides by vendor for batch processing
    const vendorGroups = {};
    for (const ride of rides) {
      const vendorId = ride.vendorId || "unknown";
      if (!vendorGroups[vendorId]) {
        vendorGroups[vendorId] = [];
      }
      vendorGroups[vendorId].push(ride);
    }

    const settlementReport = {
      success: true,
      settlementDate: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
      ridesProcessed: rides.length,
      totalVendorPayments: 0,
      totalPlatformCommission: 0,
      vendorDetails: [],
    };

    // Process each vendor group
    for (const [vendorId, vendorRides] of Object.entries(vendorGroups)) {
      const vendorTotal = vendorRides.reduce(
        (sum, ride) => sum + (ride.commissionDetails?.vendorAmount || 0),
        0
      );

      const commissionTotal = vendorRides.reduce(
        (sum, ride) => sum + (ride.commissionDetails?.commissionAmount || 0),
        0
      );

      settlementReport.totalVendorPayments += vendorTotal;
      settlementReport.totalPlatformCommission += commissionTotal;

      const vendorSettlement = {
        vendorId,
        rideCount: vendorRides.length,
        totalPayment: vendorTotal,
        totalCommission: commissionTotal,
        rides: vendorRides.map((ride) => ({
          rideId: ride._id,
          bookingId: ride.igoBookingId,
          date: ride.completedAt || ride.updatedAt,
          fare: ride.finalFare || ride.fare,
          vendorAmount: ride.commissionDetails?.vendorAmount || 0,
          platformCommission: ride.commissionDetails?.commissionAmount || 0,
        })),
      };

      // If not a dry run, perform actual settlement
      if (!dryRun) {
        try {
          // In production, this would integrate with your payment processor
          // to transfer funds to the vendor's account

          // Example using Stripe Transfers (requires vendor to be a Connected Account)
          // const transfer = await stripe.transfers.create({
          //   amount: Math.round(vendorTotal * 100), // Convert to cents
          //   currency: 'usd',
          //   destination: vendorId, // Vendor's Stripe account ID
          //   description: `Settlement for ${vendorRides.length} rides from ${startDate.toISOString()} to ${endDate.toISOString()}`
          // });

          // For demo purposes, we'll just mark the rides as settled
          vendorSettlement.transferId = `mock_transfer_${Date.now()}`;
          vendorSettlement.transferStatus = "completed";

          // Update each ride with settlement details
          for (const ride of vendorRides) {
            ride.settlementDetails = {
              settled: true,
              settledAt: new Date(),
              settlementId: vendorSettlement.transferId,
              vendorAmount: ride.commissionDetails?.vendorAmount || 0,
              platformCommission: ride.commissionDetails?.commissionAmount || 0,
            };
            await ride.save();
          }
        } catch (error) {
          console.error(`Error settling vendor ${vendorId}:`, error);
          vendorSettlement.error = error.message;
          vendorSettlement.transferStatus = "failed";
        }
      } else {
        vendorSettlement.dryRun = true;
      }

      settlementReport.vendorDetails.push(vendorSettlement);
    }

    // Generate and save settlement report
    const reportFileName = `settlement_report_${
      startDate.toISOString().split("T")[0]
    }_to_${endDate.toISOString().split("T")[0]}.json`;
    const reportPath = path.join(__dirname, "../reports", reportFileName);

    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(settlementReport, null, 2));

    return settlementReport;
  } catch (error) {
    console.error("Error processing vendor settlements:", error);
    return {
      success: false,
      error: error.message,
      settlementDate: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
    };
  }
};

/**
 * Generate a financial report for a specific period
 *
 * @param {Date} startDate - Start date for report period
 * @param {Date} endDate - End date for report period
 * @returns {Object} Financial report with summary metrics
 */
export const generateFinancialReport = async (startDate, endDate) => {
  try {
    // Get all rides in the date range
    const rides = await Ride.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Calculate financial metrics
    const completedRides = rides.filter((ride) => ride.status === "COMPLETED");
    const cancelledRides = rides.filter((ride) => ride.status === "CANCELLED");
    const paidRides = rides.filter((ride) => ride.paymentStatus === "PAID");

    const grossBookingValue = paidRides.reduce(
      (sum, ride) => sum + (ride.finalFare || ride.fare || 0),
      0
    );

    const platformCommission = paidRides.reduce(
      (sum, ride) => sum + (ride.commissionDetails?.commissionAmount || 0),
      0
    );

    const vendorPayouts = paidRides.reduce(
      (sum, ride) => sum + (ride.commissionDetails?.vendorAmount || 0),
      0
    );

    // Group by payment methods
    const paymentMethods = {};
    for (const ride of paidRides) {
      const method = ride.paymentMethod || "UNKNOWN";
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          count: 0,
          amount: 0,
        };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += ride.finalFare || ride.fare || 0;
    }

    // Summary report
    const report = {
      periodStart: startDate,
      periodEnd: endDate,
      generatedAt: new Date(),
      summary: {
        totalRides: rides.length,
        completedRides: completedRides.length,
        cancelledRides: cancelledRides.length,
        paidRides: paidRides.length,
        grossBookingValue: parseFloat(grossBookingValue.toFixed(2)),
        platformCommission: parseFloat(platformCommission.toFixed(2)),
        vendorPayouts: parseFloat(vendorPayouts.toFixed(2)),
        platformMargin:
          grossBookingValue > 0
            ? parseFloat(
                ((platformCommission / grossBookingValue) * 100).toFixed(2)
              )
            : 0,
      },
      paymentMethods: Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        count: data.count,
        amount: parseFloat(data.amount.toFixed(2)),
        percentage:
          grossBookingValue > 0
            ? parseFloat(((data.amount / grossBookingValue) * 100).toFixed(2))
            : 0,
      })),
    };

    // Generate and save report
    const reportFileName = `financial_report_${
      startDate.toISOString().split("T")[0]
    }_to_${endDate.toISOString().split("T")[0]}.json`;
    const reportPath = path.join(__dirname, "../reports", reportFileName);

    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  } catch (error) {
    console.error("Error generating financial report:", error);
    return {
      success: false,
      error: error.message,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }
};

/**
 * Get settlement status for a specific ride
 *
 * @param {string} rideId - ID of the ride
 * @returns {Object} Settlement status and details
 */
export const getRideSettlementStatus = async (rideId) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return { success: false, message: "Ride not found" };
    }

    // Return settlement status
    return {
      success: true,
      rideId: ride._id,
      bookingId: ride.igoBookingId,
      settled: ride.settlementDetails?.settled || false,
      settledAt: ride.settlementDetails?.settledAt,
      settlementId: ride.settlementDetails?.settlementId,
      vendorAmount:
        ride.settlementDetails?.vendorAmount ||
        ride.commissionDetails?.vendorAmount ||
        0,
      platformCommission:
        ride.settlementDetails?.platformCommission ||
        ride.commissionDetails?.commissionAmount ||
        0,
    };
  } catch (error) {
    console.error("Error getting ride settlement status:", error);
    return { success: false, error: error.message };
  }
};
