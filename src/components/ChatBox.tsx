"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import useUser from "#/src/hooks/useUser";
import { useChatStore } from "#/stores/chatStore";
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Loader2,
  Headset,
  Trash2,
  History,
  Shield,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  startSupportChat,
  getSupportMessages,
  sendSupportMessage,
  type ChatMessage,
  type ChatRole,
  isStaffRole,
  ROLE_LABELS,
} from "@/lib/chat/chatApi";
import { toast } from "react-hot-toast";

export default function ChatBox() {
  // --- HOOKS ---
  const { user, isAuthenticated } = useUser();
  const { isOpen, openChat, closeChat, tourContext, clearTourContext } =
    useChatStore();

  // --- STATE ---
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [supportId, setSupportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [showStartForm, setShowStartForm] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ Modal confirm end chat
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. SYNC USER INFO ---
  useEffect(() => {
    if (isAuthenticated && user) {
      setGuestName(user.fullName || "");
      setGuestEmail(user.email || "");
    }
  }, [isAuthenticated, user]);

  // --- 2. INIT & POLLING ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSupportId = localStorage.getItem("supportChatId");
      if (savedSupportId) {
        setSupportId(savedSupportId);
        setShowStartForm(false);
        loadMessages(savedSupportId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && supportId && !showStartForm) {
      interval = setInterval(() => loadMessages(supportId, true), 3000);
    }
    return () => clearInterval(interval);
  }, [isOpen, supportId, showStartForm]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    }
  }, [messages, isOpen, isMinimized]);

  // Close end-confirm modal on ESC
  useEffect(() => {
    if (!showEndConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowEndConfirm(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showEndConfirm]);

  // --- LOGIC: LOAD MESSAGES ---
  const loadMessages = async (sid: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await getSupportMessages(sid);
      setMessages((prev) => {
        if (response.data.length > prev.length) {
          if (!isOpen || isMinimized)
            setUnreadCount((c) => c + (response.data.length - prev.length));
        }
        return response.data;
      });
    } catch (err: any) {
      if (err.response?.status === 404) handleEndChat();
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // --- LOGIC: START CHAT ---
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalContent = newMessage.trim();
    if (tourContext) {
      finalContent = `[Quan tâm Tour: ${tourContext.title} - ${
        tourContext.price
      }]\n${newMessage.trim() || "Tôi muốn tư vấn về tour này"}`;
    }
    if (!finalContent) return;

    try {
      setSending(true);
      const payload = {
        content: finalContent,
        name: isAuthenticated ? user?.fullName : guestName,
        email: isAuthenticated ? user?.email : guestEmail,
      };

      const response = await startSupportChat(payload);
      setSupportId(response.supportId);
      localStorage.setItem("supportChatId", response.supportId);
      setMessages([response.firstMessage]);
      setNewMessage("");
      setShowStartForm(false);
      clearTourContext();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi bắt đầu chat");
    } finally {
      setSending(false);
    }
  };

  // --- LOGIC: SEND MESSAGE ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !supportId) return;
    const tempContent = newMessage;
    setNewMessage("");

    try {
      await sendSupportMessage(supportId, {
        content: tempContent.trim(),
        name: isAuthenticated ? user?.fullName : guestName,
        email: isAuthenticated ? user?.email : guestEmail,
        role: isAuthenticated ? "user" : "guest",
      });
      loadMessages(supportId, true);
    } catch (err: any) {
      setNewMessage(tempContent);
      toast.error("Gửi thất bại");
    }
  };

  // --- UTILS ---
  const handleEndChat = useCallback(() => {
    localStorage.removeItem("supportChatId");
    setSupportId(null);
    setMessages([]);
    setShowStartForm(true);
    setUnreadCount(0);
    clearTourContext();
    setShowEndConfirm(false);
  }, [clearTourContext]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- RENDER ---
  return (
    <>
      {/* FLOATING BUTTON */}
      <AnimatePresence>
        {(!isOpen || isMinimized) && (
          <motion.button
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (useChatStore.getState().isOpen) closeChat();
              else openChat();
              setIsMinimized(false);
              setUnreadCount(0);
            }}
            className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/30 ring-2 ring-white/50"
          >
            <MessageCircle size={28} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-5 right-5 z-[9999] flex h-[550px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:bottom-6 sm:right-6"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-white shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                  <Headset size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Hỗ trợ trực tuyến</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    <span className="text-[11px] text-orange-100 font-medium">
                      Thường trả lời ngay
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href="/user/chat"
                  className="rounded-full p-1.5 hover:bg-white/20"
                  title="Xem lịch sử chat"
                >
                  <History size={18} />
                </Link>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="rounded-full p-1.5 hover:bg-white/20"
                >
                  <Minimize2 size={18} />
                </button>
                <button
                  onClick={closeChat}
                  className="rounded-full p-1.5 hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 scrollbar-thin scrollbar-thumb-slate-300">
              {showStartForm ? (
                // FORM START (Giữ nguyên)
                <div className="flex h-full flex-col space-y-4 pt-4">
                  {tourContext ? (
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex gap-3 animate-in slide-in-from-bottom-5">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={tourContext.image}
                          alt={tourContext.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">
                          Đang quan tâm
                        </p>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                          {tourContext.title}
                        </h4>
                        <p className="text-xs text-orange-600 font-bold mt-1">
                          {tourContext.price}
                        </p>
                      </div>
                      <button
                        onClick={clearTourContext}
                        className="text-slate-400 hover:text-red-500 h-fit"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 mt-6">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <MessageCircle size={28} />
                      </div>
                      <h4 className="text-lg font-bold text-slate-800">
                        {isAuthenticated
                          ? `Xin chào, ${user?.fullName.split(" ").pop()}!`
                          : "Xin chào!"}
                      </h4>
                      <p className="text-xs text-slate-500 px-4">
                        Chúng tôi có thể giúp gì cho bạn?
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleStartChat} className="space-y-3 pt-2">
                    {!isAuthenticated && (
                      <div className="space-y-3">
                        <input
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Họ và tên"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          required
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="Email liên hệ"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <textarea
                      required={!tourContext}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        tourContext
                          ? "Nhập câu hỏi (tùy chọn)..."
                          : "Bạn cần hỗ trợ gì?"
                      }
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      disabled={sending}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 disabled:opacity-70"
                    >
                      {sending ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : tourContext ? (
                        "Gửi yêu cầu"
                      ) : (
                        "Bắt đầu Chat"
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                // MESSAGE LIST
                <div className="space-y-5 pb-2">
                  {loading && messages.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                      <Loader2
                        className="animate-spin text-blue-500"
                        size={30}
                      />
                    </div>
                  )}
                  {messages.length === 0 && !loading && (
                    <p className="text-center text-xs text-slate-400 mt-10">
                      Bắt đầu cuộc trò chuyện...
                    </p>
                  )}

                  {messages.map((msg, idx) => {
                    const role = (
                      msg.fromRole || "guest"
                    ).toLowerCase() as ChatRole;
                    const isSupport = isStaffRole(role);
                    const isMe = !isSupport;

                    const getRoleIcon = () => {
                      if (role === "admin") return <Shield size={12} />;
                      if (role === "leader") return <Crown size={12} />;
                      return <Headset size={12} />;
                    };

                    const getRoleBadgeColor = () => {
                      if (role === "admin") return "bg-blue-100 text-blue-700";
                      if (role === "leader")
                        return "bg-purple-100 text-purple-700";
                      return "bg-slate-100 text-slate-600";
                    };

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg._id || idx}
                        className={`flex w-full ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {isSupport && (
                          <div
                            className={`mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border shadow-sm mt-1 ${
                              role === "admin"
                                ? "bg-blue-100 text-blue-600 border-blue-200"
                                : "bg-purple-100 text-purple-600 border-purple-200"
                            }`}
                          >
                            {getRoleIcon()}
                          </div>
                        )}

                        <div
                          className={`flex max-w-[75%] flex-col ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          <span className="mb-1 ml-1 text-[10px] font-medium flex items-center gap-1">
                            {isSupport ? (
                              <span
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${getRoleBadgeColor()}`}
                              >
                                {getRoleIcon()}
                                {ROLE_LABELS[role] || "Hỗ trợ viên"}
                              </span>
                            ) : (
                              <span className="text-slate-400">Bạn</span>
                            )}
                          </span>

                          <div
                            className={`relative rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                              isMe
                                ? "rounded-tr-none bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                                : role === "admin"
                                ? "rounded-tl-none bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                                : role === "leader"
                                ? "rounded-tl-none bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                                : "rounded-tl-none bg-white text-slate-800 border border-slate-100"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>

                          <span
                            className={`mt-1 px-1 text-[9px] ${
                              isMe ? "text-orange-600/60" : "text-slate-400"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* FOOTER */}
            {!showStartForm && (
              <div className="border-t border-slate-100 bg-white p-3 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] z-10">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-2 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all"
                >
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="max-h-24 w-full resize-none bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="mb-1 rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:bg-slate-300 active:scale-95"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>

                <div className="mt-2 flex justify-center">
                  <button
                    onClick={() => setShowEndConfirm(true)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                  >
                    <Trash2 size={12} /> Kết thúc
                  </button>
                </div>
              </div>
            )}

            {/* ✅ END CHAT CONFIRM MODAL */}
            <AnimatePresence>
              {showEndConfirm && (
                <>
                  {/* Overlay */}
                  <motion.button
                    type="button"
                    aria-label="Đóng"
                    onClick={() => setShowEndConfirm(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[50] bg-black/30 backdrop-blur-[2px]"
                  />

                  {/* Dialog */}
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    className="absolute inset-x-0 bottom-0 z-[60] p-4"
                  >
                    <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                            <AlertTriangle size={18} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-800">
                              Kết thúc cuộc trò chuyện?
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Lịch sử chat vẫn có thể xem trong mục{" "}
                              <b>“Lịch sử chat”</b>. Bạn có chắc muốn kết thúc
                              phiên hiện tại không?
                            </p>
                          </div>
                          <button
                            onClick={() => setShowEndConfirm(false)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Đóng"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEndConfirm(false)}
                            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleEndChat}
                            className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/35 active:scale-[0.99]"
                          >
                            Kết thúc
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
