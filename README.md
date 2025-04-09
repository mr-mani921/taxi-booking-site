# Taxi Booking Site with iGo API Integration

This project is a taxi booking platform integrated with iGo API for dispatch services.

## Features

- User authentication and management
- Taxi ride booking, tracking, and cancellation
- Driver management
- Vendor bid comparison for competitive pricing
- iGo API integration for professional dispatch services
- Complete payment processing and receipts
- Platform-based payment processing with commission tracking
- Real-time user notifications across multiple channels
- Automated vendor settlement processing
- Production-ready error handling and retry logic

## Production-Ready Enhancements

The application includes numerous production-ready features:

### 1. Reliability & Error Handling

- **API Retry Logic**: Critical API calls use smart retry logic with exponential backoff
- **Error Recovery**: Automatic error recovery and fallback mechanisms for API failures
- **Webhook Security**: Signature verification for secure webhook processing
- **Rate Limiting**: Protection against abuse with configurable rate limits

### 2. User Notification System

- **Multi-Channel Notifications**: Support for email, SMS, push, and in-app notifications
- **Event-Based Notifications**: Automatic notifications for all ride status changes
- **Customizable Templates**: Notification content based on event type
- **Delivery Tracking**: Logging and tracking of all notification attempts

### 3. Financial Management

- **Automated Settlements**: Daily vendor settlement processing 
- **Financial Reports**: Weekly financial report generation
- **Revenue Tracking**: Detailed tracking of commission and vendor payments
- **Audit Trail**: Complete history of all financial transactions

### 4. Scheduled Jobs

- **Daily Settlements**: Automated vendor payment settlements
- **Weekly Reports**: Scheduled financial report generation
- **Status Monitoring**: Regular checks for active ride statuses
- **Data Cleanup**: Routine cleanup of old temporary data

### 5. Monitoring & Observability

- **Error Tracking**: Integration with Sentry for error monitoring
- **Logging**: Comprehensive logging of all critical operations
- **Health Checks**: API endpoints for system health verification
- **Performance Metrics**: Tracking of key system performance indicators

## iGo API Integration

The application integrates with iGo API to provide the following features:

- **Vendor Bidding**: Request and compare bids from multiple service providers
- Ride availability checking
- Price estimation
- Booking automation
- Real-time ride status tracking
- Ride cancellation
- Event handling for dispatch events
- **Payment Processing**: Complete payment flow with bill and receipt handling

### iGo API Message Flow

The application implements the complete iGo Protocol V1.41 message flow:

1. **AgentBidRequest** - Request and compare bids from multiple vendors
2. **AgentBookingAvailabilityRequest** - Check ride availability and get price estimates
3. **AgentBookingAuthorizationRequest** - Book a ride with a selected vendor
4. **AgentBookingStatusRequest** - Check the status of a booking
5. **AgentBookingCancellationRequest** - Cancel an existing booking
6. **AgentBillRequest** - Request a bill for a completed ride
7. **AgentPaymentRequest** - Process payment for a completed ride
8. **AgentReceiptRequest** - Retrieve receipt for a paid ride

### iGo API Configuration

The iGo API integration is configured through environment variables:

```
IGO_API_URL=https://cxs-staging.autocab.net/api/agent
IGO_EVENT_BASE_URL=https://cxagent.autocab.net/events
IGO_AGENT_ID=300999
IGO_AGENT_PASSWORD=jEHJE5Kv
IGO_VENDOR_ID=700999
IGO_API_TIMEOUT=30000
API_BASE_URL=https://your-api-domain.com
STRIPE_SECRET_KEY=your-stripe-secret-key
IGO_WEBHOOK_SECRET=your-webhook-secret-for-verification
SENTRY_DSN=your-sentry-dsn-for-error-monitoring
FRONTEND_URL=https://your-frontend-domain.com
```

For production use, replace these values with your actual production credentials.

### Pricing Models

iGo supports three pricing models:

1. **Up-Front** - Fixed price determined at booking time
2. **Estimated** - Estimated price that might change
3. **Agent-Set** - Price set by the agent

### Payment Points

iGo supports three payment points:

1. **TimeOfBooking** - Payment taken at booking time
2. **EndOfJourney** - Payment taken after ride completion
3. **AwaitFinalPrice** - Wait for final price before payment

### Event Handling

The system handles the following iGo events:

1. **AgentBookingDispatchedEventRequest** - When a ride is dispatched with a driver
2. **AgentBookingCompletedEventRequest** - When a ride is completed
3. **AgentBookingCancelledEventRequest** - When a ride is cancelled

## API Endpoints

### Ride Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rides/price-estimate | Get price estimate for a ride |
| POST | /api/rides/check-availability | Check ride availability |
| POST | /api/rides/book | Book a new ride |
| GET | /api/rides/status/:id | Get ride status |
| POST | /api/rides/cancel/:id | Cancel a ride |
| GET | /api/rides/user/:userId | Get all rides for a user |
| POST | /api/rides/webhook/igo | Webhook for iGo events |
| POST | /api/rides/request-bids | Request vendor bids for comparison |
| POST | /api/rides/select-bid | Select a bid from available options |
| POST | /api/rides/:id/payment | Process payment for a completed ride |
| GET | /api/rides/:id/bill | Request bill for a completed ride |
| GET | /api/rides/:id/receipt | Get receipt for a paid ride |

## Bidding Workflow

The bidding process enables users to compare offers from multiple vendors:

1. **Request Bids**: Send a request with journey details to get offers from available vendors
2. **Compare Offers**: Review different prices, ETAs, and vehicle types
3. **Select Preferred Vendor**: Choose the best offer based on user preferences
4. **Complete Booking**: Proceed with standard booking flow using the selected vendor

## Payment Workflow

The payment process enables users to pay for rides and receive receipts:

1. **Ride Completion**: The ride must be completed by the driver
2. **Request Bill**: Get detailed billing information from the vendor
3. **Process Payment**: Process the payment using the platform's payment system
4. **Get Receipt**: Retrieve a receipt for the completed payment

### Payment Processing

The platform handles all payments and applies the following business rules:

1. **Platform-Based Payments**: All payments are processed directly through the platform using Stripe
2. **Card Payments Only**: Currently only credit/debit card payments are supported
3. **Pricing Strategy**: All vendor prices are marked up by 25% to create the customer-facing price
4. **Commission Structure**: The platform retains 20% of the final price (equivalent to the 25% markup)
5. **Vendor Settlement**: Vendors receive the remaining 80% of the final price

Example:
- Vendor price: $100
- Customer price: $125 (25% markup)
- Platform commission: $25 (20% of final price)
- Vendor receives: $100

### Integration with Stripe

The platform uses Stripe to process all card payments:

1. Customer provides payment details through the frontend
2. Platform processes the payment through Stripe
3. Payment confirmation is recorded both in the platform and in iGo
4. Commission is automatically calculated and stored

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- iGo API Credentials
- Stripe Account for payment processing

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/taxi-booking-site.git
   cd taxi-booking-site
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration, including your Stripe API keys

5. Start the development server:
   ```
   npm run dev
   ```

## Production Deployment

For production deployment:

1. Ensure you have proper iGo API credentials
2. Set up MongoDB with proper authentication
3. Configure a secure webhook URL for receiving iGo events
4. Configure Stripe with production API keys
5. Set environment variables:
   - `NODE_ENV=production`
   - `SENTRY_DSN=your-sentry-dsn`
   - `IGO_WEBHOOK_SECRET=your-webhook-secret`
   - `FRONTEND_URL=https://your-frontend-domain.com`
6. Use PM2 or similar for process management

```
npm run build
npm run start
```

## Financial Operations

### Vendor Settlements

The platform provides automated settlement processing:

1. **Scheduled Settlements**: Daily automatic processing via cron job
2. **Manual Processing**: On-demand settlement processing with:
   ```
   npm run settlement:daily
   npm run settlement:daily -- --date 2023-06-15
   npm run settlement:daily -- --dry-run
   ```
3. **Settlement Reports**: Detailed reports of all payments to vendors

### Financial Reporting

Generate financial reports to track business performance:

1. **Scheduled Reports**: Weekly automatic reports via cron job
2. **Manual Reports**: On-demand report generation with:
   ```
   npm run report:weekly
   npm run report:weekly -- --start-date 2023-06-01 --end-date 2023-06-07
   ```

## Webhook Configuration

For iGo to send events to your application, you must register your webhook URL with iGo.
The webhook URL should be:

```
https://your-api-domain.com/api/rides/webhook/igo
```

In production, webhook events are verified using HMAC signatures for security.

## Testing

For testing, you can use the testing credentials provided by iGo:

- Agent ID: 300999
- Agent Password: jEHJE5Kv
- Vendor ID: 700999

For Stripe testing, use their test mode and test credit cards:
- Test Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- Test Token: tok_visa (for direct API testing)

To run tests:

```
npm test                # Run all tests
npm run test:igo        # Run iGo integration tests
npm run test:bids       # Run bidding functionality tests
npm run test:payment    # Run payment flow tests
``` 