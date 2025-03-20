# Taxi Booking Site with iGo API Integration

This project is a taxi booking platform integrated with iGo API for dispatch services.

## Features

- User authentication and management
- Taxi ride booking, tracking, and cancellation
- Driver management
- iGo API integration for professional dispatch services

## iGo API Integration

The application integrates with iGo API to provide the following features:

- Ride availability checking
- Price estimation
- Booking automation
- Real-time ride status tracking
- Ride cancellation
- Event handling for dispatch events

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
```

For production use, replace these values with your actual iGo API credentials.

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
| POST | /api/rides/estimate | Get price estimate for a ride |
| POST | /api/rides/availability | Check ride availability |
| POST | /api/rides/book | Book a new ride |
| GET | /api/rides/status/:bookingId | Get ride status |
| DELETE | /api/rides/cancel/:bookingId | Cancel a ride |
| GET | /api/rides/user/:userId | Get all rides for a user |
| POST | /api/rides/webhook/igo | Webhook for iGo events |

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- iGo API Credentials

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

4. Edit the `.env` file with your configuration

5. Start the development server:
   ```
   npm run dev
   ```

## Production Deployment

For production deployment:

1. Ensure you have proper iGo API credentials
2. Set up MongoDB with proper authentication
3. Configure a secure webhook URL for receiving iGo events
4. Set NODE_ENV=production
5. Consider using PM2 or similar for process management

```
npm run build
npm run start
```

## Webhook Configuration

For iGo to send events to your application, you must register your webhook URL with iGo.
The webhook URL should be:

```
https://your-api-domain.com/api/rides/webhook/igo
```

## Testing

For testing, you can use the testing credentials provided by iGo:

- Agent ID: 300999
- Agent Password: jEHJE5Kv
- Vendor ID: 700999

To run tests:

```
npm test
``` 