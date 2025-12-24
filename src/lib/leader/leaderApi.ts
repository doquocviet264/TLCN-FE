import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Lấy token
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("leaderToken");
  }
  return null;
};

// Axios instance cho Leader
const leaderAxios = axios.create({
  baseURL: API_URL,
});

leaderAxios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ======= AUTH API =======
export const leaderAuthApi = {
  // Đăng nhập Leader
  login: async (credentials: { identifier: string; password: string }) => {
    const res = await axios.post(`${API_URL}/leader/login`, credentials);
    if (res.data.token) {
      localStorage.setItem("leaderToken", res.data.token);
      localStorage.setItem("leaderUser", JSON.stringify(res.data.leader));
    }
    return res.data;
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem("leaderToken");
    localStorage.removeItem("leaderUser");
  },

  // Lấy thông tin leader hiện tại
  getMe: async () => {
    const res = await leaderAxios.get("/leader/me");
    return res.data;
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    return !!getToken();
  },

  // Lấy thông tin leader từ localStorage
  getStoredLeader: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("leaderUser");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  },
};

// ======= TOURS API =======
export interface LeaderTour {
  _id: string;
  title: string;
  destination: string;
  destinationSlug: string;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "closed";
  quantity: number;
  bookedCount?: number;
  timeline?: TimelineEvent[];
}

export interface TimelineEvent {
  _id?: string;
  eventType: "departed" | "arrived" | "checkpoint" | "note" | "finished";
  at: string;
  place?: string;
  note?: string;
  createdBy?: string;
}

export interface Expense {
  _id?: string;
  tourId: string;
  title: string;
  amount: number;
  occurredAt: string;
  note?: string;
  visibleToCustomers: boolean;
  addedBy?: string;
}

// ======= CHAT API =======
export interface ChatMessage {
  _id: string;
  roomType: "booking" | "support" | "tour";
  bookingCode?: string;
  tourId?: string;
  fromId?: string;
  fromRole: "admin" | "leader" | "user" | "guest";
  name?: string;
  email?: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export const leaderChatApi = {
  // Lấy tin nhắn nhóm tour
  getTourMessages: async (tourId: string) => {
    const res = await leaderAxios.get(`/chat/tour/${tourId}`);
    return res.data as { tourId: string; total: number; data: ChatMessage[] };
  },

  // Gửi tin nhắn nhóm tour
  sendTourMessage: async (tourId: string, content: string) => {
    const res = await leaderAxios.post(`/chat/tour/${tourId}`, { content });
    return res.data as { message: string; data: ChatMessage };
  },

  // Lấy tin nhắn booking
  getBookingMessages: async (bookingCode: string) => {
    const res = await leaderAxios.get(`/chat/booking/${bookingCode}`);
    return res.data as { bookingCode: string; total: number; data: ChatMessage[] };
  },

  // Gửi tin nhắn booking
  sendBookingMessage: async (bookingCode: string, content: string) => {
    const res = await leaderAxios.post(`/chat/booking/${bookingCode}`, { content });
    return res.data as { message: string; data: ChatMessage };
  },
};

// ======= BOOKING API =======
export interface TourBooking {
  _id: string;
  code: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAvatar?: string | null;
  guestCount: number;
  totalPrice: number;
  bookingStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export const leaderBookingApi = {
  // Lấy danh sách khách hàng đã đặt tour
  getTourBookings: async (tourId: string) => {
    const res = await leaderAxios.get(`/leader/tours/${tourId}/bookings`);
    return res.data as {
      tourId: string;
      tourTitle: string;
      total: number;
      data: TourBooking[];
    };
  },
};

// ======= TOURS API =======
export const leaderToursApi = {
  // Lấy danh sách tour được phân công
  getMyTours: async (params?: { status?: string; onlyToday?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.onlyToday) queryParams.append("onlyToday", "1");

    const res = await leaderAxios.get(`/leader/tours?${queryParams.toString()}`);
    return res.data as LeaderTour[];
  },

  // Lấy chi tiết một tour
  getTourDetail: async (tourId: string) => {
    const res = await leaderAxios.get(`/leader/tours/${tourId}`);
    return res.data as LeaderTour;
  },

  // Thêm sự kiện timeline
  addTimeline: async (
    tourId: string,
    event: {
      eventType: TimelineEvent["eventType"];
      at?: string;
      place?: string;
      note?: string;
    }
  ) => {
    const res = await leaderAxios.post(`/leader/tours/${tourId}/timeline`, event);
    return res.data;
  },

  // Thêm chi phí phát sinh
  addExpense: async (
    tourId: string,
    expense: {
      title: string;
      amount: number;
      note?: string;
      visibleToCustomers?: boolean;
    }
  ) => {
    const res = await leaderAxios.post(`/leader/tours/${tourId}/expenses`, expense);
    return res.data;
  },

  // Lấy danh sách chi phí của tour
  getTourExpenses: async (tourId: string) => {
    const res = await leaderAxios.get(`/leader/tours/${tourId}/expenses`);
    return res.data as Expense[];
  },
};
