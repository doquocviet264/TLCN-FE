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
  login: async (credentials: { email: string; password: string }) => {
    const res = await axios.post(`${API_URL}/leader/auth/login`, credentials);
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
    const res = await leaderAxios.get("/leader/auth/me");
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
