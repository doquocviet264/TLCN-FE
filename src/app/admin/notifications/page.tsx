"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Send,
  Users,
  Map,
  Calendar,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  adminNotificationApi,
  type Notification,
  type NotificationType,
  type TargetType,
  type CreateNotificationInput,
  NOTIFICATION_TYPE_LABELS,
  TARGET_TYPE_LABELS,
  formatNotificationTime,
} from "@/lib/notification/notificationApi";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const TYPE_COLORS: Record<NotificationType, { bg: string; text: string }> = {
  system: { bg: "bg-slate-100", text: "text-slate-600" },
  booking: { bg: "bg-blue-100", text: "text-blue-600" },
  tour: { bg: "bg-emerald-100", text: "text-emerald-600" },
  payment: { bg: "bg-green-100", text: "text-green-600" },
  promotion: { bg: "bg-orange-100", text: "text-orange-600" },
  chat: { bg: "bg-purple-100", text: "text-purple-600" },
  review: { bg: "bg-yellow-100", text: "text-yellow-600" },
  checkin: { bg: "bg-pink-100", text: "text-pink-600" },
};

export default function AdminNotificationsPage() {
  const { toast, showSuccess, showError, hideToast } = useToast();

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "">("");
  const [targetFilter, setTargetFilter] = useState<TargetType | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState<CreateNotificationInput>({
    type: "system",
    title: "",
    content: "",
    image: "",
    link: "",
    targetType: "all",
    targetUsers: [],
    targetTourId: "",
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

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await adminNotificationApi.getAllNotifications({
        page,
        limit,
        type: typeFilter || undefined,
        targetType: targetFilter || undefined,
      });
      setNotifications(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      showError("Không thể tải danh sách thông báo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, typeFilter, targetFilter]);

  // Open modal for create
  const openCreateModal = () => {
    setEditingNotification(null);
    setFormData({
      type: "system",
      title: "",
      content: "",
      image: "",
      link: "",
      targetType: "all",
      targetUsers: [],
      targetTourId: "",
      expiresAt: "",
    });
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      type: notification.type,
      title: notification.title,
      content: notification.content,
      image: notification.image || "",
      link: notification.link || "",
      targetType: notification.targetType,
      targetUsers: notification.targetUsers || [],
      targetTourId: notification.targetTourId || "",
      expiresAt: notification.expiresAt
        ? new Date(notification.expiresAt).toISOString().slice(0, 16)
        : "",
    });
    setShowModal(true);
  };

  // Save notification
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showError("Vui lòng nhập tiêu đề và nội dung");
      return;
    }

    setIsSaving(true);
    try {
      if (editingNotification) {
        await adminNotificationApi.updateNotification(
          editingNotification._id,
          formData
        );
        showSuccess("Đã cập nhật thông báo");
      } else {
        await adminNotificationApi.createNotification(formData);
        showSuccess("Đã tạo thông báo mới");
      }
      setShowModal(false);
      fetchNotifications();
    } catch (error: any) {
      console.error("Save error:", error);
      showError(error?.response?.data?.message || "Lỗi khi lưu thông báo");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete notification
  const handleDelete = (notification: Notification) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xóa thông báo",
      message: `Bạn có chắc muốn xóa thông báo "${notification.title}"?`,
      onConfirm: async () => {
        try {
          await adminNotificationApi.deleteNotification(notification._id);
          showSuccess("Đã xóa thông báo");
          fetchNotifications();
        } catch (error) {
          showError("Lỗi khi xóa thông báo");
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Toggle active
  const handleToggleActive = async (notification: Notification) => {
    try {
      await adminNotificationApi.updateNotification(notification._id, {
        isActive: !notification.isActive,
      });
      showSuccess(
        notification.isActive ? "Đã ẩn thông báo" : "Đã hiện thông báo"
      );
      fetchNotifications();
    } catch (error) {
      showError("Lỗi khi cập nhật trạng thái");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
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
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Quản lý Thông báo
              </h1>
              <p className="text-sm text-slate-500">
                Tạo và quản lý thông báo gửi đến người dùng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchNotifications}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
            >
              <Plus className="h-4 w-4" />
              Tạo thông báo
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm thông báo..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as NotificationType | "");
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
        >
          <option value="">Tất cả loại</option>
          {(Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]).map(
            (type) => (
              <option key={type} value={type}>
                {NOTIFICATION_TYPE_LABELS[type]}
              </option>
            )
          )}
        </select>

        {/* Target Filter */}
        <select
          value={targetFilter}
          onChange={(e) => {
            setTargetFilter(e.target.value as TargetType | "");
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
        >
          <option value="">Tất cả đối tượng</option>
          {(Object.keys(TARGET_TYPE_LABELS) as TargetType[]).map((target) => (
            <option key={target} value={target}>
              {TARGET_TYPE_LABELS[target]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Bell className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Chưa có thông báo</p>
            <p className="text-sm mt-1">Bấm "Tạo thông báo" để thêm mới</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Thông báo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Đối tượng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Đã đọc
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <tr
                    key={notification._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-slate-500 truncate mt-0.5">
                          {notification.content}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          TYPE_COLORS[notification.type].bg
                        } ${TYPE_COLORS[notification.type].text}`}
                      >
                        {NOTIFICATION_TYPE_LABELS[notification.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        {notification.targetType === "all" && (
                          <>
                            <Users className="h-4 w-4" />
                            Tất cả
                          </>
                        )}
                        {notification.targetType === "user" && (
                          <>
                            <Users className="h-4 w-4" />
                            {notification.targetUsers?.length || 0} người
                          </>
                        )}
                        {notification.targetType === "tour" && (
                          <>
                            <Map className="h-4 w-4" />
                            Tour
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {notification.readCount || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(notification)}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          notification.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {notification.isActive ? "Đang hiện" : "Đã ẩn"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatNotificationTime(notification.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(notification)}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notification)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-sm text-slate-500">
                  Hiển thị {(page - 1) * limit + 1} -{" "}
                  {Math.min(page * limit, total)} / {total} thông báo
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </button>
                  <span className="px-3 text-sm text-slate-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl m-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">
                {editingNotification ? "Sửa thông báo" : "Tạo thông báo mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Loại thông báo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as NotificationType,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {(
                    Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]
                  ).map((type) => (
                    <option key={type} value={type}>
                      {NOTIFICATION_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Nhập tiêu đề thông báo..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Nhập nội dung thông báo..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Hình ảnh (URL)
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, image: e.target.value }))
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Đường dẫn khi click
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, link: e.target.value }))
                  }
                  placeholder="/user/bookings hoặc URL"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Đối tượng nhận
                </label>
                <select
                  value={formData.targetType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetType: e.target.value as TargetType,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {(Object.keys(TARGET_TYPE_LABELS) as TargetType[]).map(
                    (target) => (
                      <option key={target} value={target}>
                        {TARGET_TYPE_LABELS[target]}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Target Tour ID (if targetType === 'tour') */}
              {formData.targetType === "tour" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tour ID
                  </label>
                  <input
                    type="text"
                    value={formData.targetTourId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetTourId: e.target.value,
                      }))
                    }
                    placeholder="Nhập Tour ID..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              )}

              {/* Expires At */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Hết hạn (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiresAt: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {editingNotification ? "Cập nhật" : "Gửi thông báo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
