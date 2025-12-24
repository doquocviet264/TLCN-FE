"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Send,
  Loader2,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Headphones,
  Package,
  Search,
  Shield,
  Crown,
  Home,
} from "lucide-react";
import { useAuthStore } from "#/stores/auth";
import {
  startSupportChat,
  getSupportMessages,
  sendSupportMessage,
  getUserSupportChats,
  getBookingMessages,
  sendBookingMessage,
  getTourGroupMessages,
  sendTourGroupMessage,
  getMyTourChats,
  type ChatMessage,
  type ChatRole,
  type TourChatInfo,
  formatChatTime,
  isStaffRole,
  ROLE_LABELS,
} from "@/lib/chat/chatApi";
import { Users, MapPin, Calendar } from "lucide-react";

type ViewMode = "list" | "chat" | "new";
type ChatTab = "support" | "booking" | "tour";

interface ChatThread {
  id: string;
  type: ChatTab;
  title: string;
  subtitle: string;
  lastMessage?: string;
  lastTime?: string;
  status?: string;
  // Tour specific
  tourImage?: string;
  startDate?: string;
  endDate?: string;
  memberCount?: number;
}

export default function UserChatPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<ChatTab>("tour");
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

  // ===== Scroll control refs =====
  const listRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const lastMsgKeyRef = useRef<string | null>(null);
  const didInitialScrollRef = useRef(false);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance < 120; // threshold
  }, []);

  const scrollToBottomInstant = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const scrollToBottomSmooth = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  // Track user scrolling: if user scrolls up -> stop auto-stick
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      shouldStickToBottomRef.current = isNearBottom();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isNearBottom]);

  // Load threads
  const loadThreads = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);

        if (activeTab === "support") {
          let chats: ChatThread[] = [];

          // Thử gọi API trước
          try {
            const res = await getUserSupportChats();
            if (res.data && res.data.length > 0) {
              chats = res.data.map((item: any) => ({
                id: item.supportId || item._id,
                type: "support" as ChatTab,
                title: `Hỗ trợ #${
                  (item.supportId || item._id)?.slice(-6).toUpperCase() || ""
                }`,
                subtitle: item.name || item.email || "Chat hỗ trợ",
                lastMessage: item.lastMessage,
                lastTime: item.updatedAt || item.createdAt,
                status: item.status || "active",
              }));
            }
          } catch (apiErr) {
            console.log("API not available, falling back to localStorage");
          }

          // Fallback: Lấy từ localStorage nếu API không có data
          if (chats.length === 0) {
            const savedSupportId = localStorage.getItem("supportChatId");
            if (savedSupportId) {
              // Thử load messages để xác nhận chat còn tồn tại
              try {
                const msgRes = await getSupportMessages(savedSupportId);
                if (msgRes.data && msgRes.data.length > 0) {
                  const lastMsg = msgRes.data[msgRes.data.length - 1];
                  chats = [
                    {
                      id: savedSupportId,
                      type: "support" as ChatTab,
                      title: `Hỗ trợ #${savedSupportId
                        .slice(-6)
                        .toUpperCase()}`,
                      subtitle: user?.email || "Chat hỗ trợ",
                      lastMessage: lastMsg?.content,
                      lastTime: lastMsg?.createdAt,
                      status: "active",
                    },
                  ];
                }
              } catch (msgErr) {
                // Chat không còn tồn tại, xóa khỏi localStorage
                localStorage.removeItem("supportChatId");
              }
            }
          }

          setThreads(chats);
        } else if (activeTab === "tour") {
          // Load tour group chats từ bookings
          const res = await getMyTourChats();
          const tourChats: ChatThread[] = res.data.map((t: TourChatInfo) => ({
            id: t.tourId,
            type: "tour" as ChatTab,
            title: t.tourTitle,
            subtitle: t.tourDestination || "Tour du lịch",
            tourImage: t.tourImage,
            startDate: t.startDate,
            endDate: t.endDate,
            status: t.bookingStatus === "c" ? "active" : "pending",
          }));
          setThreads(tourChats);
        } else {
          // Load booking chats
          setThreads([]);
        }
      } catch (err) {
        console.error("Load threads error:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [activeTab, user?.email]
  );

  // Load messages
  const loadMessages = useCallback(
    async (thread: ChatThread, silent = false) => {
      try {
        if (!silent) setLoadingMessages(true);

        let res: any;
        if (thread.type === "support") {
          res = await getSupportMessages(thread.id);
        } else if (thread.type === "booking") {
          res = await getBookingMessages(thread.id);
        } else if (thread.type === "tour") {
          res = await getTourGroupMessages(thread.id);
        }

        if (res?.data) {
          // ✅ Only update state if data actually changed (avoid re-render + auto-scroll triggers)
          setMessages((prev) => {
            const next = res.data as ChatMessage[];

            const prevLast = prev[prev.length - 1];
            const nextLast = next[next.length - 1];

            const prevKey = String(
              prevLast?._id || prevLast?.createdAt || prev.length
            );
            const nextKey = String(
              nextLast?._id || nextLast?.createdAt || next.length
            );

            const same = prev.length === next.length && prevKey === nextKey;

            return same ? prev : next;
          });
        }
      } catch (err) {
        console.error("Load messages error:", err);
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    []
  );

  // Load threads when tab changes
  useEffect(() => {
    loadThreads();
    setSelectedThread(null);
    setMessages([]);
    setViewMode("list");

    // reset scroll state
    lastMsgKeyRef.current = null;
    didInitialScrollRef.current = false;
    shouldStickToBottomRef.current = true;
  }, [activeTab, loadThreads]);

  // Polling threads (10s)
  useEffect(() => {
    const interval = setInterval(() => loadThreads(true), 10000);
    return () => clearInterval(interval);
  }, [loadThreads]);

  // Load messages when thread selected
  useEffect(() => {
    if (selectedThread) {
      // reset scroll state for new thread
      lastMsgKeyRef.current = null;
      didInitialScrollRef.current = false;
      shouldStickToBottomRef.current = true;

      loadMessages(selectedThread);
      setViewMode("chat");
    }
  }, [selectedThread, loadMessages]);

  // Polling messages (3s)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedThread && viewMode === "chat") {
      interval = setInterval(() => loadMessages(selectedThread, true), 3000);
    }
    return () => clearInterval(interval);
  }, [selectedThread, viewMode, loadMessages]);

  // ✅ Auto scroll logic:
  // - Initial open thread: scroll once to bottom (smooth)
  // - Next updates: scroll only if new message AND user is near bottom
  useEffect(() => {
    if (messages.length === 0) return;

    const last = messages[messages.length - 1];
    const lastKey = String(last._id || last.createdAt || messages.length);

    // initial open: scroll once
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      lastMsgKeyRef.current = lastKey;

      // delay to wait DOM render
      setTimeout(() => {
        scrollToBottomSmooth();
      }, 0);
      return;
    }

    const isNewMessage = lastMsgKeyRef.current !== lastKey;
    lastMsgKeyRef.current = lastKey;

    if (isNewMessage && shouldStickToBottomRef.current) {
      // polling updates: instant to avoid "smooth jitter every 3s"
      setTimeout(() => {
        scrollToBottomInstant();
      }, 0);
    }
  }, [messages, scrollToBottomInstant, scrollToBottomSmooth]);

  // Send message
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
          role: "user",
        });
      } else if (selectedThread.type === "booking") {
        await sendBookingMessage(selectedThread.id, content);
      } else if (selectedThread.type === "tour") {
        await sendTourGroupMessage(selectedThread.id, content);
      }

      // Force stick to bottom after sending own message
      shouldStickToBottomRef.current = true;

      await loadMessages(selectedThread, true);
    } catch (err) {
      console.error("Send error:", err);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  // Start new chat
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
      await loadThreads();
      setSelectedThread({
        id: res.supportId,
        type: "support",
        title: `Hỗ trợ #${res.supportId.slice(-6).toUpperCase()}`,
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

    // reset scroll state
    lastMsgKeyRef.current = null;
    didInitialScrollRef.current = false;
    shouldStickToBottomRef.current = true;
  };

  const filteredThreads = threads.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get role icon
  const getRoleIcon = (role: ChatRole) => {
    if (role === "admin") return <Shield className="h-3 w-3" />;
    if (role === "leader") return <Crown className="h-3 w-3" />;
    return <Headphones className="h-3 w-3" />;
  };

  // Get role badge style
  const getRoleBadgeStyle = (role: ChatRole) => {
    if (role === "admin") return "bg-blue-100 text-blue-700";
    if (role === "leader") return "bg-purple-100 text-purple-700";
    return "bg-slate-100 text-slate-600";
  };

  // Get message bubble style
  const getMessageBubbleStyle = (role: ChatRole, isStaff: boolean) => {
    if (!isStaff) {
      return "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-tr-sm";
    }
    if (role === "admin") {
      return "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tl-sm";
    }
    if (role === "leader") {
      return "bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-tl-sm";
    }
    return "bg-white text-slate-800 border border-slate-200 rounded-tl-sm";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/user/home")}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Home className="h-5 w-5" />
              </button>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
                <Headphones className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Tin nhắn & Hỗ trợ
                </h1>
                <p className="text-sm text-blue-200">
                  Xem lịch sử chat và liên hệ hỗ trợ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Panel - Thread List */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden sticky top-6">
              {/* Tabs */}
              <div className="flex bg-slate-50">
                <button
                  onClick={() => setActiveTab("tour")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === "tour"
                      ? "border-orange-500 text-orange-600 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Nhóm Tour
                </button>
                <button
                  onClick={() => setActiveTab("support")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === "support"
                      ? "border-orange-500 text-orange-600 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Hỗ trợ
                </button>
                <button
                  onClick={() => setActiveTab("booking")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === "booking"
                      ? "border-orange-500 text-orange-600 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-700"
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
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    className="w-full rounded-xl border-0 bg-slate-100 py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Thread List */}
              <div className="max-h-[450px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <MessageCircle className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">
                      Chưa có cuộc trò chuyện
                    </p>
                    <p className="text-xs text-slate-400 mt-1 text-center">
                      Bấm nút bên dưới để tạo chat mới
                    </p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full flex items-start gap-3 p-4 text-left border-b border-slate-50 transition-all hover:bg-slate-50 ${
                        selectedThread?.id === thread.id
                          ? "bg-orange-50 border-l-4 border-l-orange-500"
                          : ""
                      }`}
                    >
                      {thread.type === "tour" && thread.tourImage ? (
                        <div className="relative h-11 w-11 flex-shrink-0 rounded-xl overflow-hidden">
                          <img
                            src={thread.tourImage}
                            alt={thread.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20" />
                          <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-tl-lg p-0.5">
                            <Users className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
                            thread.type === "tour"
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                              : thread.type === "support"
                              ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                              : "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                          }`}
                        >
                          {thread.type === "tour" ? (
                            <Users className="h-5 w-5" />
                          ) : thread.type === "support" ? (
                            <MessageCircle className="h-5 w-5" />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold text-slate-800 truncate text-sm">
                            {thread.title}
                          </p>
                          {thread.type === "tour" && thread.startDate ? (
                            <span className="text-[10px] text-emerald-600 flex-shrink-0 ml-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(thread.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                              {formatChatTime(thread.lastTime)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          {thread.type === "tour" && <MapPin className="h-3 w-3" />}
                          {thread.subtitle}
                        </p>
                        {thread.lastMessage && (
                          <p className="mt-1.5 text-xs text-slate-400 truncate">
                            {thread.lastMessage}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* New Chat Button */}
              {activeTab === "support" && (
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => setViewMode("new")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="h-5 w-5" />
                    Tạo yêu cầu hỗ trợ mới
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat Content */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden h-[650px] flex flex-col">
              {viewMode === "new" ? (
                /* New Chat Form */
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                    <button
                      onClick={handleBack}
                      className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h3 className="font-semibold text-slate-800">
                      Tạo yêu cầu hỗ trợ mới
                    </h3>
                  </div>

                  {/* Form */}
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="text-center mb-8">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-200">
                        <Headphones className="h-10 w-10 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">
                        Chúng tôi có thể giúp gì cho bạn?
                      </h3>
                      <p className="text-sm text-slate-500 mt-2">
                        Mô tả vấn đề hoặc câu hỏi của bạn, đội ngũ hỗ trợ sẽ
                        phản hồi sớm nhất
                      </p>
                    </div>

                    <form
                      onSubmit={handleStartNewChat}
                      className="flex-1 flex flex-col"
                    >
                      <textarea
                        value={firstMessage}
                        onChange={(e) => setFirstMessage(e.target.value)}
                        placeholder="Ví dụ: Tôi muốn hỏi về tour du lịch Đà Nẵng..."
                        className="flex-1 min-h-[150px] resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                        required
                      />
                      <button
                        type="submit"
                        disabled={!firstMessage.trim() || sending}
                        className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Đang gửi...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Send className="h-5 w-5" />
                            Gửi yêu cầu hỗ trợ
                          </span>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              ) : selectedThread ? (
                /* Chat View */
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBack}
                        className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      {selectedThread.type === "tour" && selectedThread.tourImage ? (
                        <div className="relative h-11 w-11 rounded-xl overflow-hidden">
                          <img
                            src={selectedThread.tourImage}
                            alt={selectedThread.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full ${
                            selectedThread.type === "tour"
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                              : selectedThread.type === "support"
                              ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                              : "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                          }`}
                        >
                          {selectedThread.type === "tour" ? (
                            <Users className="h-5 w-5" />
                          ) : selectedThread.type === "support" ? (
                            <MessageCircle className="h-5 w-5" />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {selectedThread.type === "tour" ? "Nhóm: " : ""}{selectedThread.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          {selectedThread.type === "tour" && <MapPin className="h-3 w-3" />}
                          {selectedThread.subtitle}
                          {selectedThread.type === "tour" && selectedThread.startDate && (
                            <span className="ml-2 text-emerald-600">
                              • {new Date(selectedThread.startDate).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {selectedThread.type === "tour" ? (
                      <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-medium flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Nhóm chat
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          selectedThread.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {selectedThread.status === "active"
                          ? "Đang hoạt động"
                          : "Đã đóng"}
                      </span>
                    )}
                  </div>

                  {/* Messages */}
                  <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-slate-100"
                  >
                    {loadingMessages && messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center">
                        <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                          <MessageCircle className="h-10 w-10 text-slate-300" />
                        </div>
                        <p className="text-slate-500">Chưa có tin nhắn</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const role = (
                          msg.fromRole || "guest"
                        ).toLowerCase() as ChatRole;
                        const isStaff = isStaffRole(role);
                        const isTourChat = selectedThread?.type === "tour";

                        // Trong tour chat: xác định tin nhắn của mình dựa trên fromId
                        const isMyMessage = isTourChat
                          ? msg.fromId === user?.id || msg.fromId === user?._id
                          : !isStaff;

                        // System message
                        if (msg.isSystem) {
                          return (
                            <div key={idx} className="flex justify-center">
                              <span className="rounded-full bg-white shadow-sm px-4 py-1.5 text-xs text-slate-500">
                                {msg.content}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg._id || idx}
                            className={`flex ${
                              isMyMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex max-w-[80%] gap-2 ${
                                isMyMessage ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              {/* Avatar - hiện cho tin nhắn không phải của mình */}
                              {!isMyMessage && (
                                <div
                                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                                    role === "admin"
                                      ? "bg-blue-500"
                                      : role === "leader"
                                      ? "bg-purple-500"
                                      : isTourChat
                                      ? "bg-emerald-500"
                                      : "bg-slate-400"
                                  } text-white text-xs font-bold`}
                                >
                                  {isTourChat && role === "user" ? (
                                    msg.name?.charAt(0).toUpperCase() || "U"
                                  ) : (
                                    getRoleIcon(role)
                                  )}
                                </div>
                              )}

                              <div
                                className={`flex flex-col ${
                                  isMyMessage ? "items-end" : "items-start"
                                }`}
                              >
                                {/* Role/Name label */}
                                <span className="mb-1 px-1 text-[10px] font-medium text-slate-400">
                                  {isMyMessage ? (
                                    "Bạn"
                                  ) : isTourChat && role === "user" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                      {msg.name || "Thành viên"}
                                    </span>
                                  ) : (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${getRoleBadgeStyle(
                                        role
                                      )}`}
                                    >
                                      {getRoleIcon(role)}
                                      {ROLE_LABELS[role] || "Hỗ trợ viên"}
                                    </span>
                                  )}
                                </span>

                                {/* Message bubble */}
                                <div
                                  className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                    isMyMessage
                                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-tr-sm"
                                      : isTourChat && role === "user"
                                      ? "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"
                                      : getMessageBubbleStyle(role, true)
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap leading-relaxed">
                                    {msg.content}
                                  </p>
                                </div>

                                {/* Time */}
                                <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400">
                                  {isMyMessage && (
                                    <CheckCircle2 className="h-3 w-3 text-orange-500" />
                                  )}
                                  <span>{formatChatTime(msg.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t border-slate-100 bg-white p-4">
                    <form
                      onSubmit={handleSend}
                      className="flex items-end gap-3"
                    >
                      <div className="flex-1 relative">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend(e);
                            }
                          }}
                          placeholder="Nhập tin nhắn... (Enter để gửi)"
                          rows={1}
                          className="w-full max-h-32 min-h-[48px] resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                <div className="flex h-full flex-col items-center justify-center p-8">
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6">
                    <MessageCircle className="h-14 w-14 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700">
                    Chọn một cuộc trò chuyện
                  </h3>
                  <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
                    Chọn cuộc trò chuyện từ danh sách bên trái hoặc tạo yêu cầu
                    hỗ trợ mới để bắt đầu
                  </p>
                  <button
                    onClick={() => setViewMode("new")}
                    className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40"
                  >
                    <Plus className="h-5 w-5" />
                    Tạo yêu cầu hỗ trợ mới
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
