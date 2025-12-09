import axios from "axios";
import { useAuthStore } from "#/stores/auth";
import { authApi } from "@/lib/auth/authApi";
// import { useAdminStore } from "#/stores/admin"; // Có thể không cần dùng trực tiếp trong interceptor nếu đã dùng tokenManager
import {
  getUserToken,
  getAdminToken,
  setRefreshToken,
  setUserToken,
} from "@/lib/auth/tokenManager";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: false,
});

// ==================================================================
// 1. REQUEST INTERCEPTOR: GẮN TOKEN VÀO HEADER
// ==================================================================
axiosInstance.interceptors.request.use(
  (config) => {
    // Lấy token từ LocalStorage (thông qua helper) để đảm bảo luôn mới nhất
    const adminToken = getAdminToken();
    const userToken = getUserToken();

    // ⚠️ SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY:
    // Ưu tiên Admin Token trước.
    // - Nếu bạn là Admin: adminToken có giá trị -> Gửi token Admin -> Role = "admin" -> Chat hiện bên Phải.
    // - Nếu bạn là User: adminToken là null -> Lấy userToken -> Role = "user" -> Chat hiện bên Trái (nếu chat với admin) hoặc Phải (nếu chat với support).

    const token = adminToken || userToken;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================================================================
// 2. RESPONSE INTERCEPTOR: XỬ LÝ LỖI & REFRESH TOKEN
// ==================================================================
let refreshing = false;
let queue: Array<() => void> = [];

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { response, config } = err || {};
    const original = config;

    // Chỉ refresh token nếu lỗi là 401 (Unauthorized) và chưa retry
    if (response?.status === 401 && !original._retry) {
      // ⚠️ Lưu ý: Logic refresh này hiện tại đang chỉ áp dụng cho USER (useAuthStore).
      // Nếu Admin bị hết hạn token, hiện tại sẽ bị logout hoặc lỗi.
      // Để đơn giản, ta kiểm tra xem đang dùng token nào.

      const adminToken = getAdminToken();
      if (adminToken) {
        // Nếu là Admin mà bị 401 -> Thường là hết phiên -> Redirect về login admin
        // Admin thường không có cơ chế refresh token phức tạp như user app
        if (typeof window !== "undefined") {
          // window.location.href = "/admin/login"; // Bỏ comment nếu muốn auto redirect
        }
        return Promise.reject(err);
      }

      // --- LOGIC REFRESH CHO USER ---
      original._retry = true;
      const store = useAuthStore.getState();
      const refresh = store.token?.refreshToken;

      if (!refresh) {
        useAuthStore.getState().resetAuth();
        return Promise.reject(err);
      }

      if (!refreshing) {
        refreshing = true;
        try {
          const data = await authApi.requestToken(refresh);

          // Cập nhật token vào Store và LocalStorage
          useAuthStore.getState().setTokenPartial({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });

          // Cập nhật tokenManager để các request sau lấy đúng
          setUserToken(data.accessToken);
          setRefreshToken(data.refreshToken);

          // Chạy lại hàng đợi các request bị treo
          queue.forEach((fn) => fn());
          queue = [];

          // Cập nhật token mới vào header của request đang bị lỗi
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return axiosInstance(original);
        } catch (e) {
          useAuthStore.getState().resetAuth();
          // Xóa token trong localStorage để tránh vòng lặp
          setUserToken(null);
          setRefreshToken(null);
          return Promise.reject(e);
        } finally {
          refreshing = false;
        }
      }

      // Nếu đang refresh, đợi refresh xong rồi bắn lại request này
      return new Promise((resolve) => {
        queue.push(() => {
          // Lấy token mới nhất vừa refresh xong
          const newToken = getUserToken();
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(axiosInstance(original));
        });
      });
    }

    // 403: Thiếu quyền (Role không đủ)
    if (response?.status === 403) {
      console.warn("403 Forbidden: Bạn không có quyền truy cập", original?.url);
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
