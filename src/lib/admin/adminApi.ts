import axiosInstance from "@/lib/axiosInstance";
import axios from "axios";
import { getAdminToken, setAdminToken } from "@/lib/auth/tokenManager";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const adminApi = axios.create({
  baseURL: BASE_URL, // baseURL đã gồm /api rồi từ NEXT_PUBLIC_API_URL
  timeout: 15_000,
});

adminApi.interceptors.request.use((cfg) => {
  const token = getAdminToken();
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
    console.log(
      "🔐 AdminApi Request:",
      cfg.method?.toUpperCase(),
      cfg.url,
      "with token:",
      token.substring(0, 20) + "..."
    );
  } else {
    console.warn(
      "⚠️ AdminApi Request WITHOUT token:",
      cfg.method?.toUpperCase(),
      cfg.url
    );
  }
  return cfg;
});

// Response interceptor để handle errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("❌ AdminApi 401 Unauthorized - Token expired or invalid");
      // Có thể redirect về login hoặc clear tokens
    } else if (error.response?.status === 403) {
      console.error("❌ AdminApi 403 Forbidden - Not admin role");
    }
    return Promise.reject(error);
  }
);
export type AdminLoginBody = { identifier: string; password: string };
export type AdminLoginResp = {
  accessToken?: string;
  token?: string;
  admin: {
    id: string;
    name?: string;
    fullName?: string;
    email?: string;
    username?: string;
  };
};

export async function adminLogin(body: AdminLoginBody) {
  console.log("🔑 Admin Login attempt:", body.identifier);
  const { data } = await axiosInstance.post<AdminLoginResp>(
    "/admin/login",
    body
  );
  // Backend trả về `token` hoặc `accessToken`
  const token = data.token || data.accessToken;
  if (token) {
    setAdminToken(token);
    console.log(
      "✅ Admin Login SUCCESS, token saved:",
      token.substring(0, 20) + "..."
    );
  } else {
    console.error("❌ Admin Login: No token in response", data);
  }
  return { ...data, accessToken: token };
}

/** Dashboard stats cho admin */
export async function getDashboardStats() {
  try {
    console.log("📊 Fetching dashboard stats");
    const { data } = await adminApi.get("/admin/dashboard/stats");
    console.log("✅ Dashboard stats fetched");
    return data;
  } catch (error: any) {
    console.error(
      "❌ Failed to fetch dashboard stats:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/** Tours đang/chuẩn bị chạy cho dashboard */
export async function getOngoingTours() {
  const response = await adminApi.get<{ total: number; data: any[] }>(
    "/admin/tours/ongoing"
  );
  return response.data?.data ?? [];
}

/** Gán/cập nhật leader cho tour */
export async function setTourLeader(tourId: string, leaderId: string | null) {
  const { data } = await adminApi.patch(`/admin/tours/${tourId}/leader`, {
    leaderId,
  });
  return data;
}

/** Thêm sự kiện timeline */
export type TimelineEventBody = {
  type: "departed" | "arrived" | "checkpoint" | "note" | "finished";
  note?: string;
};
export async function addTimeline(tourId: string, body: TimelineEventBody) {
  const { data } = await adminApi.post(`/admin/tours/${tourId}/timeline`, body);
  return data;
}

/** Chi phí tour */
export type Expense = {
  _id: string;
  title: string;
  amount: number;
  occurredAt: string;
  note?: string;
};

export async function getExpenses(tourId: string) {
  const { data } = await adminApi.get<Expense[]>(
    `/admin/tours/${tourId}/expenses`
  );
  return data ?? [];
}
export async function addExpense(
  tourId: string,
  payload: Omit<Expense, "_id">
) {
  const { data } = await adminApi.post(
    `/admin/tours/${tourId}/expenses`,
    payload
  );
  return data;
}
export async function updateExpense(
  expenseId: string,
  patch: Partial<Expense>
) {
  const { data } = await adminApi.patch(`/admin/expenses/${expenseId}`, patch);
  return data;
}
export async function deleteExpense(expenseId: string) {
  const { data } = await adminApi.delete(`/admin/expenses/${expenseId}`);
  return data;
}

/* ====================================
 *  IMAGE UPLOAD (Admin) - DEPRECATED (Integrated into Tours)
 * ==================================== */

/* ====================================
 *  TOURS CRUD (Admin)
 * ==================================== */

export type TourInput = {
  title: string;
  time?: string;
  description?: string;
  priceAdult?: number;
  priceChild?: number;
  quantity?: number;
  destination: string;
  images?: string[];
  itinerary?: Array<{
    day: number;
    title: string;
    summary?: string;
    segments?: Array<{
      timeOfDay: "morning" | "afternoon" | "evening";
      title: string;
      items: Array<string | { text: string; imageUrl?: string }>;
    }>;
    photos?: string[];
  }>;
  includes?: string[];
  excludes?: string[];
};

export type TourResponse = {
  _id: string;
  title: string;
  time?: string;
  description?: string;
  priceAdult?: number;
  priceChild?: number;
  quantity?: number;
  destination: string;
  destinationSlug?: string;
  images: string[];
  itinerary?: any[];
  includes?: string[];
  excludes?: string[];
  createdAt?: string;
  updatedAt?: string;
};

// ── Departure Types ───────────────────────────────────────
export type DepartureInput = {
  startDate: string | Date;
  endDate: string | Date;
  min_guests?: number;
  max_guests?: number;
  current_guests?: number;
  priceAdult?: number;
  priceChild?: number;
  status?: "pending" | "confirmed" | "in_progress" | "completed" | "closed";
  leaderId?: string | null;
};

export type DepartureResponse = {
  _id: string;
  tourId: string | TourResponse;
  startDate: string;
  endDate: string;
  min_guests: number;
  max_guests?: number;
  current_guests: number;
  priceAdult?: number;
  priceChild?: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "closed";
  leaderId?: string | { _id: string; fullName: string; phoneNumber: string; email: string } | null;
  timeline?: any[];
  departedAt?: string;
  arrivedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ToursListResponse = {
  total: number;
  page: number;
  limit: number;
  data: TourResponse[];
};

/** Lấy danh sách tất cả tours */
export async function getAllToursAdmin(params?: {
  page?: number;
  limit?: number;
  status?: string;
  destination?: string;
  search?: string;
}) {
  const { data } = await adminApi.get<ToursListResponse>("/tours/admin", {
    params,
  });
  return data;
}

/** Lấy chi tiết tour */
export async function getTourByIdAdmin(tourId: string) {
  const { data } = await adminApi.get<TourResponse>(`/tours/admin/${tourId}`);
  return data;
}

/** Tạo tour mới */
export async function createTourAdmin(payload: TourInput | FormData) {
  const isFormData = payload instanceof FormData;
  const { data } = await adminApi.post<{ message: string; tour: TourResponse }>(
    "/tours",
    payload,
    {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    }
  );
  return data;
}

/** Cập nhật tour */
export async function updateTourAdmin(
  tourId: string,
  payload: Partial<TourInput> | FormData
) {
  const isFormData = payload instanceof FormData;
  const { data } = await adminApi.put<{ message: string; tour: TourResponse }>(
    `/tours/${tourId}`,
    payload,
    {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    }
  );
  return data;
}

/** Xóa tour */
export async function deleteTourAdmin(tourId: string) {
  const { data } = await adminApi.delete<{
    message: string;
    tour: TourResponse;
  }>(`/tours/${tourId}`);
  return data;
}

/** Xác nhận tour (chuyển status sang confirmed) */
export async function confirmTourAdmin(tourId: string) {
  const { data } = await adminApi.put<{ message: string; tour: TourResponse }>(
    `/tours/${tourId}`,
    { status: "confirmed" }
  );
  return data;
}

/** Đóng tour (chuyển status sang closed) */
export async function closeTourAdmin(tourId: string) {
  const { data } = await adminApi.put<{ message: string; tour: TourResponse }>(
    `/tours/${tourId}`,
    { status: "closed" }
  );
  return data;
}

/** Cập nhật trạng thái tour */
export async function updateTourStatusAdmin(
  tourId: string,
  status: "pending" | "confirmed" | "in_progress" | "completed" | "closed"
) {
  const { data } = await adminApi.put<{ message: string; tour: TourResponse }>(
    `/tours/${tourId}`,
    { status }
  );
  return data;
}

// ========================================================
// DEPARTURE CRUD (Admin)
// ========================================================

/** Tạo lịch khởi hành mới cho Tour */
export async function createDepartureAdmin(tourId: string, payload: DepartureInput) {
  const { data } = await adminApi.post<{ message: string; departure: DepartureResponse }>(
    `/admin/tours/${tourId}/departures`,
    payload
  );
  return data;
}

/** Liệt kê các lịch khởi hành của 1 Tour */
export async function listDeparturesAdmin(tourId: string, params?: { status?: string; page?: number; limit?: number }) {
  const { data } = await adminApi.get<{ total: number; page: number; limit: number; data: DepartureResponse[] }>(
    `/admin/tours/${tourId}/departures`,
    { params }
  );
  return data;
}

/** Chi tiết 1 Departure */
export async function getDepartureAdmin(departureId: string) {
  const { data } = await adminApi.get<DepartureResponse>(`/admin/departures/${departureId}`);
  return data;
}

/** Cập nhật trạng thái Departure */
export async function patchDepartureStatus(
  departureId: string,
  status: DepartureResponse["status"]
) {
  const { data } = await adminApi.patch<{ message: string; departure: DepartureResponse }>(
    `/admin/departures/${departureId}/status`,
    { status }
  );
  return data;
}

/** Phân công Leader cho Departure */
export async function assignLeaderToDeparture(departureId: string, leaderId: string | null) {
  const { data } = await adminApi.patch<{ message: string; departure: DepartureResponse }>(
    `/admin/departures/${departureId}/leader`,
    { leaderId }
  );
  return data;
}

/** Lấy danh sách Departure đang diễn ra */
export async function getOngoingDepartures() {
  const response = await adminApi.get<{ total: number; data: DepartureResponse[] }>(
    "/admin/departures/ongoing"
  );
  return response.data?.data ?? [];
}
