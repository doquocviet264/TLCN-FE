"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "#/stores/auth";
import { authApi } from "@/lib/auth/authApi";
import {
  Plus,
  Camera,
  User,
  Lock,
  Mail,
  Phone,
  Save,
  MapPin,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  Globe,
  Clock,
  Ban,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { blogApi, BlogSummary } from "@/lib/blog/blogApi";

// URL BE
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

// Types
type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  dob?: string;
  city?: string;
  emails?: { email: string; isVerified: boolean; isPrimary: boolean }[];
  phoneNumbers?: { phone: string; isVerified: boolean; isPrimary: boolean }[];
  avatarUrl?: string;
  avatar?: string;
  hasPassword?: boolean;
  isGoogleLogin?: boolean;
};

// --- Component: Tab Button ---
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
        active
          ? "border-orange-500 text-orange-600 bg-orange-50/50"
          : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// --- 1. InfoTab ---
function InfoTab({ user, token, onSuccess }: { user: UserProfile; token: string; onSuccess: () => void }) {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [gender, setGender] = useState(user.gender || "Male");
  const [city, setCity] = useState(user.city || "");

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(user.phone || "");

  useEffect(() => {
    if (user.dob) {
      const date = new Date(user.dob);
      if (!Number.isNaN(date.getTime())) {
        setDay(String(date.getDate()));
        setMonth(String(date.getMonth() + 1));
        setYear(String(date.getFullYear()));
      }
    }
  }, [user.dob]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const dob =
        day && month && year
          ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          : undefined;

      const profileData = { fullName, gender, city, dob, phoneNumber: phoneInput };
      await authApi.updateProfile(profileData, token);
      
      onSuccess();
      toast.success("Đã cập nhật thông tin thành công!");
      setIsEditingPhone(false);
    } catch {
      toast.error("Cập nhật thất bại! Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Card: Thông tin cá nhân */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Thông tin cơ bản</h2>
          <p className="text-sm text-slate-500">
            Quản lý tên hiển thị và thông tin cá nhân của bạn.
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Tên đầy đủ */}
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Họ và tên
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>

              {/* Giới tính */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Giới tính
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all appearance-none"
                >
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              {/* Thành phố */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Thành phố
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="VD: Hồ Chí Minh"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>

              {/* Ngày sinh */}
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ngày sinh
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                    >
                      <option value="">Ngày</option>
                      {days.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                    >
                      <option value="">Tháng</option>
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                    >
                      <option value="">Năm</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-blue-950 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-900 hover:-translate-y-0.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={18} />}
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Card: Thông tin liên hệ (Email & Phone) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Email */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Mail size={16} />
              </div>
              <h3 className="font-bold text-slate-800">Email</h3>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-sm font-medium text-slate-700">
                {user.email}
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                Chính
              </span>
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Phone size={16} />
              </div>
              <h3 className="font-bold text-slate-800">Số điện thoại</h3>
            </div>
            <button type="button" onClick={() => setIsEditingPhone(!isEditingPhone)} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              {isEditingPhone ? "Hủy" : "Chỉnh sửa"}
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
              {isEditingPhone ? (
                 <input autoFocus type="text" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full bg-transparent outline-none text-sm font-medium" placeholder="Nhập số điện thoại" />
              ) : (
                <span className="text-sm font-medium text-slate-700">
                  {phoneInput || "Chưa cập nhật"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 2. Password Tab ---
function PasswordTab({ user }: { user: UserProfile }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthColors = ["bg-slate-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-emerald-500"];
  const strengthTexts = ["", "Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];

  // Nếu tải qua Google Auth thì ẩn tab password
  if (user.isGoogleLogin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
        <div className="flex flex-col items-center gap-3">
           <Lock className="w-12 h-12 text-blue-300" />
           <p className="text-slate-600 font-medium">Tài khoản của bạn được đăng nhập qua Google.</p>
           <p className="text-sm text-slate-500">Bạn không cần và không thể đổi mật khẩu cho tài khoản này.</p>
        </div>
      </div>
    );
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    
    // Check password strength requirements
    const pwdErrors = [];
    if (newPassword.length < 8) pwdErrors.push("ít nhất 8 ký tự");
    if (!/[a-z]/.test(newPassword)) pwdErrors.push("1 chữ thường");
    if (!/[A-Z]/.test(newPassword)) pwdErrors.push("1 chữ hoa");
    if (!/[0-9]/.test(newPassword)) pwdErrors.push("1 chữ số");
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/]/.test(newPassword)) pwdErrors.push("1 ký tự đặc biệt");
    if (pwdErrors.length > 0) {
      toast.error(`Mật khẩu cần có: ${pwdErrors.join(", ")}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.changePassword(oldPassword, newPassword);
      toast.success("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Đổi mật khẩu thất bại!";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Đổi mật khẩu</h2>
          <p className="text-sm text-slate-500">
            Nên sử dụng mật khẩu mạnh để bảo vệ tài khoản.
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleChangePassword} className="max-w-xl space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>

              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength >= 4 ? "text-emerald-600" : passwordStrength >= 3 ? "text-yellow-600" : "text-red-500"}`}>
                    {strengthTexts[passwordStrength]}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-500 hover:-translate-y-0.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={18} />}
                {isSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- 3. My Posts Tab ---
function MyPostsTab() {
  const [posts, setPosts] = useState<BlogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published" | "private" | "rejected">("all");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await blogApi.getMyPosts(1, 100);
      setPosts(res.data || []);
    } catch (error) {
      console.error("Lỗi tải bài viết:", error);
      toast.error("Không tải được danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.")) return;
    try {
      await blogApi.deleteBlog(id);
      toast.success("Đã xóa bài viết");
      fetchPosts();
    } catch (err) {
      toast.error("Lỗi khi xóa bài viết");
    }
  };

  const handleTogglePrivacy = async (id: string, currentPrivacy: "public" | "private") => {
    try {
      const newPrivacy = currentPrivacy === "public" ? "private" : "public";
      await blogApi.togglePrivacy(id, newPrivacy);
      toast.success(`Đã chuyển sang chế độ ${newPrivacy === "public" ? "Công khai" : "Riêng tư"}`);
      fetchPosts();
    } catch (err) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filter === "all") return true;
    if (filter === "pending") return p.status === "pending";
    if (filter === "published") return p.status === "published" && p.privacy === "public";
    if (filter === "private") return p.privacy === "private";
    if (filter === "rejected") return p.status === "rejected";
    return true;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Bài viết của tôi</h2>
            <p className="text-sm text-slate-500">
              Quản lý các bài viết bạn đã đăng hoặc đang lưu trữ.
            </p>
          </div>
          <a href="/user/post-blog" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition flex items-center gap-2 flex-shrink-0">
            <Plus size={16} /> Viết bài mới
          </a>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
          {[
            { id: "all", label: "Tất cả" },
            { id: "pending", label: "Chờ duyệt" },
            { id: "published", label: "Công khai" },
            { id: "private", label: "Riêng tư" },
            { id: "rejected", label: "Từ chối" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === f.id ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
             <div className="text-center py-10 text-slate-500">
               <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent flex rounded-full mx-auto mb-3"></div>
               Đang tải bài viết...
             </div>
          ) : filteredPosts.length === 0 ? (
             <div className="text-center py-10">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Không tìm thấy bài viết nào.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map(post => {
                  const isPublic = post.status === "published" && post.privacy === "public";
                  const isPrivate = post.privacy === "private";
                  const isPending = post.status === "pending";
                  const isRejected = post.status === "rejected";

                  return (
                    <div key={post._id} className="group border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col bg-white">
                      <div className="relative h-40 bg-slate-100">
                        <img src={post.coverImageUrl || post.cover || post.thumbnail || '/blog-placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {isPublic && <span className="bg-emerald-500/90 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1"><Globe size={10}/> Công khai</span>}
                          {isPrivate && <span className="bg-slate-800/90 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1"><Lock size={10}/> Riêng tư</span>}
                          {isPending && <span className="bg-amber-500/90 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1"><Clock size={10}/> Chờ duyệt</span>}
                          {isRejected && <span className="bg-red-500/90 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1"><Ban size={10}/> Từ chối</span>}
                        </div>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex gap-2 text-[11px] text-slate-400 mb-2 font-medium">
                           <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(post.createdAt!).toLocaleDateString('vi-VN')}</span>
                           <span className="flex items-center gap-1"><MessageSquare size={12}/> {post.commentsCount || 0}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug mb-3">{post.title}</h3>
                        
                        {isRejected && post.rejectReason && (
                          <div className="mt-auto mb-3 bg-red-50 p-2 rounded text-xs text-red-700 flex gap-1.5 items-start border border-red-100">
                             <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                             <span>{post.rejectReason}</span>
                          </div>
                        )}

                        <div className="mt-auto pt-3 flex gap-2 border-t border-slate-100">
                          <a href={`/user/blog/preview/${post.slug}`} className="flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                            <Eye size={14} /> Xem
                          </a>
                          <a href={`/user/post-blog/edit/${post._id}`} className="flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                            <Edit size={14} /> Sửa
                          </a>
                          <button onClick={() => handleDelete(post._id!)} title="Xóa bài viết" className="px-2 flex justify-center items-center text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                           <span className="text-[11px] font-medium text-slate-500">Chế độ hiển thị:</span>
                           <button 
                             onClick={() => handleTogglePrivacy(post._id!, post.privacy || "public")}
                             className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                               post.privacy === "private"
                                 ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                                 : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200"
                             }`}
                           >
                              {post.privacy === "private" ? (
                                <><Lock size={11} className="mr-0.5"/> Riêng tư <span className="opacity-40 mx-0.5">|</span> <span className="font-semibold">Đổi</span></>
                              ) : (
                                <><Globe size={11} className="mr-0.5"/> Công khai <span className="opacity-40 mx-0.5">|</span> <span className="font-semibold">Đổi</span></>
                              )}
                           </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
function ProfileContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"info" | "password" | "posts">(
    tabParam === "posts" ? "posts" : tabParam === "password" ? "password" : "info"
  );
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const accessToken = useAuthStore((s) => s.token.accessToken);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchUser = async (showLoading = true) => {
    if (!accessToken) return;
    try {
      if (showLoading) setLoading(true);
      const userData = await authApi.getProfile(accessToken);
      setUser(userData as UserProfile);
      setAuthUser(userData as any);
    } catch (error) {
      console.error("Lỗi tải profile:", error);
      toast.error("Không tải được thông tin người dùng");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // load profile
  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    fetchUser(true);
  }, [accessToken]);

  // upload avatar to Cloudinary
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện không được vượt quá 5MB");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
      e.target.value = "";
      return;
    }

    try {
      setUploadingAvatar(true);
      const data = await authApi.uploadAvatarCloud(file, accessToken);
      console.log("Avatar response:", data); // Debug log

      // Cloudinary API trả về avatarUrl
      const newAvatarUrl = data.avatarUrl || data.user?.avatar || data.avatar;

      setUser((prev) =>
        prev
          ? {
              ...prev,
              avatarUrl: newAvatarUrl,
              avatar: newAvatarUrl,
            }
          : prev
      );

      // 🔥 Reload profile data từ API để sync toàn bộ (Header sẽ tự cập nhật từ store)
      const updatedUser = await authApi.getProfile(accessToken);
      setAuthUser(updatedUser as any);

      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      console.error("Avatar upload error:", err);
      const message =
        err instanceof Error ? err.message : "Có lỗi khi upload avatar!";
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500"></div>
      </div>
    );
  }

  if (!accessToken || !user) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Bạn chưa đăng nhập</h2>
        <p className="text-slate-500">Vui lòng đăng nhập để xem trang này.</p>
      </div>
    );
  }

  const avatarSrc = user.avatarUrl || user.avatar || "/default-avatar.png";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        {/* --- Header & Avatar --- */}
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
          <div className="relative group">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src={avatarSrc}
                alt={user.fullName}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            {/* Nút camera tròn */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white shadow-md ring-4 ring-slate-50 transition-all hover:bg-orange-500"
            >
              {uploadingAvatar ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Camera size={16} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="pt-2">
            <h1 className="text-3xl font-extrabold text-blue-950">
              {user.fullName}
            </h1>
            <p className="text-slate-500 mt-1">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Tài khoản đang hoạt động
            </div>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="flex w-full border-b border-slate-200 overflow-x-auto scrollbar-hide">
          <TabButton
            active={activeTab === "info"}
            onClick={() => setActiveTab("info")}
            icon={User}
            label="Thông tin cá nhân"
          />
          <TabButton
            active={activeTab === "posts"}
            onClick={() => setActiveTab("posts")}
            icon={FileText}
            label="Bài viết của tôi"
          />
          <TabButton
            active={activeTab === "password"}
            onClick={() => setActiveTab("password")}
            icon={Lock}
            label="Mật khẩu & Bảo mật"
          />
        </div>

        {/* --- Tab Content --- */}
        <div className="min-h-[400px]">
          {activeTab === "info" && <InfoTab user={user} token={accessToken} onSuccess={() => fetchUser(false)} />}
          {activeTab === "posts" && <MyPostsTab />}
          {activeTab === "password" && <PasswordTab user={user} />}
        </div>
      </div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <React.Suspense fallback={<div className="flex h-96 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" /></div>}>
      <ProfileContent />
    </React.Suspense>
  );
}
