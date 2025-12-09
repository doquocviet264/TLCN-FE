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
} from "lucide-react";
import {
  getAllSupportChats,
  getAllBookingChats,
  getAllTourChats,
  getSupportMessages,
  getBookingMessages,
  getTourGroupMessages,
  sendSupportMessage,
  sendBookingMessage,
  sendTourGroupMessage,
  type ChatMessage,
} from "@/lib/chat/chatApi";

// --- TYPES ---
type ChatTab = "support" | "booking" | "tour";

type ChatThread = {
  id: string; // supportId / bookingCode / tourId
  type: ChatTab;
  title: string;
  subtitle: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  // Các field phụ để hiển thị avatar/info
  email?: string;
  name?: string;
};

// --- HELPER TIME ---
const formatTime = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  if (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  ) {
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

export default function AdminChatPage() {
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

  // --- 1. LOAD THREADS (Danh sách chat) ---
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
          subtitle = "Nhóm chat chung";
        }

        return {
          id,
          type: activeTab,
          title,
          subtitle,
          lastMessage: item.lastMessage,
          lastTime: item.lastTime,
          unread: 0, // BE chưa trả về unread count thực tế, tạm để 0
          email: item.email,
          name: item.name,
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

  // --- 2. LOAD MESSAGES (Nội dung chat) ---
  const fetchMessages = async (thread: ChatThread, silent = false) => {
    try {
      if (!silent) setLoadingMessages(true);
      let res: any;

      if (thread.type === "support") res = await getSupportMessages(thread.id);
      else if (thread.type === "booking")
        res = await getBookingMessages(thread.id);
      else if (thread.type === "tour")
        res = await getTourGroupMessages(thread.id);

      if (res?.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Load messages error:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Polling Messages (3s) khi đang chọn thread
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
    setNewMessage(""); // Optimistic clear
    setSending(true);

    try {
      if (selectedThread.type === "support") {
        await sendSupportMessage(selectedThread.id, { content });
      } else if (selectedThread.type === "booking") {
        await sendBookingMessage(selectedThread.id, content);
      } else {
        await sendTourGroupMessage(selectedThread.id, content);
      }
      // Load lại ngay
      fetchMessages(selectedThread, true);
      fetchThreads(true); // Cập nhật last message bên sidebar
    } catch (err) {
      console.error("Send error:", err);
      alert("Gửi tin nhắn thất bại");
      setNewMessage(content); // Revert
    } finally {
      setSending(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* Lưu ý: h-[calc(100vh-64px)] là trừ đi chiều cao Header của trang Admin. 
         Nếu không có header thì để h-screen 
      */}

      {/* === LEFT: THREAD LIST === */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("support")}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "support"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <MessageCircle size={18} />
              <span>Hỗ trợ</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("booking")}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "booking"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Package size={18} />
              <span>Đơn hàng</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("tour")}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "tour"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <MapPin size={18} />
              <span>Tour</span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {loadingThreads && threads.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-500" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <MessageCircle size={32} className="mb-2 opacity-20" />
              <p className="text-sm">Chưa có hội thoại nào</p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThread?.id === thread.id;
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-gray-50 hover:bg-gray-50 ${
                    isSelected ? "bg-blue-50 ring-l-4 ring-blue-500" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                      isSelected
                        ? "bg-blue-200 text-blue-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {thread.type === "tour" ? (
                      <MapPin size={18} />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isSelected ? "text-blue-900" : "text-gray-800"
                        }`}
                      >
                        {thread.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(thread.lastTime)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate font-medium mb-1">
                      {thread.subtitle}
                    </p>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      {/* Hiển thị một phần nội dung tin nhắn cuối */}
                      {thread.lastMessage || (
                        <span className="italic">Chưa có tin nhắn</span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* === RIGHT: CHAT AREA === */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="h-16 flex items-center justify-between border-b border-gray-200 px-6 shadow-sm z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-800">
                    {selectedThread.title}
                  </h2>
                  <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                    {selectedThread.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  {selectedThread.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={10} /> {selectedThread.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    ID: {selectedThread.id}
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex h-full items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-sm">Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <MessageCircle size={48} className="mb-2 opacity-20" />
                  <p>Chưa có nội dung trao đổi.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  // --- LOGIC PHÂN BIỆT ROLE QUAN TRỌNG ---
                  // Admin hoặc Leader thì nằm bên PHẢI (Màu xanh)
                  // Khách (user/guest) thì nằm bên TRÁI (Màu xám)
                  const rawRole = msg.fromRole || "";
                  const role = rawRole.toLowerCase();
                  const isStaff = role === "admin" || role === "leader";

                  const isSystem = msg.isSystem;

                  if (isSystem) {
                    return (
                      <div key={idx} className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-500 text-[10px] px-3 py-1 rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex ${
                        isStaff ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[70%] flex-col ${
                          isStaff ? "items-end" : "items-start"
                        }`}
                      >
                        <span className="mb-1 ml-1 text-[10px] font-semibold text-slate-400">
                          {isStaff ? "Admin (Bạn)" : msg.name || "Khách hàng"}
                          {/* Debug: Hiện role ra để check, sau này xóa đi */}
                          {/* <span className="ml-1 text-[9px] font-normal text-red-300">[{rawRole}]</span> */}
                        </span>

                        {/* Bong bóng chat */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                            isStaff
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>

                        {/* Thời gian */}
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 px-1">
                          {isStaff && (
                            <CheckCircle2 size={10} className="text-blue-500" />
                          )}
                          <span>{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form
                onSubmit={handleSend}
                className="flex items-end gap-3 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
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
                  className="flex-1 max-h-32 min-h-[44px] w-full resize-none border-none bg-transparent px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-0"
                  placeholder="Nhập tin nhắn trả lời..."
                  rows={1}
                />
                <button
                  disabled={!newMessage.trim() || sending}
                  type="submit"
                  className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 active:scale-95"
                >
                  {sending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex h-full flex-col items-center justify-center text-gray-400 bg-gray-50">
            <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600">
              Chào mừng trở lại!
            </h3>
            <p className="max-w-xs text-center text-sm mt-2 text-gray-500">
              Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
              hỗ trợ khách hàng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
