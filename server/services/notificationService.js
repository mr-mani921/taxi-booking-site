import User from "../models/User.js";

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
export const sendUserNotification = async (
  userId,
  type,
  data,
  channels = null
) => {
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
export const sendRideStatusNotification = async (
  ride,
  eventType,
  eventData
) => {
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
          ride.paymentPoint === "END_OF_JOURNEY" &&
          ride.paymentStatus !== "PAID",
      };

    case "payment.processed":
      return {
        ...baseData,
        amount: ride.finalFare || ride.fare,
        paymentMethod: ride.paymentMethod,
        receiptAvailable: true,
      };

    default:
      return baseData;
  }
};

/**
 * Get user's preferred notification channels based on settings and notification type
 */
const getUserPreferredChannels = (user, notificationType) => {
  // Default channels if user has no preferences
  const defaultChannels = [CHANNELS.EMAIL, CHANNELS.IN_APP];

  // If user has notification preferences, use those
  if (user.notificationPreferences) {
    const preferences =
      user.notificationPreferences[notificationType] ||
      user.notificationPreferences.default;

    if (preferences) {
      return preferences.channels || defaultChannels;
    }
  }

  return defaultChannels;
};

/**
 * Send notification through a specific channel
 */
const sendThroughChannel = async (channel, user, type, data) => {
  switch (channel) {
    case CHANNELS.EMAIL:
      return sendEmailNotification(user.email, type, data);

    case CHANNELS.SMS:
      return sendSmsNotification(user.phone, type, data);

    case CHANNELS.PUSH:
      return sendPushNotification(user.deviceTokens, type, data);

    case CHANNELS.IN_APP:
      return saveInAppNotification(user._id, type, data);

    default:
      throw new Error(`Unsupported notification channel: ${channel}`);
  }
};

/**
 * Send an email notification
 * In production, integrate with SendGrid, Mailgun, AWS SES, etc.
 */
const sendEmailNotification = async (email, type, data) => {
  // Log the email we would send in production
  console.log(`[EMAIL NOTIFICATION] To: ${email}, Type: ${type}`, data);

  // In production, uncomment and implement actual email sending
  // const emailService = new EmailService();
  // return emailService.send(email, getEmailTemplate(type), data);

  // For demo purposes
  return { id: `email_${Date.now()}`, channel: CHANNELS.EMAIL };
};

/**
 * Send an SMS notification
 * In production, integrate with Twilio, Nexmo, etc.
 */
const sendSmsNotification = async (phone, type, data) => {
  // Log the SMS we would send in production
  console.log(`[SMS NOTIFICATION] To: ${phone}, Type: ${type}`, data);

  // In production, uncomment and implement actual SMS sending
  // const smsService = new SmsService();
  // return smsService.send(phone, getSmsTemplate(type), data);

  // For demo purposes
  return { id: `sms_${Date.now()}`, channel: CHANNELS.SMS };
};

/**
 * Send a push notification
 * In production, integrate with Firebase Cloud Messaging, OneSignal, etc.
 */
const sendPushNotification = async (deviceTokens, type, data) => {
  if (!deviceTokens || deviceTokens.length === 0) {
    throw new Error("No device tokens available for push notification");
  }

  // Log the push notification we would send in production
  console.log(
    `[PUSH NOTIFICATION] To: ${deviceTokens.length} devices, Type: ${type}`,
    data
  );

  // In production, uncomment and implement actual push notification sending
  // const pushService = new PushNotificationService();
  // return pushService.send(deviceTokens, getPushTitle(type), getPushBody(type, data), data);

  // For demo purposes
  return { id: `push_${Date.now()}`, channel: CHANNELS.PUSH };
};

/**
 * Save an in-app notification for the user to see when they log in
 */
const saveInAppNotification = async (userId, type, data) => {
  // Log the in-app notification we would save in production
  console.log(`[IN-APP NOTIFICATION] For user: ${userId}, Type: ${type}`, data);

  // In production, implement actual in-app notification saving to database
  // const notification = new InAppNotification({
  //   user: userId,
  //   type,
  //   data,
  //   read: false,
  //   createdAt: new Date()
  // });
  // await notification.save();

  // For demo purposes
  return { id: `in_app_${Date.now()}`, channel: CHANNELS.IN_APP };
};

/**
 * Log the notification for record-keeping and analytics
 */
const logNotification = (userId, type, data, results) => {
  // In production, store notification logs in the database
  // For now, just log to console
  console.log(`[NOTIFICATION LOG] ${type} notification for user ${userId}:`, {
    timestamp: new Date(),
    channels: Object.keys(results.channels),
    success: results.success,
    data: JSON.stringify(data),
  });
};

// Export constants for use throughout the application
export const NotificationChannels = CHANNELS;
export const NotificationTypes = NOTIFICATION_TYPES;
