import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userLocation: null,
  selectedRideType: 'standard',
  rideStatus: 'idle',
};

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
    },
    setSelectedRideType: (state, action) => {
      state.selectedRideType = action.payload;
    },
    setRideStatus: (state, action) => {
      state.rideStatus = action.payload;
    },
  },
});

export const { setUserLocation, setSelectedRideType, setRideStatus } = bookingSlice.actions;
export default bookingSlice.reducer;