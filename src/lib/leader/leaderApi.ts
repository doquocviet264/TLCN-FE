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
export interface TourTemplate {
  _id: string;
  title: string;
  destination: string;
  destinationSlug: string;
  images: string[];
  itinerary?: any[];
  includes?: string[];
  excludes?: string[];
  priceAdult?: number;
  priceChild?: number;
}

export interface LeaderDeparture {
  _id: string;
  tourId: TourTemplate;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "closed";
  min_guests: number;
  current_guests: number;
  priceAdult?: number;
  priceChild?: number;
  timeline?: TimelineEvent[];
  leaderId?: string;
}

/** @deprecated use LeaderDeparture */
export type LeaderTour = LeaderDeparture & {
  title: string;     // computed from tourId.title
  destination: string;
  quantity?: number;
  bookedCount?: number;
};

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
  tourDepartureId: string;
  title: string;
  amount: number;
  occurredAt: string;
  note?: string;
  visibleToCustomers: boolean;
  addedBy?: string;
}

export interface Passenger {
  _id: string;
  code: string;
  userId?: { _id: string; fullName: string; email: string; phoneNumber: string; avatar?: string };
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  numAdults: number;
  numChildren: number;
  totalPrice: number;
  bookingStatus: string;
  paidAmount: number;
  depositPaid: boolean;
  createdAt: string;
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

// ======= TOURS/DEPARTURES API =======
export const leaderToursApi = {
  // Lấy danh sách departure được phân công
  getMyTours: async (params?: { status?: string; onlyToday?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.onlyToday) queryParams.append("onlyToday", "1");

    const res = await leaderAxios.get(`/leader/departures?${queryParams.toString()}`);
    // Map departure data sang dạng LeaderTour cho backward-compat
    const departures = res.data as LeaderDeparture[];
    return departures.map(d => ({
      ...d,
      title:       d.tourId?.title ?? "Tour",
      destination: d.tourId?.destination ?? "",
      quantity:    d.min_guests,
      bookedCount: d.current_guests,
    } as LeaderTour));
  },

  // Lấy chi tiết 1 departure
  getTourDetail: async (departureId: string) => {
    const res = await leaderAxios.get(`/leader/departures/${departureId}`);
    const d = res.data as LeaderDeparture;
    return {
      ...d,
      title:       d.tourId?.title ?? "Tour",
      destination: d.tourId?.destination ?? "",
      quantity:    d.min_guests,
      bookedCount: d.current_guests,
    } as LeaderTour;
  },

  // Lấy danh sách hành khách
  getPassengers: async (departureId: string) => {
    const res = await leaderAxios.get(`/leader/departures/${departureId}/passengers`);
    return res.data as { total: number; data: Passenger[] };
  },

  // Thêm sự kiện timeline
  addTimeline: async (
    departureId: string,
    event: {
      eventType: TimelineEvent["eventType"];
      at?: string;
      place?: string;
      note?: string;
    }
  ) => {
    const res = await leaderAxios.patch(`/leader/departures/${departureId}/timeline`, event);
    return res.data;
  },

  // Thêm chi phí phát sinh
  addExpense: async (
    departureId: string,
    expense: {
      title: string;
      amount: number;
      note?: string;
      visibleToCustomers?: boolean;
    }
  ) => {
    const res = await leaderAxios.post(`/leader/departures/${departureId}/expenses`, expense);
    return res.data;
  },

  // Lấy danh sách chi phí của departure
  getTourExpenses: async (departureId: string) => {
    const res = await leaderAxios.get(`/leader/departures/${departureId}/expenses`);
    return res.data as { total: number; count: number; data: Expense[] };
  },
};
