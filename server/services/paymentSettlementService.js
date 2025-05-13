const Ride = require("../models/Ride.js");
const Stripe = require("stripe");
const fs = require("fs");
const path = require("path");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
const processVendorSettlements = async (startDate, endDate, dryRun = false) => {
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
const generateFinancialReport = async (startDate, endDate) => {
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

    const vendorPayments = paidRides.reduce(
      (sum, ride) => sum + (ride.commissionDetails?.vendorAmount || 0),
      0
    );

    const cancellationCharges = cancelledRides.reduce(
      (sum, ride) =>
        sum +
        (ride.paymentStatus === "PAID" ? ride.finalFare || ride.fare || 0 : 0),
      0
    );

    // Generate the financial report object
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
        vendorPayments: parseFloat(vendorPayments.toFixed(2)),
        cancellationCharges: parseFloat(cancellationCharges.toFixed(2)),
        platformGrossRevenue: parseFloat(
          (platformCommission + cancellationCharges).toFixed(2)
        ),
      },
      details: {
        dailyStats: calculateDailyStats(rides, startDate, endDate),
        paymentMethodStats: calculatePaymentMethodStats(paidRides),
        vendorStats: calculateVendorStats(completedRides),
      },
    };

    // Save the report to a file
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
    };
  }
};

/**
 * Calculate daily statistics for the financial report
 */
const calculateDailyStats = (rides, startDate, endDate) => {
  const dailyStats = {};
  const currentDate = new Date(startDate);
  const endDateCopy = new Date(endDate);

  // Initialize all days in the range
  while (currentDate <= endDateCopy) {
    const dateKey = currentDate.toISOString().split("T")[0];
    dailyStats[dateKey] = {
      date: dateKey,
      totalRides: 0,
      completedRides: 0,
      cancelledRides: 0,
      grossBookingValue: 0,
      platformCommission: 0,
    };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Populate with actual data
  rides.forEach((ride) => {
    const rideDate = new Date(ride.createdAt);
    const dateKey = rideDate.toISOString().split("T")[0];

    if (dailyStats[dateKey]) {
      dailyStats[dateKey].totalRides++;

      if (ride.status === "COMPLETED") {
        dailyStats[dateKey].completedRides++;
      } else if (ride.status === "CANCELLED") {
        dailyStats[dateKey].cancelledRides++;
      }

      if (ride.paymentStatus === "PAID") {
        dailyStats[dateKey].grossBookingValue +=
          ride.finalFare || ride.fare || 0;
        dailyStats[dateKey].platformCommission +=
          ride.commissionDetails?.commissionAmount || 0;
      }
    }
  });

  // Convert object to array for easier consumption
  return Object.values(dailyStats);
};

/**
 * Calculate payment method statistics for the financial report
 */
const calculatePaymentMethodStats = (paidRides) => {
  const stats = {};

  paidRides.forEach((ride) => {
    const method = ride.paymentMethod || "UNKNOWN";

    if (!stats[method]) {
      stats[method] = {
        paymentMethod: method,
        count: 0,
        totalAmount: 0,
      };
    }

    stats[method].count++;
    stats[method].totalAmount += ride.finalFare || ride.fare || 0;
  });

  return Object.values(stats);
};

/**
 * Calculate vendor statistics for the financial report
 */
const calculateVendorStats = (completedRides) => {
  const stats = {};

  completedRides.forEach((ride) => {
    const vendorId = ride.vendorId || "unknown";

    if (!stats[vendorId]) {
      stats[vendorId] = {
        vendorId,
        totalRides: 0,
        totalFare: 0,
        totalCommission: 0,
        totalVendorPayment: 0,
      };
    }

    stats[vendorId].totalRides++;
    stats[vendorId].totalFare += ride.finalFare || ride.fare || 0;
    stats[vendorId].totalCommission +=
      ride.commissionDetails?.commissionAmount || 0;
    stats[vendorId].totalVendorPayment +=
      ride.commissionDetails?.vendorAmount || 0;
  });

  return Object.values(stats);
};

/**
 * Get the settlement status of a specific ride
 * @param {string} rideId - ID of the ride to check
 * @returns {Promise<Object>} Settlement status
 */
const getRideSettlementStatus = async (rideId) => {
  try {
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return {
        success: false,
        message: "Ride not found",
      };
    }

    return {
      success: true,
      rideId,
      isSettled: ride.settlementDetails?.settled || false,
      settlementDate: ride.settlementDetails?.settledAt,
      settlementId: ride.settlementDetails?.settlementId,
      vendorAmount: ride.settlementDetails?.vendorAmount || 0,
      platformCommission: ride.settlementDetails?.platformCommission || 0,
    };
  } catch (error) {
    console.error(`Error getting settlement status for ride ${rideId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  processVendorSettlements,
  generateFinancialReport,
  getRideSettlementStatus,
};
