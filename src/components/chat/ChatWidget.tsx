"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Minus,
  Send,
  Loader2,
  ArrowLeft,
  History,
  Plus,
  CheckCircle2,
  User,
  Headphones,
} from "lucide-react";
import { useChatStore } from "#/stores/chat";
import { useAuthStore } from "#/stores/auth";
import {
  startSupportChat,
  getSupportMessages,
  sendSupportMessage,
  getUserSupportChats,
  type ChatThread,
  type ChatRole,
  formatChatTime,
  isStaffRole,
  ROLE_LABELS,
} from "@/lib/chat/chatApi";

type ViewMode = "home" | "history" | "chat" | "new";

export default function ChatWidget() {
  const {
    isWidgetOpen,
    isMinimized,
    openWidget,
    closeWidget,
    minimizeWidget,
    activeSupportId,
    setActiveChat,
    clearActiveChat,
    messages,
    setMessages,
    supportChats,
    setSupportChats,
  } = useChatStore();

  const user = useAuthStore((s) => s.user);

  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  // For new chat (guest)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
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

  // Load chat history when opening
  useEffect(() => {
    if (isWidgetOpen && !isMinimized) {
      loadChatHistory();
    }
  }, [isWidgetOpen, isMinimized]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeSupportId) {
      loadMessages(activeSupportId);
      setViewMode("chat");
    }
  }, [activeSupportId]);

  // Polling messages (5s)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSupportId && viewMode === "chat") {
      interval = setInterval(() => loadMessages(activeSupportId, true), 5000);
    }
    return () => clearInterval(interval);
  }, [activeSupportId, viewMode]);

  const loadChatHistory = async () => {
    try {
      const res = await getUserSupportChats();
      const chats: ChatThread[] = (res.data || []).map((item: any) => ({
        id: item.supportId,
        type: "support" as const,
        title: item.name || "Hỗ trợ",
        subtitle: `#${item.supportId}`,
        lastMessage: item.lastMessage,
        lastTime: item.lastTime,
        status: item.status || "active",
      }));
      setSupportChats(chats);
    } catch (err) {
      console.error("Load chat history error:", err);
    }
  };

  const loadMessages = async (supportId: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getSupportMessages(supportId);
      if (res?.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Load messages error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSupportId) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      await sendSupportMessage(activeSupportId, {
        content,
        name: user?.fullName,
        email: user?.email,
        role: user ? "user" : "guest",
      });
      loadMessages(activeSupportId, true);
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
        name: user ? user.fullName : guestName || undefined,
        email: user ? user.email : guestEmail || undefined,
      });

      setActiveChat("support", res.supportId);
      setFirstMessage("");
      setGuestName("");
      setGuestEmail("");
      loadChatHistory();
    } catch (err) {
      console.error("Start chat error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSelectChat = (chat: ChatThread) => {
    setActiveChat("support", chat.id);
  };

  const handleBack = () => {
    if (viewMode === "chat") {
      clearActiveChat();
      setViewMode(supportChats.length > 0 ? "history" : "home");
    } else {
      setViewMode("home");
    }
  };

  // Floating button when closed
  if (!isWidgetOpen) {
    return (
      <button
        onClick={openWidget}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-110 hover:shadow-xl"
      >
        <MessageCircle className="h-6 w-6" />
        {supportChats.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {supportChats.length}
          </span>
        )}
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <button
        onClick={() => useChatStore.getState().toggleWidget()}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Chat hỗ trợ</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
        <div className="flex items-center gap-3">
          {viewMode !== "home" && (
            <button
              onClick={handleBack}
              className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {viewMode === "chat"
                  ? `#${activeSupportId}`
                  : viewMode === "history"
                  ? "Lịch sử chat"
                  : viewMode === "new"
                  ? "Chat mới"
                  : "Hỗ trợ khách hàng"}
              </h3>
              <p className="text-xs text-white/70">
                {viewMode === "chat" ? "Đang hoạt động" : "Anh Travel"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={minimizeWidget}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={closeWidget}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Home View */}
        {viewMode === "home" && (
          <div className="flex h-full flex-col p-4">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <MessageCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800">
                Xin chào{user?.fullName ? `, ${user.fullName}` : ""}!
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Chúng tôi sẵn sàng hỗ trợ bạn
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setViewMode("new")}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Plus className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Tạo chat mới</p>
                  <p className="text-xs text-slate-500">Gửi câu hỏi cho chúng tôi</p>
                </div>
              </button>

              {supportChats.length > 0 && (
                <button
                  onClick={() => setViewMode("history")}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <History className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Lịch sử chat</p>
                    <p className="text-xs text-slate-500">
                      {supportChats.length} cuộc hội thoại
                    </p>
                  </div>
                </button>
              )}
            </div>

            <div className="mt-auto pt-4 text-center text-xs text-slate-400">
              Thời gian phản hồi: ~5 phút
            </div>
          </div>
        )}

        {/* History View */}
        {viewMode === "history" && (
          <div className="h-full overflow-y-auto">
            {supportChats.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <History className="mb-2 h-12 w-12 opacity-30" />
                <p>Chưa có lịch sử chat</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {supportChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800 truncate">
                          {chat.title}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {formatChatTime(chat.lastTime)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{chat.subtitle}</p>
                      <p className="mt-1 text-xs text-slate-400 truncate">
                        {chat.lastMessage || "Chưa có tin nhắn"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="sticky bottom-0 border-t border-slate-100 bg-white p-3">
              <button
                onClick={() => setViewMode("new")}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700"
              >
                + Tạo chat mới
              </button>
            </div>
          </div>
        )}

        {/* New Chat View */}
        {viewMode === "new" && (
          <form onSubmit={handleStartNewChat} className="flex h-full flex-col p-4">
            {!user && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Tên của bạn
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nhập tên..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Email (để nhận phản hồi)
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Nội dung cần hỗ trợ
              </label>
              <textarea
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                placeholder="Nhập câu hỏi hoặc vấn đề bạn cần hỗ trợ..."
                rows={5}
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>

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
                "Bắt đầu chat"
              )}
            </button>
          </form>
        )}

        {/* Chat View */}
        {viewMode === "chat" && (
          <div className="flex h-full flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {loading && messages.length === 0 ? (
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
                  // Logic: fromRole là user/guest → tin nhắn của tôi (bên phải)
                  //        fromRole là admin/leader → tin nhắn của staff (bên trái)
                  const role = (msg.fromRole || "guest").toLowerCase() as ChatRole;
                  const isStaff = isStaffRole(role);

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
                        className={`flex max-w-[80%] flex-col ${
                          isStaff ? "items-start" : "items-end"
                        }`}
                      >
                        <span className="mb-1 px-1 text-[10px] font-medium text-slate-400">
                          {isStaff ? ROLE_LABELS[role] : "Bạn"}
                        </span>
                        <div
                          className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isStaff
                              ? "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                              : "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-tr-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400">
                          {!isStaff && <CheckCircle2 className="h-3 w-3 text-orange-500" />}
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
            <div className="border-t border-slate-200 bg-white p-3">
              <form onSubmit={handleSend} className="flex items-end gap-2">
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
                  className="flex-1 max-h-24 min-h-[40px] resize-none rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
