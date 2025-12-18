"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  Loader2,
  ArrowLeft,
  Plus,
  CheckCircle2,
  User,
  Headphones,
  Package,
  MapPin,
  Clock,
  Search,
} from "lucide-react";
import { useAuthStore } from "#/stores/auth";
import {
  startSupportChat,
  getSupportMessages,
  sendSupportMessage,
  getUserSupportChats,
  getBookingMessages,
  sendBookingMessage,
  type ChatMessage,
  type ChatThread,
  type RoomType,
  formatChatTime,
  isStaffRole,
  ROLE_LABELS,
  ROLE_COLORS,
} from "@/lib/chat/chatApi";

type ViewMode = "list" | "chat" | "new";
type ChatTab = "support" | "booking";

export default function UserChatPage() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const [activeTab, setActiveTab] = useState<ChatTab>("support");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // For new support chat
  const [firstMessage, setFirstMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  // Load threads when tab changes
  useEffect(() => {
    loadThreads();
    setSelectedThread(null);
    setMessages([]);
    setViewMode("list");
  }, [activeTab]);

  // Polling threads (10s)
  useEffect(() => {
    const interval = setInterval(() => loadThreads(true), 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Load messages when thread selected
  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);
      setViewMode("chat");
    }
  }, [selectedThread]);

  // Polling messages (5s)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedThread && viewMode === "chat") {
      interval = setInterval(() => loadMessages(selectedThread, true), 5000);
    }
    return () => clearInterval(interval);
  }, [selectedThread, viewMode]);

  const loadThreads = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      if (activeTab === "support") {
        const res = await getUserSupportChats();
        const chats: ChatThread[] = (res.data || []).map((item: any) => ({
          id: item.supportId,
          type: "support" as RoomType,
          title: `Hỗ trợ #${item.supportId?.slice(-6) || ""}`,
          subtitle: item.email || "Chat hỗ trợ",
          lastMessage: item.lastMessage,
          lastTime: item.lastTime,
          status: item.status || "active",
        }));
        setThreads(chats);
      }
      // Booking chats would be loaded from bookings with chat enabled
    } catch (err) {
      console.error("Load threads error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadMessages = async (thread: ChatThread, silent = false) => {
    try {
      if (!silent) setLoadingMessages(true);

      let res: any;
      if (thread.type === "support") {
        res = await getSupportMessages(thread.id);
      } else if (thread.type === "booking") {
        res = await getBookingMessages(thread.id);
      }

      if (res?.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Load messages error:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      if (selectedThread.type === "support") {
        await sendSupportMessage(selectedThread.id, {
          content,
          name: user?.fullName,
          email: user?.email,
        });
      } else if (selectedThread.type === "booking") {
        await sendBookingMessage(selectedThread.id, content);
      }
      loadMessages(selectedThread, true);
    } catch (err) {
      console.error("Send error:", err);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstMessage.trim()) return;

    setSending(true);
    try {
      const res = await startSupportChat({
        content: firstMessage.trim(),
        name: user?.fullName,
        email: user?.email,
      });

      setFirstMessage("");
      loadThreads();
      setSelectedThread({
        id: res.supportId,
        type: "support",
        title: `Hỗ trợ #${res.supportId.slice(-6)}`,
        subtitle: user?.email || "",
        status: "active",
      });
    } catch (err) {
      console.error("Start chat error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    setSelectedThread(null);
    setMessages([]);
    setViewMode("list");
  };

  const filteredThreads = threads.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Headphones className="h-7 w-7 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Tin nhắn & Hỗ trợ</h1>
              <p className="text-blue-200">Xem lịch sử chat và liên hệ hỗ trợ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Panel - Thread List */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab("support")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                    activeTab === "support"
                      ? "border-b-2 border-orange-500 text-orange-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Hỗ trợ
                </button>
                <button
                  onClick={() => setActiveTab("booking")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                    activeTab === "booking"
                      ? "border-b-2 border-orange-500 text-orange-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Package className="h-4 w-4" />
                  Đơn hàng
                </button>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Thread List */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <MessageCircle className="mb-2 h-12 w-12 opacity-30" />
                    <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full flex items-start gap-3 p-4 text-left border-b border-slate-50 transition-colors hover:bg-slate-50 ${
                        selectedThread?.id === thread.id ? "bg-orange-50" : ""
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                          thread.type === "support"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {thread.type === "support" ? (
                          <MessageCircle className="h-5 w-5" />
                        ) : (
                          <Package className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-800 truncate">
                            {thread.title}
                          </p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                            {formatChatTime(thread.lastTime)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {thread.subtitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 truncate">
                          {thread.lastMessage || "Chưa có tin nhắn"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* New Chat Button */}
              {activeTab === "support" && (
                <div className="p-3 border-t border-slate-100">
                  <button
                    onClick={() => setViewMode("new")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo chat mới
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat Content */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden h-[600px] flex flex-col">
              {viewMode === "new" ? (
                /* New Chat Form */
                <div className="flex-1 flex flex-col p-6">
                  <div className="mb-6">
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Quay lại
                    </button>
                  </div>

                  <div className="text-center mb-6">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                      <Plus className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Tạo yêu cầu hỗ trợ mới
                    </h3>
                    <p className="text-sm text-slate-500">
                      Mô tả vấn đề bạn cần được hỗ trợ
                    </p>
                  </div>

                  <form onSubmit={handleStartNewChat} className="flex-1 flex flex-col">
                    <textarea
                      value={firstMessage}
                      onChange={(e) => setFirstMessage(e.target.value)}
                      placeholder="Nhập nội dung cần hỗ trợ..."
                      rows={6}
                      className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={!firstMessage.trim() || sending}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                    >
                      {sending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang gửi...
                        </span>
                      ) : (
                        "Gửi yêu cầu"
                      )}
                    </button>
                  </form>
                </div>
              ) : selectedThread ? (
                /* Chat View */
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBack}
                        className="lg:hidden rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          selectedThread.type === "support"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {selectedThread.type === "support" ? (
                          <MessageCircle className="h-5 w-5" />
                        ) : (
                          <Package className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {selectedThread.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {selectedThread.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                          selectedThread.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {selectedThread.status === "active" ? "Đang hoạt động" : "Đã đóng"}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {loadingMessages && messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-slate-400">
                        <MessageCircle className="mb-2 h-12 w-12 opacity-30" />
                        <p>Chưa có tin nhắn</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const role = (msg.fromRole || "guest").toLowerCase() as any;
                        const isStaff = isStaffRole(role);
                        const colors = ROLE_COLORS[role] || ROLE_COLORS.guest;

                        if (msg.isSystem) {
                          return (
                            <div key={idx} className="flex justify-center">
                              <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] text-slate-500">
                                {msg.content}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg._id || idx}
                            className={`flex ${isStaff ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`flex max-w-[75%] flex-col ${
                                isStaff ? "items-start" : "items-end"
                              }`}
                            >
                              <span className="mb-1 px-1 text-[10px] font-medium text-slate-400">
                                {isStaff ? (
                                  <span className={`px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                    {ROLE_LABELS[role]}
                                  </span>
                                ) : (
                                  "Bạn"
                                )}
                              </span>
                              <div
                                className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                  isStaff
                                    ? `${colors.bubble} rounded-tl-none`
                                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-tr-none"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                              <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400">
                                {!isStaff && (
                                  <CheckCircle2 className="h-3 w-3 text-orange-500" />
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

                  {/* Input */}
                  <div className="border-t border-slate-200 bg-white p-4">
                    <form onSubmit={handleSend} className="flex items-end gap-3">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                          }
                        }}
                        placeholder="Nhập tin nhắn..."
                        rows={1}
                        className="flex-1 max-h-32 min-h-[44px] resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                      >
                        {sending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <MessageCircle className="h-12 w-12 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-600">
                    Chọn một cuộc trò chuyện
                  </h3>
                  <p className="mt-2 max-w-xs text-center text-sm text-slate-500">
                    Chọn từ danh sách bên trái hoặc tạo chat mới để bắt đầu
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
