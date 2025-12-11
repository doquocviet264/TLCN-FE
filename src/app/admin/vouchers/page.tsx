"use client";

import { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Copy,
  Check,
  Percent,
  Banknote,
  Users,
  Calendar,
  TrendingUp,
  MoreVertical,
  X,
  Send,
  RefreshCw,
} from "lucide-react";
import {
  adminVoucherApi,
  type Voucher,
  type CreateVoucherInput,
} from "@/lib/voucher/voucherApi";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Hoạt động" },
  used: { bg: "bg-slate-100", text: "text-slate-600", label: "Đã dùng" },
  expired: { bg: "bg-red-100", text: "text-red-600", label: "Hết hạn" },
};

const typeLabels: Record<string, string> = {
  percent: "Giảm %",
  fixed: "Giảm tiền",
};

export default function AdminVouchersPage() {
  const { toast, showSuccess, showError, hideToast } = useToast();

  // State
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
    totalDiscount: 0,
  });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState<CreateVoucherInput>({
    code: "",
    type: "percent",
    value: 10,
    minOrderValue: 0,
    maxDiscount: 0,
    description: "",
    expiresAt: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      setIsLoading(true);
      const res = await adminVoucherApi.getAllVouchers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setVouchers(res.data || []);
      setTotalPages(Math.ceil((res.total || 0) / (res.limit || 10)));
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      // Mock data nếu API chưa có
      setVouchers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await adminVoucherApi.getVoucherStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchStats();
  }, [page, statusFilter, typeFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchVouchers();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Generate random code
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "AHH-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  // Handle copy
  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || formData.value <= 0) {
      showError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSaving(true);
    try {
      if (editingVoucher) {
        await adminVoucherApi.updateVoucher(editingVoucher._id, formData);
        showSuccess("Cập nhật voucher thành công!");
      } else {
        await adminVoucherApi.createVoucher(formData);
        showSuccess("Tạo voucher thành công!");
      }
      setShowModal(false);
      resetForm();
      fetchVouchers();
      fetchStats();
    } catch (error: any) {
      showError(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = (voucher: Voucher) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xóa voucher",
      message: `Bạn có chắc muốn xóa voucher "${voucher.code}"?`,
      onConfirm: async () => {
        try {
          await adminVoucherApi.deleteVoucher(voucher._id);
          showSuccess("Đã xóa voucher");
          fetchVouchers();
          fetchStats();
        } catch (error: any) {
          showError(error.response?.data?.message || "Xóa thất bại");
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Open edit modal
  const openEditModal = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      minOrderValue: voucher.minOrderValue || 0,
      maxDiscount: voucher.maxDiscount || 0,
      description: voucher.description || "",
      expiresAt: voucher.expiresAt
        ? new Date(voucher.expiresAt).toISOString().split("T")[0]
        : "",
    });
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingVoucher(null);
    setFormData({
      code: "",
      type: "percent",
      value: 10,
      minOrderValue: 0,
      maxDiscount: 0,
      description: "",
      expiresAt: "",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Không giới hạn";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="p-6 space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Gift className="w-7 h-7 text-emerald-600" />
            Quản lý Voucher
          </h1>
          <p className="text-slate-500">Tạo và quản lý các mã giảm giá</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          Tạo Voucher
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <Gift className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
          </div>
          <p className="text-sm text-slate-500">Tổng voucher</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <Check className="w-5 h-5 text-emerald-500" />
            <span className="text-2xl font-bold text-emerald-600">{stats.active}</span>
          </div>
          <p className="text-sm text-slate-500">Đang hoạt động</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <span className="text-2xl font-bold text-indigo-600">{stats.used}</span>
          </div>
          <p className="text-sm text-slate-500">Đã sử dụng</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-red-600">{stats.expired}</span>
          </div>
          <p className="text-sm text-slate-500">Hết hạn</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-lg font-bold text-orange-600">
              {formatCurrency(stats.totalDiscount)}
            </span>
          </div>
          <p className="text-sm text-slate-500">Tổng giảm giá</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="used">Đã dùng</option>
            <option value="expired">Hết hạn</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white"
          >
            <option value="">Tất cả loại</option>
            <option value="percent">Giảm %</option>
            <option value="fixed">Giảm tiền</option>
          </select>

          <button
            onClick={() => {
              fetchVouchers();
              fetchStats();
            }}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Đang tải...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Chưa có voucher nào
            </h3>
            <p className="text-slate-500 mb-4">
              Tạo voucher đầu tiên để bắt đầu
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
            >
              Tạo Voucher
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Mã Voucher
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Loại
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Giá trị
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Điều kiện
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Hạn sử dụng
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((voucher) => {
                  const status = statusColors[voucher.status] || statusColors.active;

                  return (
                    <tr key={voucher._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">
                            {voucher.code}
                          </span>
                          <button
                            onClick={() => handleCopy(voucher.code)}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            {copiedCode === voucher.code ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </div>
                        {voucher.description && (
                          <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                            {voucher.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                          {voucher.type === "percent" ? (
                            <Percent className="w-3 h-3" />
                          ) : (
                            <Banknote className="w-3 h-3" />
                          )}
                          {typeLabels[voucher.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-600">
                          {voucher.type === "percent"
                            ? `${voucher.value}%`
                            : formatCurrency(voucher.value)}
                        </span>
                        {voucher.maxDiscount && voucher.type === "percent" && (
                          <p className="text-xs text-slate-500">
                            Tối đa: {formatCurrency(voucher.maxDiscount)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {voucher.minOrderValue && voucher.minOrderValue > 0 ? (
                          <span>Đơn từ {formatCurrency(voucher.minOrderValue)}</span>
                        ) : (
                          <span className="text-slate-400">Không giới hạn</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(voucher.expiresAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(voucher)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(voucher)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-100">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  page === i + 1
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingVoucher ? "Sửa Voucher" : "Tạo Voucher Mới"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mã Voucher
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="VD: AHH-SUMMER2024"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium"
                  >
                    Tạo mã
                  </button>
                </div>
              </div>

              {/* Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Loại giảm giá
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as "percent" | "fixed",
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="percent">Giảm theo %</option>
                    <option value="fixed">Giảm số tiền cố định</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Giá trị {formData.type === "percent" ? "(%)" : "(VNĐ)"}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        value: Number(e.target.value),
                      }))
                    }
                    min={1}
                    max={formData.type === "percent" ? 100 : undefined}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderValue || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minOrderValue: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="0 = Không giới hạn"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                </div>
                {formData.type === "percent" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscount || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxDiscount: Number(e.target.value) || 0,
                        }))
                      }
                      placeholder="0 = Không giới hạn"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Expires */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ngày hết hạn
                </label>
                <input
                  type="date"
                  value={formData.expiresAt || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Mô tả voucher (hiển thị cho khách hàng)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? "Đang lưu..."
                    : editingVoucher
                    ? "Cập nhật"
                    : "Tạo Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
