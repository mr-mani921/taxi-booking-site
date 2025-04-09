# API Utilities and Redux Integration

This directory contains utilities for connecting to the backend API and integrating with Redux state management.

## Structure

- `api.js` - Central API configuration and endpoint definitions
- `../store/thunks.js` - Async thunks for Redux actions
- `../store/apiSlice.js` - Redux slice for API-related state (loading, errors)

## Usage

### Making API Requests

To make requests to the backend, import the API endpoints from `api.js`:

```javascript
import api from '../api/api';

// Example usage
api.getRides()
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error fetching rides:', error);
  });
```

### Using Redux Thunks

For components that use Redux, import the thunks from the thunks file:

```javascript
import { fetchRides } from '../store/thunks';
import { useDispatch, useSelector } from 'react-redux';

const MyComponent = () => {
  const dispatch = useDispatch();
  const rides = useSelector(state => state.booking.rides);
  const loading = useSelector(state => state.api.loading.rides);
  
  useEffect(() => {
    dispatch(fetchRides());
  }, [dispatch]);
  
  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {rides.map(ride => (
            <div key={ride._id}>{ride.id}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Key Features

1. **Centralized Configuration**: All API endpoints are defined in one place
2. **Authentication**: Automatically adds auth tokens to requests
3. **Error Handling**: Global error handling with 401 redirects
4. **Loading States**: Redux tracks loading state for different entity types
5. **Error Tracking**: Redux tracks and exposes API errors by entity

## Authentication

The API client is configured to automatically:

1. Add the auth token to requests
2. Redirect to login on 401 errors
3. Handle token refreshes (future enhancement)

## Error Handling

Errors from API calls are captured and stored in Redux state. Components can access the errors via:

```javascript
const error = useSelector(state => state.api.errors.rides);

if (error) {
  return <div>{error}</div>;
}
```

## Future Enhancements

- Token refresh mechanism
- Request cancellation
- Request debouncing/throttling
- Offline support and request queuing 