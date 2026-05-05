import { adminApi } from "./index";

// Types for admin booking management
export interface PaymentRef {
  provider: string;
  ref: string;
  amount: number;
  at: string;
  note?: string;
}

export interface BookingData {
  _id: string;
  tourId: {
    _id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
  };
  userId?: {
    _id: string;
    fullName: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  note?: string;
  numAdults: number;
  numChildren: number;
  priceAdultSnapshot?: number;
  priceChildSnapshot?: number;
  totalPrice: number;
  voucherCode?: string;
  discountAmount?: number;
  bookingStatus: "pending" | "confirmed" | "completed" | "cancelled";
  cancelReason?: string;
  code: string;
  paidAmount: number;
  depositPaid: boolean;
  paymentMethod: string;
  paymentRefs: PaymentRef[];
  isAdminCreated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetAdminBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  tourId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: "unpaid" | "deposited" | "full";
  customerType?: "member" | "guest";
  paymentMethod?: string;
}

export interface BookingsResponse {
  total: number;
  page: number;
  limit: number;
  data: BookingData[];
}

/**
 * Fetch all bookings with filters and pagination
 */
export const getAdminBookings = async (
  params?: GetAdminBookingsParams
): Promise<BookingsResponse> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      tourId, 
      search,
      startDate,
      endDate,
      paymentStatus,
      customerType,
      paymentMethod
    } = params || {};

    console.log("📊 Fetching admin bookings with advanced filters:", params);

    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (status) queryParams.append("status", status);
    if (tourId) queryParams.append("tourId", tourId);
    if (search) queryParams.append("search", search);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (paymentStatus) queryParams.append("paymentStatus", paymentStatus);
    if (customerType) queryParams.append("customerType", customerType);
    if (paymentMethod) queryParams.append("paymentMethod", paymentMethod);

    const response = await adminApi.get(
      `/admin/bookings?${queryParams.toString()}`
    );
    console.log("✅ Bookings fetched successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch bookings:", error.response?.data);
    throw error;
  }
};

/**
 * Get single booking by ID
 */
export const getAdminBookingById = async (id: string): Promise<BookingData> => {
  try {
    console.log("📊 Fetching booking:", id);
    const response = await adminApi.get(`/admin/bookings/${id}`);
    console.log("✅ Booking fetched successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch booking:", error.response?.data);
    throw error;
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  id: string,
  status: "confirmed" | "cancelled" | "completed",
  cancelReason?: string
): Promise<BookingData> => {
  try {
    const response = await adminApi.patch(`/admin/bookings/${id}/status`, {
      status,
      cancelReason,
    });
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to update booking status:", error.response?.data);
    throw error;
  }
};

/**
 * Delete a booking
 */
export const deleteAdminBooking = async (id: string): Promise<void> => {
  try {
    console.log("🗑️ Deleting booking:", id);
    await adminApi.delete(`/admin/bookings/${id}`);
    console.log("✅ Booking deleted successfully");
  } catch (error: any) {
    console.error("❌ Failed to delete booking:", error.response?.data);
    throw error;
  }
};

/**
 * Get booking by code
 */
export const getAdminBookingByCode = async (
  code: string
): Promise<BookingData> => {
  try {
    console.log("📊 Fetching booking by code:", code);
    const response = await adminApi.get(`/admin/bookings/code/${code}`);
    console.log("✅ Booking fetched successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch booking:", error.response?.data);
    throw error;
  }
};

/**
 * Admin: Create a new booking (for walk-in or user)
 */
export const adminCreateBooking = async (
  payload: {
    tourDepartureId: string;
    userId?: string | null;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    note?: string;
    numAdults: number;
    numChildren: number;
    paymentMethod: string;
    paidAmount: number;
  }
): Promise<{ message: string; booking: BookingData }> => {
  try {
    console.log("📝 Admin creating booking:", payload);
    const response = await adminApi.post(`/admin/bookings`, payload);
    console.log("✅ Admin booking created successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to create booking via admin:", error.response?.data);
    throw error;
  }
};

/**
 * Update payment status for COD/Manual bookings
 */
export const updateBookingPaymentStatus = async (
  id: string,
  action: "mark_paid",
  amount?: number,
  provider = "manual",
  ref?: string
): Promise<{ message: string; booking: BookingData }> => {
  try {
    console.log("💰 Updating booking payment status:", id, "->", action);
    const response = await adminApi.patch(`/admin/bookings/${id}/payment`, {
      action,
      amount,
      provider,
      ref,
    });
    console.log("✅ Booking payment updated successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to update booking payment:", error.response?.data);
    throw error;
  }
};

/**
 * Bulk mark multiple bookings as paid
 */
export const bulkMarkBookingsPaid = async (
  bookingIds: string[],
  amount?: number,
  provider = "manual",
  note?: string
): Promise<{ message: string; count: number; bookings: BookingData[] }> => {
  try {
    console.log("📦 Bulk marking bookings as paid:", bookingIds);
    const response = await adminApi.post(`/admin/bookings/bulk/mark-paid`, {
      bookingIds,
      amount,
      provider,
      note,
    });
    console.log("✅ Bulk payment confirmed");
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to bulk mark bookings:", error.response?.data);
    throw error;
  }
};

/**
 * Refund a booking payment
 */
export const refundBookingPayment = async (
  id: string,
  refundAmount?: number,
  reason?: string,
  refundRef?: string
): Promise<{ message: string; booking: BookingData }> => {
  try {
    console.log("💸 Refunding booking payment:", id);
    const response = await adminApi.post(`/admin/bookings/${id}/refund`, {
      refundAmount,
      reason,
      refundRef,
    });
    console.log("✅ Refund processed successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to refund booking:", error.response?.data);
    throw error;
  }
};

/**
 * Get payment statistics
 */
export const getPaymentStatistics = async (
  startDate?: string,
  endDate?: string
): Promise<{
  period: { startDate?: string; endDate?: string };
  byPaymentMethod: Array<{
    _id: string;
    count: number;
    totalRevenue: number;
    averageAmount: number;
    pendingRevenue: number;
  }>;
  summary: {
    totalBookings: number;
    totalRevenue: number;
    pendingRevenue: number;
    paidBookings: number;
    unpaidBookings: number;
    partialPaidBookings: number;
  };
}> => {
  try {
    console.log("📊 Fetching payment statistics");
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await adminApi.get(
      `/admin/bookings/stats/payments${
        params.toString() ? "?" + params.toString() : ""
      }`
    );
    console.log("✅ Payment statistics fetched");
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch payment stats:", error.response?.data);
    throw error;
  }
};

/**
 * Get payment history for a booking
 */
export const getBookingPaymentHistory = async (
  id: string
): Promise<{
  booking: {
    id: string;
    code: string;
    paymentMethod: string;
    totalPrice: number;
    paidAmount: number;
    remaining: number;
  };
  paymentHistory: PaymentRef[];
}> => {
  try {
    console.log("📜 Fetching payment history for booking:", id);
    const response = await adminApi.get(
      `/admin/bookings/${id}/payment-history`
    );
    console.log("✅ Payment history fetched");
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch payment history:", error.response?.data);
    throw error;
  }
};

// Legacy functions (deprecated) - kept for backward compatibility
export async function adminListBookings(params: {
  tourId?: string;
  status?: "p" | "c" | "x" | "f";
  deposit?: "paid" | "unpaid";
  page?: number;
  limit?: number;
}) {
  return getAdminBookings({
    page: params.page,
    limit: params.limit,
    status: params.status as "p" | "c" | "x" | undefined,
    tourId: params.tourId,
  });
}

export async function adminConfirmTour(tourId: string) {
  const { data } = await adminApi.put(`/tours/admin/${tourId}/confirm`);
  return data;
}

export async function adminMarkPaid(
  code: string,
  payload: { amount: number; ref?: string }
) {
  const { data } = await adminApi.post(
    `/admin/bookings/${encodeURIComponent(code)}/mark-paid`,
    payload
  );
  return data;
}
