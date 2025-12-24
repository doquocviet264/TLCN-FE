"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Calendar,
  Map,
  CreditCard,
  Gift,
  MessageCircle,
  Star,
  MapPin,
  Loader2,
  Home,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  notificationApi,
  type Notification,
  type NotificationType,
  formatNotificationTime,
  NOTIFICATION_TYPE_LABELS,
} from "@/lib/notification/notificationApi";

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  system: <Bell className="h-5 w-5" />,
  booking: <Calendar className="h-5 w-5" />,
  tour: <Map className="h-5 w-5" />,
  payment: <CreditCard className="h-5 w-5" />,
  promotion: <Gift className="h-5 w-5" />,
  chat: <MessageCircle className="h-5 w-5" />,
  review: <Star className="h-5 w-5" />,
  checkin: <MapPin className="h-5 w-5" />,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  system: "bg-slate-100 text-slate-600",
  booking: "bg-blue-100 text-blue-600",
  tour: "bg-emerald-100 text-emerald-600",
  payment: "bg-green-100 text-green-600",
  promotion: "bg-orange-100 text-orange-600",
  chat: "bg-purple-100 text-purple-600",
  review: "bg-yellow-100 text-yellow-600",
  checkin: "bg-pink-100 text-pink-600",
};

export default function UserNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const limit = 15;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getMyNotifications(page, limit);
      let data = res.data || [];

      // Client-side filter by type
      if (filterType !== "all") {
        data = data.filter((n) => n.type === filterType);
      }

      setNotifications(data);
      setTotal(res.total);
    } catch (err) {
      console.error("Load notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await notificationApi.markAsRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Mark all as read error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await handleMarkAsRead(notification);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/user/home")}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Home className="h-5 w-5" />
              </button>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
                <Bell className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Thông báo</h1>
                <p className="text-sm text-blue-200">
                  {unreadCount > 0
                    ? `${unreadCount} thông báo chưa đọc`
                    : "Tất cả thông báo đã đọc"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Filter */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <button
            onClick={() => setFilterType("all")}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filterType === "all"
                ? "bg-orange-500 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tất cả
          </button>
          {(Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]).map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filterType === type
                    ? "bg-orange-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {NOTIFICATION_TYPE_LABELS[type]}
              </button>
            )
          )}
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Bell className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Chưa có thông báo</p>
              <p className="text-sm mt-1">
                Các thông báo mới sẽ xuất hiện ở đây
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex gap-4 p-5 cursor-pointer transition-colors hover:bg-slate-50 ${
                    !notification.isRead ? "bg-blue-50/50" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      TYPE_COLORS[notification.type]
                    }`}
                  >
                    {notification.image ? (
                      <img
                        src={notification.image}
                        alt=""
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      TYPE_ICONS[notification.type]
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              TYPE_COLORS[notification.type]
                            }`}
                          >
                            {NOTIFICATION_TYPE_LABELS[notification.type]}
                          </span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p
                          className={`text-sm ${
                            !notification.isRead
                              ? "font-semibold text-slate-900"
                              : "font-medium text-slate-700"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-sm text-slate-500">
                Trang {page} / {totalPages}
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
        </div>
      </div>
    </div>
  );
}
