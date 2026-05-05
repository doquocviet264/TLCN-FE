"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Users,
  MapPin,
  Calendar,
  ChevronLeft,
  RefreshCw,
  Phone,
  Mail,
  User,
  ChevronRight,
} from "lucide-react";
import {
  leaderToursApi,
  leaderChatApi,
  leaderBookingApi,
  LeaderTour,
  ChatMessage,
  TourBooking,
  leaderAuthApi,
} from "@/lib/leader/leaderApi";

const ROLE_COLORS: Record<string, { bg: string; text: string; bubble: string }> = {
  admin: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    bubble: "bg-gradient-to-r from-blue-600 to-blue-700 text-white",
  },
  leader: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    bubble: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
  },
  user: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    bubble: "bg-white/10 text-white border border-white/10",
  },
  guest: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    bubble: "bg-white/10 text-white border border-white/10",
  },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  leader: "Leader",
  user: "Khách hàng",
  guest: "Khách",
};

function formatChatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeaderChatPage() {
  const [tours, setTours] = useState<LeaderTour[]>([]);
  const [selectedTour, setSelectedTour] = useState<LeaderTour | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [leader, setLeader] = useState<any>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Build a map of userId -> customerName for quick lookup
  const userNameMap = useCallback(() => {
    const map: Record<string, string> = {};
    bookings.forEach((b) => {
      if (b.userId) {
        map[b.userId] = b.customerName;
      }
    });
    return map;
  }, [bookings]);

  // Load tours
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedLeader = leaderAuthApi.getStoredLeader();
        setLeader(storedLeader);

        const toursData = await leaderToursApi.getMyTours();
        // Filter only active tours (not completed/closed)
        const activeTours = toursData.filter(
          (t) => t.status !== "completed" && t.status !== "closed"
        );
        setTours(activeTours);
      } catch (err) {
        console.error("Error loading tours:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load messages when tour selected
  const loadMessages = useCallback(async (tourId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await leaderChatApi.getTourMessages(tourId);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Load bookings when tour selected
  const loadBookings = useCallback(async (tourId: string) => {
    setIsLoadingBookings(true);
    try {
      const res = await leaderBookingApi.getTourBookings(tourId);
      setBookings(res.data || []);
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTour) {
      loadMessages(selectedTour._id);
      loadBookings(selectedTour._id);
    }
  }, [selectedTour, loadMessages, loadBookings]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto refresh messages every 10 seconds
  useEffect(() => {
    if (!selectedTour) return;

    const interval = setInterval(() => {
      loadMessages(selectedTour._id);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedTour, loadMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTour || isSending) return;

    setIsSending(true);
    try {
      const res = await leaderChatApi.sendTourMessage(selectedTour._id, newMessage.trim());
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  // Get display name for a message
  const getDisplayName = (msg: ChatMessage) => {
    // If message has name, use it
    if (msg.name) return msg.name;

    // Try to find name from bookings
    const nameMap = userNameMap();
    if (msg.fromId && nameMap[msg.fromId]) {
      return nameMap[msg.fromId];
    }

    // Fallback
    return ROLE_LABELS[msg.fromRole] || "Khách hàng";
  };

  // Calculate total guests
  const totalGuests = bookings.reduce((sum, b) => sum + (b.guestCount || 1), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex bg-[#0f172a]">
      {/* Sidebar - Tour List */}
      <div
        className={`
          ${selectedTour ? "hidden md:flex" : "flex"}
          w-full md:w-80 lg:w-96 flex-col border-r border-white/10 bg-white/5
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat nhóm Tour
          </h1>
          <p className="text-sm text-blue-100 mt-1">
            Liên lạc với khách hàng
          </p>
        </div>

        {/* Tour List */}
        <div className="flex-1 overflow-y-auto">
          {tours.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có tour nào đang hoạt động</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {tours.map((tour) => (
                <button
                  key={tour._id}
                  onClick={() => setSelectedTour(tour)}
                  className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                    selectedTour?._id === tour._id ? "bg-blue-500/10 border-l-4 border-orange-500" : ""
                  }`}
                >
                  <h3 className="font-semibold text-white truncate">
                    {tour.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{tour.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tour.status === "in_progress"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : tour.status === "confirmed"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {tour.status === "in_progress"
                        ? "Đang diễn ra"
                        : tour.status === "confirmed"
                        ? "Đã xác nhận"
                        : tour.status}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="w-3 h-3" />
                      {tour.bookedCount || 0}/{tour.quantity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedTour ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {selectedTour ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-4">
              <button
                onClick={() => setSelectedTour(null)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-white truncate">
                  {selectedTour.title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedTour.destination}
                  </span>
                  <span className="flex items-center gap-1 text-orange-400 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    {bookings.length} đơn đặt • {totalGuests} khách
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-2 rounded-lg transition-colors ${
                  showParticipants
                    ? "bg-orange-500/20 text-orange-400"
                    : "hover:bg-white/10 text-slate-400"
                }`}
                title="Danh sách khách hàng"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => loadMessages(selectedTour._id)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
                title="Làm mới"
              >
                <RefreshCw className={`w-5 h-5 ${isLoadingMessages ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Chưa có tin nhắn</p>
                    <p className="text-sm mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.fromRole === "leader" && msg.fromId === leader?.id;
                    const roleColors = ROLE_COLORS[msg.fromRole] || ROLE_COLORS.user;
                    const displayName = getDisplayName(msg);

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] ${isMe ? "order-2" : "order-1"}`}
                        >
                          {/* Sender info */}
                          {!isMe && (
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors.bg} ${roleColors.text}`}
                              >
                                {ROLE_LABELS[msg.fromRole] || msg.fromRole}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {displayName}
                              </span>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-md shadow-lg shadow-orange-500/25"
                                : "bg-white/10 text-white border border-white/10 rounded-bl-md"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>

                          {/* Time */}
                          <p
                            className={`text-xs text-slate-500 mt-1 px-1 ${
                              isMe ? "text-right" : "text-left"
                            }`}
                          >
                            {formatChatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Participants Panel */}
              {showParticipants && (
                <div className="w-72 border-l border-white/10 bg-white/5 overflow-y-auto">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-400" />
                      Danh sách khách ({totalGuests} người)
                    </h3>
                  </div>

                  {isLoadingBookings ? (
                    <div className="p-4 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      <p className="text-sm">Chưa có khách đặt tour</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {bookings.map((booking) => (
                        <div key={booking._id} className="p-3 hover:bg-white/5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                              {booking.customerAvatar ? (
                                <img
                                  src={booking.customerAvatar}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-orange-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">
                                {booking.customerName}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3" />
                                {booking.guestCount} khách
                              </p>
                              {booking.customerPhone && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3" />
                                  {booking.customerPhone}
                                </p>
                              )}
                              {booking.customerEmail && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                  <Mail className="w-3 h-3" />
                                  {booking.customerEmail}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                booking.bookingStatus === "c"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : booking.bookingStatus === "p"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-slate-500/10 text-slate-400"
                              }`}
                            >
                              {booking.bookingStatus === "c"
                                ? "Đã xác nhận"
                                : booking.bookingStatus === "p"
                                ? "Chờ xác nhận"
                                : booking.bookingStatus}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              #{booking.code}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    rows={1}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all"
                    style={{ minHeight: "48px", maxHeight: "120px" }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare className="w-20 h-20 mb-4 opacity-30" />
            <p className="text-xl font-medium text-slate-400">Chọn một tour để chat</p>
            <p className="text-sm mt-2">
              Liên lạc với khách hàng trong tour của bạn
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
