"use client";
import { useState, useEffect } from "react";
import { authApi } from "@/lib/auth/authApi";
// Import hàm lấy token từ file quản lý token của bạn
import { getUserToken, clearAllTokens } from "@/lib/auth/tokenManager";

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  points?: number;
  memberStatus?: string;
  role?: string;
  [key: string]: any;
};

const useUser = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);

      // 1. Dùng hàm getUserToken() từ tokenManager để lấy đúng key "accessToken"
      const token = getUserToken();

      if (token) {
        try {
          // 2. Gọi API lấy thông tin
          const userProfile = await authApi.getProfile(token);

          // 3. Kiểm tra id (vì authApi đã chuẩn hóa về 'id')
          if (userProfile && userProfile.id) {
            setUser(userProfile as UserProfile);
            setIsAuthenticated(true);
          } else {
            // Dữ liệu trả về không đúng cấu trúc mong đợi
            throw new Error("Invalid user profile data");
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);

          // 4. Nếu token lỗi/hết hạn, dùng clearAllTokens() để dọn dẹp sạch sẽ
          clearAllTokens();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // Không có token
        setUser(null);
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  return { user, isAuthenticated, loading };
};

export default useUser;
