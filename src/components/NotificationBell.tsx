"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Map,
  CreditCard,
  Gift,
  MessageCircle,
  Star,
  MapPin,
  X,
  Loader2,
} from "lucide-react";
import {
  notificationApi,
  type Notification,
  type NotificationType,
  formatNotificationTime,
} from "@/lib/notification/notificationApi";

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  system: <Bell className="h-4 w-4" />,
  booking: <Calendar className="h-4 w-4" />,
  tour: <Map className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  promotion: <Gift className="h-4 w-4" />,
  chat: <MessageCircle className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />,
  checkin: <MapPin className="h-4 w-4" />,
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

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Load unread count error:", err);
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getMyNotifications(1, 10);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Load notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Polling unread count (every 30s)
  useEffect(() => {
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Mark as read
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await notificationApi.markAsRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all as read error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Click notification
  const handleNotificationClick = async (notification: Notification) => {
    await handleMarkAsRead(notification);
    setIsOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Thông báo</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                >
                  {markingAll ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3" />
                  )}
                  Đọc tất cả
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Chưa có thông báo</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        TYPE_COLORS[notification.type]
                      }`}
                    >
                      {notification.image ? (
                        <img
                          src={notification.image}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        TYPE_ICONS[notification.type]
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm line-clamp-1 ${
                            !notification.isRead
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {notification.content}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t bg-gray-50 px-4 py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/user/notifications");
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
