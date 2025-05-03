import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api.js";

export const processPayment = createAsyncThunk(
  "payment/processPayment",
  async (
    { rideId, amount, paymentMethod, cardDetails },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/payments/process`, {
        rideId,
        amount,
        paymentMethod,
        cardDetails: {
          cardNumber: cardDetails.cardNumber,
          expiryMonth: cardDetails.expiryMonth,
          expiryYear: cardDetails.expiryYear,
          cvv: cardDetails.cvv,
          cardholderName: cardDetails.cardholderName,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Payment failed");
    }
  }
);

export const getPaymentStatus = createAsyncThunk(
  "payment/getStatus",
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/payments/${paymentId}/status`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to get payment status"
      );
    }
  }
);

export const getPaymentReceipt = createAsyncThunk(
  "payment/getReceipt",
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to get payment receipt"
      );
    }
  }
);
