"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  MapPin,
  Percent,
  Banknote,
  Calendar,
  Search,
  Filter,
  Sparkles,
} from "lucide-react";
import { voucherApi, type Voucher } from "@/lib/voucher/voucherApi";
import useUser from "#/src/hooks/useUser";
import { useRouter } from "next/navigation";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  active: {
    label: "Có thể sử dụng",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  used: {
    label: "Đã sử dụng",
    color: "text-slate-500",
    bg: "bg-slate-50 border-slate-200",
    icon: Check,
  },
  expired: {
    label: "Đã hết hạn",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    icon: XCircle,
  },
};

const filterOptions = [
  { value: "", label: "Tất cả voucher" },
  { value: "active", label: "Có thể sử dụng" },
  { value: "used", label: "Đã sử dụng" },
  { value: "expired", label: "Đã hết hạn" },
];

export default function MyVouchersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useUser();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/user/vouchers");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch vouchers từ BE (luôn lấy full list, filter ở client)
  useEffect(() => {
    const fetchVouchers = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await voucherApi.getMyVouchers(); // không truyền status
        setVouchers(data);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
        setVouchers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVouchers();
  }, [isAuthenticated]);

  // Filter theo status + search
  useEffect(() => {
    let result = [...vouchers];

    // Lọc theo status
    if (statusFilter) {
      result = result.filter((v) => v.status === statusFilter);
    }

    // Lọc theo search
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (v) =>
          v.code.toLowerCase().includes(lowerSearch) ||
          v.description?.toLowerCase().includes(lowerSearch) ||
          v.provinceName?.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredVouchers(result);
  }, [searchTerm, statusFilter, vouchers]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Không giới hạn";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDiscountText = (voucher: Voucher) => {
    if (voucher.type === "percent") {
      return `Giảm ${voucher.value}%${
        voucher.maxDiscount
          ? ` (tối đa ${formatCurrency(voucher.maxDiscount)})`
          : ""
      }`;
    }
    return `Giảm ${formatCurrency(voucher.value)}`;
  };

  // Stats (tính từ full list)
  const stats = {
    total: vouchers.length,
    active: vouchers.filter((v) => v.status === "active").length,
    used: vouchers.filter((v) => v.status === "used").length,
    expired: vouchers.filter((v) => v.status === "expired").length,
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải voucher...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Kho Voucher của tôi
              </h1>
              <p className="text-slate-500 text-sm">
                Quản lý và sử dụng các phiếu giảm giá
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-slate-800">
                {stats.total}
              </span>
            </div>
            <p className="text-sm text-slate-500">Tổng voucher</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600">
                {stats.active}
              </span>
            </div>
            <p className="text-sm text-slate-500">Có thể dùng</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-slate-400" />
              <span className="text-2xl font-bold text-slate-500">
                {stats.used}
              </span>
            </div>
            <p className="text-sm text-slate-500">Đã sử dụng</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-bold text-red-500">
                {stats.expired}
              </span>
            </div>
            <p className="text-sm text-slate-500">Hết hạn</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-slate-700"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-56">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all appearance-none bg-white text-slate-700"
                >
                  {filterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Voucher List */}
        {filteredVouchers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm"
          >
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Gift className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              Chưa có voucher nào
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter
                ? "Không tìm thấy voucher phù hợp với bộ lọc"
                : "Hãy khám phá bản đồ hành trình để nhận voucher giảm giá nhé!"}
            </p>
            <button
              onClick={() => router.push("/user/map")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
            >
              Khám phá Hành Trình
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className="grid gap-4"
          >
            <AnimatePresence>
              {filteredVouchers.map((voucher) => {
                const status =
                  statusConfig[voucher.status] || statusConfig.active;
                const StatusIcon = status.icon;
                const isActive = voucher.status === "active";

                return (
                  <motion.div
                    key={voucher._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden ${
                      isActive
                        ? "border-emerald-200 hover:shadow-lg hover:border-emerald-300"
                        : "border-slate-100 opacity-75"
                    } transition-all`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Left Side - Discount */}
                      <div
                        className={`md:w-48 p-6 flex flex-col items-center justify-center ${
                          isActive
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                            : "bg-slate-200"
                        }`}
                      >
                        {voucher.type === "percent" ? (
                          <Percent
                            className={`w-8 h-8 ${
                              isActive ? "text-white/80" : "text-slate-400"
                            } mb-2`}
                          />
                        ) : (
                          <Banknote
                            className={`w-8 h-8 ${
                              isActive ? "text-white/80" : "text-slate-400"
                            } mb-2`}
                          />
                        )}
                        <span
                          className={`text-3xl font-black ${
                            isActive ? "text-white" : "text-slate-500"
                          }`}
                        >
                          {voucher.type === "percent"
                            ? `${voucher.value}%`
                            : formatCurrency(voucher.value)}
                        </span>
                        <span
                          className={`text-sm ${
                            isActive ? "text-white/80" : "text-slate-400"
                          }`}
                        >
                          GIẢM GIÁ
                        </span>
                      </div>

                      {/* Right Side - Details */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.color}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </span>
                              {voucher.provinceName && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  <MapPin className="w-3 h-3" />
                                  {voucher.provinceName}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 text-sm">
                              {voucher.description || getDiscountText(voucher)}
                            </p>
                          </div>
                        </div>

                        {/* Voucher Code */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-2.5 font-mono font-bold text-lg text-slate-800 text-center">
                            {voucher.code}
                          </div>
                          {isActive && (
                            <button
                              onClick={() => handleCopyCode(voucher.code)}
                              className={`p-3 rounded-xl transition-all ${
                                copiedCode === voucher.code
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600"
                              }`}
                            >
                              {copiedCode === voucher.code ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Info Row */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          {voucher.minOrderValue &&
                            voucher.minOrderValue > 0 && (
                              <span className="flex items-center gap-1">
                                <Banknote className="w-3.5 h-3.5" />
                                Đơn tối thiểu:{" "}
                                {formatCurrency(voucher.minOrderValue)}
                              </span>
                            )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            HSD: {formatDate(voucher.expiresAt)}
                          </span>
                          {voucher.usedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Sử dụng: {formatDate(voucher.usedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Decorative circle */}
                    <div className="absolute left-44 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full hidden md:block"></div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Summary */}
        {filteredVouchers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200 text-center"
          >
            <p className="text-sm text-slate-600">
              Hiển thị{" "}
              <span className="font-bold text-slate-800">
                {filteredVouchers.length}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-bold text-slate-800">
                {vouchers.length}
              </span>{" "}
              voucher
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
