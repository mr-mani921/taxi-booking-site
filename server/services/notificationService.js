const User = require("../models/User.js");

/**
 * Notification service for sending various types of notifications to users
 * This service abstracts away the different notification methods and provides
 * a unified interface for sending notifications.
 */

// Notification channels
const CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
  IN_APP: "in_app",
};

// Notification types
const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_DISPATCHED: "booking_dispatched",
  DRIVER_ASSIGNED: "driver_assigned",
  DRIVER_ARRIVED: "driver_arrived",
  JOURNEY_STARTED: "journey_started",
  JOURNEY_COMPLETED: "journey_completed",
  PAYMENT_PROCESSED: "payment_processed",
  BOOKING_CANCELLED: "booking_cancelled",
  RIDE_RATED: "ride_rated",
};

/**
 * Send a notification to a user through appropriate channels
 *
 * @param {string} userId - ID of the user to notify
 * @param {string} type - Type of notification from NOTIFICATION_TYPES
 * @param {Object} data - Data to include in the notification
 * @param {Array} channels - Channels to send notification through, defaults to user preferences
 * @returns {Promise<Object>} - Result of the notification operation
 */
const sendUserNotification = async (userId, type, data, channels = null) => {
  try {
    // Get user details including notification preferences
    const user = await User.findById(userId);
    if (!user) {
      console.error(`Cannot send notification: User ${userId} not found`);
      return { success: false, error: "User not found" };
    }

    // Use provided channels or fall back to user preferences
    const notificationChannels =
      channels || getUserPreferredChannels(user, type);

    // Track notification attempts and successes
    const results = {
      userId,
      type,
      timestamp: new Date(),
      channels: {},
      success: false,
    };

    // Send through each channel
    for (const channel of notificationChannels) {
      try {
        const result = await sendThroughChannel(channel, user, type, data);
        results.channels[channel] = { success: true, ...result };
      } catch (error) {
        console.error(
          `Failed to send ${type} notification via ${channel}:`,
          error
        );
        results.channels[channel] = { success: false, error: error.message };
      }
    }

    // If any channel succeeded, mark the overall notification as successful
    results.success = Object.values(results.channels).some(
      (result) => result.success
    );

    // Log the notification for record-keeping
    logNotification(userId, type, data, results);

    return results;
  } catch (error) {
    console.error("Notification service error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification for ride status changes
 *
 * @param {Object} ride - Ride object
 * @param {string} eventType - Type of event that occurred
 * @param {Object} eventData - Data related to the event
 * @returns {Promise<Object>} - Result of the notification operation
 */
const sendRideStatusNotification = async (ride, eventType, eventData) => {
  if (!ride || !ride.user) {
    console.error(
      "Cannot send ride status notification: Invalid ride or missing user"
    );
    return { success: false, error: "Invalid ride data" };
  }

  // Map iGo event types to our notification types
  const notificationType = mapEventToNotificationType(eventType);
  if (!notificationType) {
    console.warn(`No notification type mapping for event ${eventType}`);
    return { success: false, error: "Unmapped event type" };
  }

  // Prepare notification data based on event type
  const notificationData = prepareNotificationData(ride, eventType, eventData);

  // Send the notification
  return sendUserNotification(ride.user, notificationType, notificationData);
};

/**
 * Map iGo event types to our notification types
 */
const mapEventToNotificationType = (eventType) => {
  const mapping = {
    "booking.confirmed": NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    "booking.dispatched": NOTIFICATION_TYPES.BOOKING_DISPATCHED,
    "booking.driver_assigned": NOTIFICATION_TYPES.DRIVER_ASSIGNED,
    "booking.driver_arrived": NOTIFICATION_TYPES.DRIVER_ARRIVED,
    "booking.journey_started": NOTIFICATION_TYPES.JOURNEY_STARTED,
    "booking.completed": NOTIFICATION_TYPES.JOURNEY_COMPLETED,
    "booking.cancelled": NOTIFICATION_TYPES.BOOKING_CANCELLED,
    "payment.processed": NOTIFICATION_TYPES.PAYMENT_PROCESSED,
  };

  return mapping[eventType] || null;
};

/**
 * Prepare data for the notification based on event type
 */
const prepareNotificationData = (ride, eventType, eventData) => {
  const baseData = {
    rideId: ride._id,
    bookingId: ride.igoBookingId,
    pickupAddress: ride.pickupLocation?.address,
    dropoffAddress: ride.dropoffLocation?.address,
  };

  switch (eventType) {
    case "booking.dispatched":
      return {
        ...baseData,
        driverName:
          eventData.Driver?.ForeName + " " + eventData.Driver?.Surname ||
          eventData.Driver?.Name ||
          ride.driverDetails?.name ||
          "Your driver",
        vehicleDetails:
          eventData.Driver?.Vehicle ||
          eventData.Driver?.VehicleDetails ||
          ride.driverDetails?.vehicleDetails ||
          "Vehicle information will be provided soon",
        message: "Your booking has been dispatched and a driver is on the way",
      };

    case "booking.driver_assigned":
      return {
        ...baseData,
        driverName: eventData.Driver?.Name || ride.driverDetails?.name,
        vehicleDetails:
          eventData.Driver?.VehicleDetails ||
          ride.driverDetails?.vehicleDetails,
        driverPhone:
          eventData.Driver?.TelephoneNumber || ride.driverDetails?.phone,
        eta: eventData.ETAMinutes || "unknown",
      };

    case "booking.driver_arrived":
      return {
        ...baseData,
        driverName: ride.driverDetails?.name,
        vehicleDetails: ride.driverDetails?.vehicleDetails,
        message: "Your driver has arrived at the pickup location",
      };

    case "booking.completed":
      return {
        ...baseData,
        fare: ride.finalFare || ride.fare,
        message: "Your journey has been completed",
        paymentRequired:
          ride.paymentPoint === "EndOfJourney" && ride.paymentStatus !== "PAID",
      };

    case "booking.cancelled":
      return {
        ...baseData,
        reason: ride.cancellationReason || "Unknown reason",
        message: `Your booking has been cancelled. Reason: ${
          ride.cancellationReason || "Unknown reason"
        }`,
      };

    case "payment.processed":
      return {
        ...baseData,
        amount: ride.finalFare || ride.fare,
        paymentMethod: ride.paymentMethod || "Unknown",
        transactionReference: ride.paymentTransactionReference || "Unknown",
        message: `Payment of ${
          ride.finalFare || ride.fare
        } has been processed successfully`,
      };

    default:
      return baseData;
  }
};

/**
 * Get user's preferred notification channels based on notification type
 * This would typically be stored in user preferences
 */
const getUserPreferredChannels = (user, notificationType) => {
  // In a real application, this would check user preferences
  // For now, we'll use default channels based on notification type
  const importantNotifications = [
    NOTIFICATION_TYPES.DRIVER_ARRIVED,
    NOTIFICATION_TYPES.BOOKING_CANCELLED,
  ];

  if (importantNotifications.includes(notificationType)) {
    // For important notifications, use multiple channels
    return [CHANNELS.EMAIL, CHANNELS.SMS, CHANNELS.IN_APP];
  }

  // For other notifications, just use email and in-app
  return [CHANNELS.EMAIL, CHANNELS.IN_APP];
};

/**
 * Send notification through a specific channel
 */
const sendThroughChannel = async (channel, user, type, data) => {
  switch (channel) {
    case CHANNELS.EMAIL:
      return await sendEmailNotification(user.email, type, data);

    case CHANNELS.SMS:
      // Only send SMS if user has a phone number
      if (user.phone) {
        return await sendSmsNotification(user.phone, type, data);
      }
      throw new Error("User has no phone number for SMS notification");

    case CHANNELS.PUSH:
      // This would require device tokens to be stored on the user
      if (user.deviceTokens && user.deviceTokens.length > 0) {
        return await sendPushNotification(user.deviceTokens, type, data);
      }
      throw new Error("User has no device tokens for push notification");

    case CHANNELS.IN_APP:
      return await saveInAppNotification(user._id, type, data);

    default:
      throw new Error(`Unsupported notification channel: ${channel}`);
  }
};

/**
 * Send email notification
 */
const sendEmailNotification = async (email, type, data) => {
  // This is a stub - in a real application, you would integrate with your email service
  console.log(`[EMAIL NOTIFICATION] To: ${email}, Type: ${type}`);
  console.log(`[EMAIL NOTIFICATION] Data:`, data);

  // Mock a successful email send
  return {
    messageId: `mock_email_${Date.now()}`,
    sentAt: new Date(),
  };
};

/**
 * Send SMS notification
 */
const sendSmsNotification = async (phone, type, data) => {
  // This is a stub - in a real application, you would integrate with your SMS service
  console.log(`[SMS NOTIFICATION] To: ${phone}, Type: ${type}`);
  console.log(`[SMS NOTIFICATION] Data:`, data);

  // Mock a successful SMS send
  return {
    messageId: `mock_sms_${Date.now()}`,
    sentAt: new Date(),
  };
};

/**
 * Send push notification
 */
const sendPushNotification = async (deviceTokens, type, data) => {
  // This is a stub - in a real application, you would integrate with your push notification service
  console.log(
    `[PUSH NOTIFICATION] To: ${deviceTokens.length} devices, Type: ${type}`
  );
  console.log(`[PUSH NOTIFICATION] Data:`, data);

  // Prepare notification title and body based on type
  let title = "Taxi Booking";
  let body = "You have a new notification";

  switch (type) {
    case NOTIFICATION_TYPES.DRIVER_ASSIGNED:
      title = "Driver Assigned";
      body = `${data.driverName} will arrive in approximately ${data.eta} minutes`;
      break;
    case NOTIFICATION_TYPES.DRIVER_ARRIVED:
      title = "Driver Has Arrived";
      body = `Your driver ${data.driverName} has arrived at the pickup location`;
      break;
    // Add cases for other notification types
  }

  // Mock a successful push notification send
  return {
    messageId: `mock_push_${Date.now()}`,
    sentAt: new Date(),
    title,
    body,
  };
};

/**
 * Save in-app notification for later retrieval
 */
const saveInAppNotification = async (userId, type, data) => {
  // This is a stub - in a real application, you would save to your database
  console.log(`[IN-APP NOTIFICATION] For user: ${userId}, Type: ${type}`);
  console.log(`[IN-APP NOTIFICATION] Data:`, data);

  // Determine notification message based on type
  let message = "You have a new notification";
  switch (type) {
    case NOTIFICATION_TYPES.BOOKING_CONFIRMED:
      message = "Your booking has been confirmed";
      break;
    case NOTIFICATION_TYPES.DRIVER_ARRIVED:
      message = "Your driver has arrived at the pickup location";
      break;
    // Add cases for other notification types
  }

  // Mock a successful in-app notification save
  return {
    notificationId: `mock_inapp_${Date.now()}`,
    createdAt: new Date(),
    message,
    read: false,
  };
};

/**
 * Log notification for record-keeping
 */
const logNotification = (userId, type, data, results) => {
  // This is a stub - in a real application, you would log to your database
  console.log(
    `[NOTIFICATION LOG] User: ${userId}, Type: ${type}, Success: ${results.success}`
  );
};

module.exports = {
  CHANNELS,
  NOTIFICATION_TYPES,
  sendUserNotification,
  sendRideStatusNotification,
};
