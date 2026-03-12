import axios from "axios";
import { getUserToken, getAdminToken } from "@/lib/auth/tokenManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// ==================== TYPES ====================
export interface Voucher {
  _id: string;
  code: string;
  type: "percent" | "fixed"; // Giảm % hoặc giảm số tiền cố định
  value: number; // Nếu type=percent thì value=10 (10%), nếu fixed thì value=100000 (100k)
  minOrderValue?: number; // Đơn tối thiểu để áp dụng
  maxDiscount?: number; // Giảm tối đa (cho loại percent)
  description?: string;
  provinceName?: string; // Voucher thuộc tỉnh nào (từ check-in)
  status: "active" | "used" | "expired";
  expiresAt?: string;
  usedAt?: string;
  createdAt: string;
  userId?: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export interface VoucherListResponse {
  data: Voucher[];
  total: number;
  page: number;
  limit: number;
}

// ==================== USER API ====================
export const voucherApi = {
  // Lấy danh sách voucher của user
  getMyVouchers: async (status?: string): Promise<Voucher[]> => {
    const token = getUserToken();

    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);

    const res = await axios.get(`${API_URL}/vouchers/me?${params.toString()}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const payload = res.data;
    const vouchers: Voucher[] = payload.data || payload || [];
    return vouchers;
  },

  // Kiểm tra voucher có hợp lệ không
  validateVoucher: async (
    code: string,
    orderValue: number
  ): Promise<{
    valid: boolean;
    voucher?: Voucher;
    discountAmount?: number;
    message?: string;
  }> => {
    const token = getUserToken();

    const res = await axios.post(
      `${API_URL}/vouchers/validate`,
      { code, orderValue },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    return res.data;
  },

  // Lưu voucher check-in vào localStorage (để hiển thị ở Kho Voucher trước khi sync với server)
  saveCheckinVoucher: (code: string, provinceName: string, description: string) => {
    if (typeof window === "undefined") return;

    try {
      const STORAGE_KEY = "ahh_checkin_vouchers";
      const stored = localStorage.getItem(STORAGE_KEY);
      const vouchers = stored ? JSON.parse(stored) : [];

      // Kiểm tra trùng
      const exists = vouchers.some((v: any) => v.code === code);
      if (!exists) {
        vouchers.push({
          code,
          provinceName,
          description,
          createdAt: new Date().toISOString(),
          status: "active",
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
      }
    } catch (e) {
      console.error("Error saving checkin voucher:", e);
    }
  },

  // Lấy voucher check-in từ localStorage
  getCheckinVouchers: (): Array<{
    code: string;
    provinceName: string;
    description: string;
    createdAt: string;
    status: string;
  }> => {
    if (typeof window === "undefined") return [];

    try {
      const STORAGE_KEY = "ahh_checkin_vouchers";
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error reading checkin vouchers:", e);
      return [];
    }
  },

  // Áp dụng voucher vào đơn hàng
  applyVoucher: async (
    code: string,
    bookingId: string
  ): Promise<{
    success: boolean;
    discountAmount: number;
    message?: string;
  }> => {
    const token = getUserToken();

    const res = await axios.post(
      `${API_URL}/vouchers/apply`,
      { code, bookingId },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    return res.data;
  },
};

// ==================== ADMIN API ====================
export interface AdminVoucherFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  type?: string;
}

export interface CreateVoucherInput {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  description?: string;
  expiresAt?: string;
  userId?: string; // Nếu muốn tạo voucher cho user cụ thể
  quantity?: number; // Số lượng voucher tạo (nếu tạo hàng loạt)
}

export const adminVoucherApi = {
  getAllVouchers: async (
    filters: AdminVoucherFilters = {}
  ): Promise<VoucherListResponse> => {
    const token =
      getAdminToken();

    const params = new URLSearchParams();

    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.type) params.set("type", filters.type);

    const res = await axios.get(
      `${API_URL}/vouchers/admin?${params.toString()}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    return res.data;
  },

  getVoucherById: async (id: string): Promise<Voucher> => {
    const token =
      getAdminToken();

    const res = await axios.get(`${API_URL}/vouchers/admin/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data.data || res.data;
  },

  createVoucher: async (data: CreateVoucherInput): Promise<Voucher> => {
    const token =
      getAdminToken();

    const res = await axios.post(`${API_URL}/vouchers/admin`, data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data.data || res.data;
  },

  createBatchVouchers: async (
    data: CreateVoucherInput & { quantity: number }
  ): Promise<{ created: number; vouchers: Voucher[] }> => {
    const token =
      getAdminToken();

    const res = await axios.post(`${API_URL}/vouchers/admin/batch`, data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  },

  updateVoucher: async (
    id: string,
    data: Partial<CreateVoucherInput>
  ): Promise<Voucher> => {
    const token =
      getAdminToken();

    const res = await axios.put(`${API_URL}/vouchers/admin/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data.data || res.data;
  },

  deleteVoucher: async (id: string): Promise<void> => {
    const token =
      getAdminToken();

    await axios.delete(`${API_URL}/vouchers/admin/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  },

  getVoucherStats: async (): Promise<{
    total: number;
    active: number;
    used: number;
    expired: number;
    totalDiscount: number;
  }> => {
    const token =
      getAdminToken();

    const res = await axios.get(`${API_URL}/vouchers/admin/stats`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  },

  sendVoucherToUser: async (
    voucherId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    const token =
      getAdminToken();

    const res = await axios.post(
      `${API_URL}/vouchers/admin/${voucherId}/send`,
      { userId },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    return res.data;
  },
};
