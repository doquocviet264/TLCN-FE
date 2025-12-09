// /lib/auth/authApi.ts
import axios from "axios";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
).replace(/\/$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

type VerifyOtpPayload =
  | { otp: string; email: string }
  | { otp: string; phone: string };

export const authApi = {
  // BE nhận identifier (email/username) + password
  async login(identifier: string, password: string, rememberMe?: boolean) {
    const res = await api.post("/auth/login", {
      identifier,
      password,
      rememberMe,
    });
    const d = res.data ?? {};
    return {
      accessToken: d.accessToken ?? d.token ?? d.data?.accessToken ?? null,
      refreshToken: d.refreshToken ?? d.data?.refreshToken ?? null,
      rememberToken: d.rememberToken ?? null,
      user: d.user ?? null,
      raw: d,
    };
  },

  // Đăng nhập bằng Remember Token (auto-login)
  async loginWithRememberToken(email: string, rememberToken: string) {
    const res = await api.post("/auth/login/remember", {
      email,
      rememberToken,
    });
    const d = res.data ?? {};
    return {
      accessToken: d.accessToken ?? null,
      refreshToken: d.refreshToken ?? null,
      rememberToken: d.rememberToken ?? null,
      user: d.user ?? null,
    };
  },

  async register(
    fullName: string,
    username: string,
    email: string,
    phoneNumber: string,
    password: string
  ) {
    const res = await api.post("/auth/register", {
      fullName,
      username,
      email,
      phoneNumber,
      password,
    });
    return res.data;
  },

  async logout() {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  async requestToken(refreshToken: string) {
    const res = await api.post("/auth/request-token", { refreshToken });
    return res.data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const res = await api.put("/auth/change-password", {
      oldPassword,
      newPassword,
    });
    return res.data;
  },

  async sendEmailOTP(
    email: string,
    purpose: "register" | "verify" | "forgot_password"
  ) {
    const res = await api.post("/auth/resend-otp", { email, purpose });
    return res.data;
  },

  // ===== Quên mật khẩu - Bước 1: Gửi OTP =====
  async forgotPassword(email: string) {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  // ===== Quên mật khẩu - Bước 2: Xác thực OTP =====
  async verifyResetOtp(email: string, otp: string) {
    const res = await api.post("/auth/forgot-password/verify-otp", {
      email,
      otp,
    });
    return res.data;
  },

  // ===== Quên mật khẩu - Bước 3: Đặt mật khẩu mới =====
  async resetPassword(email: string, resetToken: string, newPassword: string) {
    const res = await api.post("/auth/forgot-password/reset", {
      email,
      resetToken,
      newPassword,
    });
    return res.data;
  },

  async verifyOTP(emailOrPhone: string, otp: string) {
    const isEmail = emailOrPhone.includes("@");
    const payload: VerifyOtpPayload = isEmail
      ? { otp, email: emailOrPhone }
      : { otp, phone: emailOrPhone };

    const res = await api.post("/auth/verify", payload);
    return res.data;
  },

  // ===== Lấy profile user hiện tại =====
  async getProfile(token: string) {
    const res = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      params: { _ts: Date.now() },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });

    const raw = res.data && res.data !== "" ? res.data : {};
    const u: any = raw?.user ?? raw ?? {};

    const first = u.firstName ?? u.given_name ?? u.givenName ?? "";
    const last = u.lastName ?? u.family_name ?? u.familyName ?? "";
    const fallbackFromEmail = (u.email && String(u.email).split("@")[0]) || "";

    let fullName =
      u.fullName ?? u.name ?? u.displayName ?? `${first} ${last}`.trim();
    if (!fullName) fullName = u.username || fallbackFromEmail || "User";

    // chọn avatar từ các field BE trả
    const avatarUrl =
      u.avatarUrl ??
      u.avatar ??
      u.photoURL ??
      u.photoUrl ??
      u.picture ??
      u.image ??
      "/Image.svg";

    return {
      id: u._id ?? u.id ?? null,
      fullName,
      email: u.email ?? "",
      phone: u.phone ?? u.phoneNumber ?? "",
      gender: u.gender ?? undefined,
      dob: u.dob ?? u.dateOfBirth ?? undefined,
      city: u.city ?? u.address?.city ?? undefined,
      emails: u.emails ?? undefined,
      phoneNumbers: u.phoneNumbers ?? undefined,

      // 🔥 giữ tương thích cũ
      avatar: avatarUrl, // layout.tsx cần field này
      avatarUrl, // chỗ mới dùng field này

      points: u.points ?? 0,
      memberStatus: u.memberStatus ?? "Thành viên",
    };
  },
  async uploadAvatar(file: File, token: string) {
    const form = new FormData();
    form.append("avatar", file);

    const res = await axios.post(`${API_URL}/users/me/avatar`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        // axios sẽ tự set Content-Type: multipart/form-data
      },
    });

    return res.data;
  },

  // ===== Upload avatar to Cloudinary =====
  async uploadAvatarCloud(file: File, token: string) {
    const form = new FormData();
    form.append("avatar", file);

    const res = await axios.post(`${API_URL}/users/me/avatarcloud`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  },

  // ===== Update profile avatar URL (JSON) =====
  async updateAvatarUrl(avatarUrl: string, token: string) {
    const res = await axios.put(
      `${API_URL}/users/me`,
      { avatar: avatarUrl },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  },
};

export default authApi;
