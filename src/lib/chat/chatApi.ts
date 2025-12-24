import axiosInstance from "@/lib/axiosInstance";
import axios from "axios";
import { getUserToken } from "@/lib/auth/tokenManager";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Axios instance riêng cho user chat - CHỈ dùng user token, không dùng admin token
const userChatAxios = axios.create({
  baseURL,
  withCredentials: false,
});

userChatAxios.interceptors.request.use((config) => {
  // Chỉ lấy user token, không lấy admin token
  const userToken = getUserToken();
  if (userToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${userToken}`;
  }
  return config;
});

// ==================== Types ====================
export type ChatRole = "admin" | "leader" | "user" | "guest";
export type RoomType = "booking" | "support" | "tour";

export type ChatMessage = {
  _id: string;
  roomType: RoomType;
  bookingCode?: string;
  supportId?: string;
  tourId?: string;
  fromId?: string;
  fromRole: ChatRole;
  name?: string;
  email?: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatThread = {
  id: string;
  type: RoomType;
  title: string;
  subtitle: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  email?: string;
  name?: string;
  status?: "active" | "closed" | "pending";
};

export type ChatResponse = {
  roomType?: string;
  bookingCode?: string;
  supportId?: string;
  tourId?: string;
  total: number;
  data: ChatMessage[];
};

export type StartSupportResponse = {
  message: string;
  supportId: string;
  firstMessage: ChatMessage;
};

export type UserChatHistory = {
  supportChats: ChatThread[];
  bookingChats: ChatThread[];
  tourChats: ChatThread[];
};

// ==================== Booking Chat ====================
export async function getBookingMessages(bookingCode: string): Promise<ChatResponse> {
  const { data } = await axiosInstance.get(`/chat/booking/${bookingCode}`);
  return data;
}

export async function sendBookingMessage(bookingCode: string, content: string): Promise<{ message: string; data: ChatMessage }> {
  const { data } = await axiosInstance.post(`/chat/booking/${bookingCode}`, { content });
  return data;
}

// ==================== Support Chat (User Side - dùng userChatAxios) ====================
// Các hàm này dùng userChatAxios để đảm bảo chỉ gửi user token, không gửi admin token
export async function startSupportChat(params: {
  content: string;
  name?: string;
  email?: string;
}): Promise<StartSupportResponse> {
  const { data } = await userChatAxios.post("/chat/support/start", params);
  return data;
}

export async function getSupportMessages(supportId: string): Promise<ChatResponse> {
  const { data } = await userChatAxios.get(`/chat/support/${supportId}`);
  return data;
}

export async function sendSupportMessage(
  supportId: string,
  params: { content: string; name?: string; email?: string; role?: ChatRole }
): Promise<{ message: string; data: ChatMessage }> {
  const { data } = await userChatAxios.post(`/chat/support/${supportId}`, params);
  return data;
}

// ==================== Support Chat (Admin Side - dùng axiosInstance) ====================
// Admin dùng axiosInstance để gửi admin token
export async function adminGetSupportMessages(supportId: string): Promise<ChatResponse> {
  const { data } = await axiosInstance.get(`/chat/support/${supportId}`);
  return data;
}

export async function adminSendSupportMessage(
  supportId: string,
  params: { content: string }
): Promise<{ message: string; data: ChatMessage }> {
  const { data } = await axiosInstance.post(`/chat/support/${supportId}`, params);
  return data;
}

// ==================== Tour Group Chat ====================
export async function getTourGroupMessages(tourId: string): Promise<ChatResponse> {
  const { data } = await axiosInstance.get(`/chat/tour/${tourId}`);
  return data;
}

export async function sendTourGroupMessage(tourId: string, content: string): Promise<{ message: string; data: ChatMessage }> {
  const { data } = await axiosInstance.post(`/chat/tour/${tourId}`, { content });
  return data;
}

// Lấy danh sách tour mà user đã booking (để hiển thị nhóm chat)
export type TourChatInfo = {
  tourId: string;
  tourTitle: string;
  tourDestination?: string;
  tourImage?: string;
  startDate?: string;
  endDate?: string;
  bookingCode: string;
  bookingStatus: string;
};

export async function getMyTourChats(): Promise<{ total: number; data: TourChatInfo[] }> {
  try {
    // Lấy danh sách booking của user
    const { data } = await axiosInstance.get("/bookings/me", {
      params: { limit: 50 }
    });

    const bookings = data?.data || [];

    // Lọc các booking đã confirmed (c) hoặc pending (p) - không lấy canceled (x)
    // Và chỉ lấy các tour có startDate trong tương lai hoặc đang diễn ra
    const tourChats: TourChatInfo[] = [];
    const seenTourIds = new Set<string>();

    for (const b of bookings) {
      if (b.bookingStatus === "x") continue; // Skip canceled

      const tour = typeof b.tourId === "object" ? b.tourId : null;
      const tourId = tour?._id || b.tourId;

      if (!tourId || seenTourIds.has(tourId)) continue;
      seenTourIds.add(tourId);

      tourChats.push({
        tourId: String(tourId),
        tourTitle: tour?.title || b.tourTitle || "Tour",
        tourDestination: tour?.destination || b.tourDestination,
        tourImage: tour?.cover || tour?.images?.[0] || b.tourImage,
        startDate: tour?.startDate || b.startDate,
        endDate: tour?.endDate || b.endDate,
        bookingCode: b.code,
        bookingStatus: b.bookingStatus,
      });
    }

    return { total: tourChats.length, data: tourChats };
  } catch (err) {
    console.error("getMyTourChats error:", err);
    return { total: 0, data: [] };
  }
}

// ==================== User Chat History ====================
// Lấy danh sách các cuộc chat của user (support chats đã mở)
// Dùng userChatAxios để chỉ gửi user token
export async function getUserSupportChats(): Promise<{ total: number; data: any[] }> {
  const { data } = await userChatAxios.get("/chat/user/support");
  return data;
}

// Lấy tất cả lịch sử chat của user (support + booking + tour)
export async function getUserChatHistory(): Promise<UserChatHistory> {
  const { data } = await userChatAxios.get("/chat/user/history");
  return data;
}

// ==================== Admin APIs ====================
export async function getAllSupportChats(): Promise<{ total: number; data: any[] }> {
  const { data } = await axiosInstance.get("/chat/admin/support");
  return data;
}

export async function getAllBookingChats(): Promise<{ total: number; data: any[] }> {
  const { data } = await axiosInstance.get("/chat/admin/bookings");
  return data;
}

export async function getAllTourChats(): Promise<{ total: number; data: any[] }> {
  const { data } = await axiosInstance.get("/chat/admin/tours");
  return data;
}

// Đóng chat hỗ trợ (Admin)
export async function closeSupportChat(supportId: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.patch(`/chat/admin/support/${supportId}/close`);
  return data;
}

// ==================== Helpers ====================
export const ROLE_LABELS: Record<ChatRole, string> = {
  admin: "Admin",
  leader: "Tour Leader",
  user: "Khách hàng",
  guest: "Khách vãng lai",
};

export const ROLE_COLORS: Record<ChatRole, { bg: string; text: string; bubble: string }> = {
  admin: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    bubble: "bg-gradient-to-r from-blue-600 to-blue-700 text-white",
  },
  leader: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    bubble: "bg-gradient-to-r from-purple-600 to-purple-700 text-white",
  },
  user: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    bubble: "bg-white text-slate-800 border border-slate-200",
  },
  guest: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    bubble: "bg-white text-slate-800 border border-slate-200",
  },
};

export function isStaffRole(role: ChatRole): boolean {
  return role === "admin" || role === "leader";
}

export function formatChatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString("vi-VN", { weekday: "short" });
  }

  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}