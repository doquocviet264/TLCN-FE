"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Package,
  MapPin,
  Send,
  Search,
  User,
  MoreVertical,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  Shield,
  Crown,
  Users,
  Clock,
  XCircle,
} from "lucide-react";
import {
  getAllSupportChats,
  getAllBookingChats,
  getAllTourChats,
  adminGetSupportMessages,
  adminSendSupportMessage,
  getBookingMessages,
  getTourGroupMessages,
  sendBookingMessage,
  sendTourGroupMessage,
  closeSupportChat,
  type ChatMessage,
  type ChatRole,
  formatChatTime,
  isStaffRole,
  ROLE_LABELS,
  ROLE_COLORS,
} from "@/lib/chat/chatApi";
import { Toast, useToast } from "@/components/ui/Toast";

// --- TYPES ---
type ChatTab = "support" | "booking" | "tour";

type ChatThread = {
  id: string;
  type: ChatTab;
  title: string;
  subtitle: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  email?: string;
  name?: string;
  status?: string;
};

export default function AdminChatPage() {
  const { toast, showSuccess, showError, hideToast } = useToast();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<ChatTab>("support");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. LOAD THREADS ---
  const fetchThreads = async (silent = false) => {
    try {
      if (!silent) setLoadingThreads(true);
      let res: any;

      if (activeTab === "support") res = await getAllSupportChats();
      else if (activeTab === "booking") res = await getAllBookingChats();
      else if (activeTab === "tour") res = await getAllTourChats();

      const rawData = res.data || [];

      const mapped: ChatThread[] = rawData.map((item: any) => {
        let title = "Khách hàng";
        let subtitle = "";
        let id = "";

        if (activeTab === "support") {
          id = item.supportId;
          title = item.name || item.email?.split("@")[0] || "Khách vãng lai";
          subtitle = item.email || `#${item.supportId}`;
        } else if (activeTab === "booking") {
          id = item.bookingCode;
          title = `Đơn #${item.bookingCode}`;
          subtitle = item.tourTitle || "Chi tiết đơn hàng";
        } else {
          id = item.tourId;
          title = item.tourTitle || "Nhóm Tour";
          subtitle = `${item.memberCount || 0} thành viên`;
        }

        return {
          id,
          type: activeTab,
          title,
          subtitle,
          lastMessage: item.lastMessage,
          lastTime: item.lastTime,
          unread: item.unread || 0,
          email: item.email,
          name: item.name,
          status: item.status || "active",
        };
      });

      setThreads(mapped);
    } catch (err) {
      console.error("Load threads error:", err);
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  };

  // Init & Polling Threads (10s)
  useEffect(() => {
    setSelectedThread(null);
    setMessages([]);
    setSearchTerm("");
    fetchThreads();

    const interval = setInterval(() => fetchThreads(true), 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Search Filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredThreads(threads);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredThreads(
        threads.filter(
          (t) =>
            t.title.toLowerCase().includes(lower) ||
            t.subtitle.toLowerCase().includes(lower) ||
            t.id.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchTerm, threads]);

  // --- 2. LOAD MESSAGES ---
  const fetchMessages = async (thread: ChatThread, silent = false) => {
    try {
      if (!silent) setLoadingMessages(true);
      let res: any;

      if (thread.type === "support") res = await adminGetSupportMessages(thread.id);
      else if (thread.type === "booking") res = await getBookingMessages(thread.id);
      else if (thread.type === "tour") res = await getTourGroupMessages(thread.id);

      if (res?.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Load messages error:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Polling Messages (3s)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedThread) {
      fetchMessages(selectedThread);
      interval = setInterval(() => fetchMessages(selectedThread, true), 3000);
    }
    return () => clearInterval(interval);
  }, [selectedThread]);

  // Auto Scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  // --- 3. SEND MESSAGE ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      if (selectedThread.type === "support") {
        await adminSendSupportMessage(selectedThread.id, { content });
      } else if (selectedThread.type === "booking") {
        await sendBookingMessage(selectedThread.id, content);
      } else {
        await sendTourGroupMessage(selectedThread.id, content);
      }
      fetchMessages(selectedThread, true);
      fetchThreads(true);
    } catch (err) {
      console.error("Send error:", err);
      showError("Gửi tin nhắn thất bại");
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  // --- 4. CLOSE CHAT ---
  const handleCloseChat = async () => {
    if (!selectedThread || selectedThread.type !== "support") return;

    try {
      await closeSupportChat(selectedThread.id);
      showSuccess("Đã đóng cuộc hội thoại");
      fetchThreads(true);
    } catch (err) {
      console.error("Close chat error:", err);
      showError("Không thể đóng cuộc hội thoại");
    }
  };

  // --- GET ROLE ICON ---
  const getRoleIcon = (role: ChatRole) => {
    switch (role) {
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "leader":
        return <Crown className="h-3 w-3" />;
      case "user":
        return <User className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Toast {...toast} onClose={hideToast} />

      {/* === LEFT: THREAD LIST === */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-orange-500" />
            Chat & Hỗ trợ
          </h1>
          <p className="text-xs text-slate-500 mt-1">Quản lý tin nhắn khách hàng</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("support")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "support"
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>Hỗ trợ</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("booking")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "booking"
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Package className="h-4 w-4" />
              <span>Đơn hàng</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("tour")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "tour"
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Nhóm Tour</span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {loadingThreads && threads.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-orange-500 h-6 w-6" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <MessageCircle className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Chưa có hội thoại nào</p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThread?.id === thread.id;
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-slate-50 hover:bg-slate-50 ${
                    isSelected ? "bg-orange-50 border-l-4 border-l-orange-500" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                      thread.type === "tour"
                        ? "bg-purple-100 text-purple-600"
                        : thread.type === "booking"
                        ? "bg-blue-100 text-blue-600"
                        : isSelected
                        ? "bg-orange-200 text-orange-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {thread.type === "tour" ? (
                      <Users className="h-5 w-5" />
                    ) : thread.type === "booking" ? (
                      <Package className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isSelected ? "text-orange-700" : "text-slate-800"
                        }`}
                      >
                        {thread.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                        {formatChatTime(thread.lastTime)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{thread.subtitle}</p>
                    <p className="text-xs text-slate-400 truncate mt-1 flex items-center gap-1">
                      {thread.lastMessage || (
                        <span className="italic">Chưa có tin nhắn</span>
                      )}
                    </p>
                  </div>
                  {thread.unread && thread.unread > 0 ? (
                    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                      {thread.unread}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{threads.length} cuộc hội thoại</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Cập nhật tự động
            </span>
          </div>
        </div>
      </div>

      {/* === RIGHT: CHAT AREA === */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="h-16 flex items-center justify-between border-b border-slate-200 px-6 bg-white">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    selectedThread.type === "tour"
                      ? "bg-purple-100 text-purple-600"
                      : selectedThread.type === "booking"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  {selectedThread.type === "tour" ? (
                    <Users className="h-5 w-5" />
                  ) : selectedThread.type === "booking" ? (
                    <Package className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {selectedThread.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {selectedThread.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {selectedThread.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      ID: {selectedThread.id.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase ${
                    selectedThread.type === "support"
                      ? "bg-orange-100 text-orange-700"
                      : selectedThread.type === "booking"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {selectedThread.type}
                </span>
                {selectedThread.type === "support" && (
                  <button
                    onClick={handleCloseChat}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="h-3 w-3" />
                    Đóng chat
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex h-full items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="animate-spin h-6 w-6" />
                  <span className="text-sm">Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <MessageCircle className="h-12 w-12 mb-2 opacity-30" />
                  <p>Chưa có nội dung trao đổi.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const role = (msg.fromRole || "guest").toLowerCase() as ChatRole;
                  const isStaff = isStaffRole(role);
                  const colors = ROLE_COLORS[role] || ROLE_COLORS.guest;

                  if (msg.isSystem) {
                    return (
                      <div key={idx} className="flex justify-center my-4">
                        <span className="bg-slate-200 text-slate-500 text-[10px] px-3 py-1 rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex ${isStaff ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex max-w-[70%] flex-col ${
                          isStaff ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Role badge */}
                        <span className="mb-1 px-1 text-[10px] font-semibold flex items-center gap-1">
                          {isStaff ? (
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                            >
                              {getRoleIcon(role)}
                              {ROLE_LABELS[role]}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {msg.name || "Khách hàng"}
                            </span>
                          )}
                        </span>

                        {/* Message bubble */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                            isStaff
                              ? `${colors.bubble} rounded-tr-none`
                              : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>

                        {/* Time */}
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 px-1">
                          {isStaff && (
                            <CheckCircle2 className="h-3 w-3 text-blue-500" />
                          )}
                          <span>{formatChatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form
                onSubmit={handleSend}
                className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all"
              >
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  className="flex-1 max-h-32 min-h-[44px] w-full resize-none border-none bg-transparent px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-0 outline-none"
                  placeholder="Nhập tin nhắn trả lời..."
                  rows={1}
                />
                <button
                  disabled={!newMessage.trim() || sending}
                  type="submit"
                  className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white transition-all hover:from-orange-600 hover:to-orange-700 disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 shadow-lg shadow-orange-500/25 disabled:shadow-none"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Nhấn Enter để gửi, Shift+Enter để xuống dòng
              </p>
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex h-full flex-col items-center justify-center text-slate-400 bg-slate-50">
            <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600">
              Chào mừng trở lại!
            </h3>
            <p className="max-w-xs text-center text-sm mt-2 text-slate-500">
              Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu hỗ trợ
              khách hàng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
