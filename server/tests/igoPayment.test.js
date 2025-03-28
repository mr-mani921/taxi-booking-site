import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import app from "../server.js";
import User from "../models/User.js";
import Ride from "../models/Ride.js";
import igoConfig from "../config/igoConfig.js";
import dotenv from "dotenv";

dotenv.config();

// Mock iGo service
jest.mock("../services/igoService.js", () => {
  return {
    estimatePrice: jest.fn().mockResolvedValue({
      AgentPriceEstimateResponse: {
        Price: 25.5,
        Currency: "USD",
        EstimatedTime: 15,
      },
    }),
    checkAvailability: jest.fn().mockResolvedValue({
      AgentBookingAvailabilityResponse: {
        AvailabilityReference: "MOCK_AVAIL_123",
        Available: true,
        EstimatedTime: 10,
      },
    }),
    bookRide: jest.fn().mockResolvedValue({
      AgentBookingAuthorizationResponse: {
        AuthorizationReference: "MOCK_AUTH_123",
        Status: "Booked",
        EstimatedTime: 10,
        AvailabilityReference: "MOCK_AVAIL_123",
      },
    }),
    getRideStatus: jest.fn().mockResolvedValue({
      AgentBookingStatusResponse: {
        Status: "Dispatched",
        BookingTime: new Date().toISOString(),
        EstimatedArrivalTime: new Date(Date.now() + 10 * 60000).toISOString(),
      },
    }),
    cancelRide: jest.fn().mockResolvedValue({
      AgentBookingCancellationResponse: {
        Status: "Cancelled",
        CancellationTime: new Date().toISOString(),
      },
    }),
    processPayment: jest.fn().mockResolvedValue({
      AgentPaymentResponse: {
        Status: "Accepted",
        AuthorizationReference: "MOCK_AUTH_123",
        PaymentReference: "PAY_123456",
        TransactionTime: new Date().toISOString(),
        ReceiptAvailable: true,
      },
    }),
    requestBill: jest.fn().mockResolvedValue({
      AgentBillResponse: {
        Status: "OK",
        AuthorizationReference: "MOCK_AUTH_123",
        BillItems: {
          BillItem: [
            {
              Description: "Base fare",
              Amount: "15.50",
              Type: "Fare",
            },
            {
              Description: "Waiting time",
              Amount: "2.50",
              Type: "Extra",
            },
          ],
        },
        SubTotal: "18.00",
        Tax: "2.00",
        Total: "20.00",
        Currency: "USD",
        PaymentStatus: "Pending",
      },
    }),
    getReceipt: jest.fn().mockResolvedValue({
      AgentReceiptResponse: {
        Status: "OK",
        AuthorizationReference: "MOCK_AUTH_123",
        ReceiptNumber: "RCPT-12345",
        VendorName: "Test Taxi Company",
        BookingReference: "BOOKING_12345",
        PaymentReference: "PAY_123456",
        JourneyDetails: {
          StartTime: new Date(Date.now() - 3600000).toISOString(),
          EndTime: new Date(Date.now() - 600000).toISOString(),
          PickupAddress: "123 Pickup Street, London",
          DropoffAddress: "456 Dropoff Avenue, London",
          Distance: "5.2 miles",
        },
        BillItems: {
          BillItem: [
            {
              Description: "Base fare",
              Amount: "15.50",
              Type: "Fare",
            },
            {
              Description: "Waiting time",
              Amount: "2.50",
              Type: "Extra",
            },
          ],
        },
        SubTotal: "18.00",
        Tax: "2.00",
        Total: "20.00",
        Currency: "USD",
        PaymentMethod: "Card",
        PaymentTime: new Date(Date.now() - 500000).toISOString(),
        ReceiptURL: "https://mock-taxi-company.com/receipts/RCPT-12345.pdf",
      },
    }),
    requestVendorBids: jest.fn().mockResolvedValue({
      AgentBidResponse: {
        Status: "OK",
        BidReference: "BID_12345",
        Bids: {
          Bid: [
            {
              VendorId: "VENDOR_1",
              VendorName: "Premium Taxis",
              PriceBand: {
                Currency: "USD",
                MinimumPrice: "18.00",
                MaximumPrice: "28.00",
                EstimatedPrice: "23.00",
              },
              ETAInMinutes: "8",
              VehicleType: igoConfig.vehicleTypes.EXECUTIVE,
            },
          ],
        },
      },
    }),
  };
});

describe("iGo Payment Flow Tests", () => {
  let authToken;
  let testUser;
  let testRide;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);

    // Clean up existing data
    await User.deleteMany({});
    await Ride.deleteMany({});

    // Create a test user
    testUser = await User.create({
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+1234567890",
    });

    // Create a test ride in completed status
    testRide = await Ride.create({
      user: testUser._id,
      pickupLocation: {
        address: "123 Pickup Street",
        latitude: 51.5074,
        longitude: -0.1278,
      },
      dropoffLocation: {
        address: "456 Dropoff Avenue",
        latitude: 51.5174,
        longitude: -0.1278,
      },
      pickupTime: new Date(Date.now() + 3600000),
      fare: 25.5,
      finalFare: 28.0,
      status: igoConfig.rideStatuses.COMPLETED,
      igoBookingId: "BOOKING_12345",
      igoAvailabilityReference: "MOCK_AVAIL_123",
      igoAuthorizationReference: "MOCK_AUTH_123",
      pricingModel: igoConfig.pricingModels.UP_FRONT,
      paymentPoint: igoConfig.paymentPoints.TIME_OF_BOOKING,
      vehicleType: igoConfig.vehicleTypes.STANDARD,
      journeyStartTime: new Date(Date.now() - 3600000),
      journeyEndTime: new Date(Date.now() - 600000),
    });

    // Login to get auth token
    const loginResponse = await request(app).post("/api/users/login").send({
      email: "test@example.com",
      password: "password123",
    });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Ride.deleteMany({});
    await mongoose.connection.close();
  });

  test("Request bill for a completed ride", async () => {
    const response = await request(app)
      .get(`/api/rides/${testRide._id}/bill`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Bill retrieved successfully");
    expect(response.body.billDetails).toBeDefined();
    expect(response.body.billDetails.total).toBe("20.00");
    expect(response.body.billDetails.billItems.length).toBe(2);
  });

  test("Process payment for a completed ride", async () => {
    const response = await request(app)
      .post(`/api/rides/${testRide._id}/payment`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        paymentMethod: "CARD",
        cardDetails: {
          cardType: "VISA",
          cardNumber: "4111111111111111",
          expiryMonth: "12",
          expiryYear: "2025",
          cvv: "123",
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Payment processed successfully");
    expect(response.body.paymentReference).toBe("PAY_123456");
    expect(response.body.receiptAvailable).toBe(true);
  });

  test("Get receipt for a paid ride", async () => {
    // First update the ride's payment status directly
    await Ride.findByIdAndUpdate(testRide._id, { paymentStatus: "PAID" });

    const response = await request(app)
      .get(`/api/rides/${testRide._id}/receipt`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Receipt retrieved successfully");
    expect(response.body.receiptDetails).toBeDefined();
    expect(response.body.receiptDetails.receiptNumber).toBe("RCPT-12345");
    expect(response.body.receiptDetails.paymentMethod).toBe("Card");
    expect(response.body.receiptDetails.receiptURL).toBeDefined();
  });

  test("Cannot get receipt for an unpaid ride", async () => {
    // First create a new ride that's not paid
    const unpaidRide = await Ride.create({
      user: testUser._id,
      pickupLocation: {
        address: "123 Pickup Street",
        latitude: 51.5074,
        longitude: -0.1278,
      },
      dropoffLocation: {
        address: "456 Dropoff Avenue",
        latitude: 51.5174,
        longitude: -0.1278,
      },
      pickupTime: new Date(Date.now() + 3600000),
      fare: 25.5,
      finalFare: 28.0,
      status: igoConfig.rideStatuses.COMPLETED,
      igoBookingId: "BOOKING_UNPAID",
      igoAvailabilityReference: "MOCK_AVAIL_456",
      igoAuthorizationReference: "MOCK_AUTH_456",
      paymentStatus: "PENDING",
    });

    const response = await request(app)
      .get(`/api/rides/${unpaidRide._id}/receipt`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Cannot get receipt for a ride that has not been paid"
    );
  });

  test("Cannot process payment for a non-completed ride", async () => {
    // First create a new ride that's not completed
    const pendingRide = await Ride.create({
      user: testUser._id,
      pickupLocation: {
        address: "123 Pickup Street",
        latitude: 51.5074,
        longitude: -0.1278,
      },
      dropoffLocation: {
        address: "456 Dropoff Avenue",
        latitude: 51.5174,
        longitude: -0.1278,
      },
      pickupTime: new Date(Date.now() + 3600000),
      fare: 25.5,
      status: igoConfig.rideStatuses.DISPATCHED,
      igoBookingId: "BOOKING_PENDING",
      igoAvailabilityReference: "MOCK_AVAIL_789",
      igoAuthorizationReference: "MOCK_AUTH_789",
    });

    const response = await request(app)
      .post(`/api/rides/${pendingRide._id}/payment`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        paymentMethod: "CARD",
        cardDetails: {
          cardType: "VISA",
          cardNumber: "4111111111111111",
          expiryMonth: "12",
          expiryYear: "2025",
          cvv: "123",
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Cannot process payment for a ride that is not completed"
    );
  });
});
