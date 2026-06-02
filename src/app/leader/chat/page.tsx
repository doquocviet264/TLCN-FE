"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, Send, Loader2, Users, MapPin, Calendar,
  ChevronLeft, RefreshCw, Phone, Mail, User, Search, X, CheckCheck,
} from "lucide-react";
import {
  leaderToursApi, leaderChatApi, leaderBookingApi,
  LeaderTour, ChatMessage, TourBooking, leaderAuthApi,
} from "@/lib/leader/leaderApi";

const ROLE_CFG: Record<string, any> = {
  admin:  { badge: "bg-blue-100 text-blue-700 border-blue-200",   bubble: "bg-blue-600 text-white",                       label: "Admin" },
  leader: { badge: "bg-orange-100 text-orange-700 border-orange-200", bubble: "bg-gradient-to-br from-orange-500 to-orange-600 text-white", label: "Leader" },
  user:   { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bubble: "bg-white border border-slate-200 text-slate-800 shadow-sm", label: "Khách hàng" },
  guest:  { badge: "bg-slate-100 text-slate-600 border-slate-200",   bubble: "bg-white border border-slate-200 text-slate-800 shadow-sm", label: "Khách" },
};

const BOOKING_STATUS_CFG: Record<string, { label: string; className: string }> = {
  pending:   { label: "Chờ thanh toán", className: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Xác nhận", className: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Hoàn thành", className: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Hủy", className: "bg-red-100 text-red-700" },
  p:         { label: "Chờ", className: "bg-amber-100 text-amber-700" },
  c:         { label: "Xác nhận", className: "bg-emerald-100 text-emerald-700" },
  x:         { label: "Hủy", className: "bg-red-100 text-red-700" },
};

function fmtTime(d?: string) {
  if (!d) return "";
  const dt = new Date(d), now = new Date();
  const isToday = dt.toDateString() === now.toDateString();
  return isToday
    ? dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function LeaderChatPage() {
  const [tours,       setTours]      = useState<LeaderTour[]>([]);
  const [filteredT,   setFilteredT]  = useState<LeaderTour[]>([]);
  const [tourSearch,  setTSearch]    = useState("");
  const [selected,    setSelected]   = useState<LeaderTour | null>(null);
  const [messages,    setMessages]   = useState<ChatMessage[]>([]);
  const [bookings,    setBookings]   = useState<TourBooking[]>([]);
  const [newMsg,      setNewMsg]     = useState("");
  const [isLoading,   setLoading]    = useState(true);
  const [loadingMsgs, setLoadMsgs]   = useState(false);
  const [loadingBks,  setLoadBks]    = useState(false);
  const [sending,     setSending]    = useState(false);
  const [leader,      setLeader]     = useState<any>(null);
  const [showPart,    setShowPart]   = useState(false);

  const endRef  = useRef<HTMLDivElement>(null);
  const taRef   = useRef<HTMLTextAreaElement>(null);

  const nameMap = useCallback(() => {
    const m: Record<string, string> = {};
    bookings.forEach(b => { if (b.userId) m[b.userId] = b.customerName; });
    return m;
  }, [bookings]);

  useEffect(() => {
    (async () => {
      try {
        const sl = leaderAuthApi.getStoredLeader(); setLeader(sl);
        const td = await leaderToursApi.getMyTours();
        const ac = td.filter(t => t.status !== "completed" && t.status !== "closed");
        setTours(ac); setFilteredT(ac);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!tourSearch.trim()) { setFilteredT(tours); return; }
    const lo = tourSearch.toLowerCase();
    setFilteredT(tours.filter(t => t.title.toLowerCase().includes(lo)||t.destination.toLowerCase().includes(lo)));
  }, [tourSearch, tours]);

  const loadMsgs = useCallback(async (id: string) => {
    setLoadMsgs(true);
    try { const r = await leaderChatApi.getTourMessages(id); setMessages(r.data||[]); }
    catch (e) { console.error(e); }
    finally { setLoadMsgs(false); }
  }, []);

  const loadBks = useCallback(async (id: string) => {
    setLoadBks(true);
    try { const r = await leaderBookingApi.getTourBookings(id); setBookings(r.data||[]); }
    catch (e) { console.error(e); }
    finally { setLoadBks(false); }
  }, []);

  useEffect(() => {
    if (selected) { loadMsgs(selected._id); loadBks(selected._id); }
  }, [selected, loadMsgs, loadBks]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!selected) return;
    const iv = setInterval(() => loadMsgs(selected._id), 10000);
    return () => clearInterval(iv);
  }, [selected, loadMsgs]);

  const sendMsg = async () => {
    if (!newMsg.trim() || !selected || sending) return;
    setSending(true);
    try {
      const r = await leaderChatApi.sendTourMessage(selected._id, newMsg.trim());
      setMessages(p => [...p, r.data]); setNewMsg("");
      if (taRef.current) taRef.current.style.height = "auto";
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  const handleTA = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMsg(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const getName = (m: ChatMessage) => {
    if (m.name) return m.name;
    const nm = nameMap(); if (m.fromId && nm[m.fromId]) return nm[m.fromId];
    return ROLE_CFG[m.fromRole]?.label || "Khách hàng";
  };

  const initials = (name: string) => name?.split(" ").map(n=>n[0]).slice(-2).join("").toUpperCase() || "?";
  const totalGuests = bookings.reduce((s, b) => s + (b.guestCount||1), 0);

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm">Đang tải...</p>
      </div>
    </div>
  );

  const STATUS_LABEL: Record<string, string> = {
    in_progress: "Đang diễn ra", confirmed: "Đã xác nhận", pending: "Chờ xác nhận",
  };
  const STATUS_COLOR: Record<string, string> = {
    in_progress: "bg-emerald-100 text-emerald-700",
    confirmed: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="h-[calc(100vh-56px)] lg:h-screen flex bg-slate-100 overflow-hidden">

      {/* ── Tour list panel ── */}
      <div className={`${selected?"hidden md:flex":"flex"}
        w-full md:w-80 lg:w-96 flex-col bg-white border-r border-slate-200 shadow-sm`}>

        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-blue-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-orange-300" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Chat nhóm</h1>
              <p className="text-xs text-blue-200/70">{tours.length} tour đang hoạt động</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" />
            <input type="text" placeholder="Tìm tour..."
              value={tourSearch} onChange={e => setTSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 border border-white/20
                text-white placeholder-blue-300/50 text-sm focus:outline-none focus:bg-white/15 transition-all" />
            {tourSearch && (
              <button onClick={() => setTSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tour list */}
        <div className="flex-1 overflow-y-auto">
          {filteredT.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">{tourSearch ? "Không tìm thấy tour" : "Chưa có tour hoạt động"}</p>
              {tourSearch && <button onClick={() => setTSearch("")} className="mt-1.5 text-xs text-orange-500 hover:underline">Xóa tìm kiếm</button>}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredT.map(tour => {
                const isSel = selected?._id === tour._id;
                return (
                  <button key={tour._id} onClick={() => setSelected(tour)}
                    className={`w-full p-4 text-left transition-all group relative
                      border-l-[3px]
                      ${isSel
                        ? "bg-orange-50 border-l-orange-500"
                        : "border-l-transparent hover:bg-slate-50"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base
                        ${isSel
                          ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
                        ✈
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate text-sm
                          ${isSel ? "text-orange-700" : "text-slate-700 group-hover:text-slate-900"}`}>
                          {tour.title}
                        </h3>
                        <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />{tour.destination}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {fmtDate(tour.startDate)} – {fmtDate(tour.endDate)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                            ${STATUS_COLOR[tour.status]||"bg-slate-100 text-slate-600"}`}>
                            {STATUS_LABEL[tour.status]||tour.status}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <Users className="w-2.5 h-2.5" />{tour.bookedCount||0}/{tour.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className={`${selected?"flex":"hidden md:flex"} flex-1 flex-col min-w-0 bg-slate-50`}>
        {selected ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
              <button onClick={() => setSelected(null)}
                className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200
                flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-800 truncate text-sm">{selected.title}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.destination}</span>
                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                    <Users className="w-3 h-3" />{bookings.length} đơn · {totalGuests} khách
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => setShowPart(!showPart)}
                  className={`p-2.5 rounded-xl transition-all
                    ${showPart?"bg-orange-100 text-orange-600":"hover:bg-slate-100 text-slate-500"}`}>
                  <Users className="w-5 h-5" />
                </button>
                <button onClick={() => loadMsgs(selected._id)}
                  className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-all">
                  <RefreshCw className={`w-5 h-5 ${loadingMsgs?"animate-spin":""}`} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Messages */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {loadingMsgs && messages.length===0 ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
                    </div>
                  ) : messages.length===0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-3">
                        <MessageSquare className="w-8 h-8 opacity-40" />
                      </div>
                      <p className="font-semibold text-slate-500">Chưa có tin nhắn</p>
                      <p className="text-sm mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const isMe = msg.fromRole==="leader" && msg.fromId===leader?.id;
                        const rc   = ROLE_CFG[msg.fromRole] || ROLE_CFG.user;
                        const name = getName(msg);
                        const isFirst = idx===0 || messages[idx-1].fromId!==msg.fromId;
                        const isLast  = idx===messages.length-1 || messages[idx+1].fromId!==msg.fromId;
                        return (
                          <div key={msg._id}
                            className={`flex ${isMe?"justify-end":"justify-start"} ${isFirst?"mt-3":"mt-0.5"}`}>
                            {!isMe && (
                              <div className={`w-7 h-7 rounded-full flex-shrink-0 mr-2 self-end
                                bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500
                                ${isLast?"visible":"invisible"}`}>
                                {initials(name)}
                              </div>
                            )}
                            <div className={`max-w-[70%] flex flex-col ${isMe?"items-end":"items-start"}`}>
                              {!isMe && isFirst && (
                                <div className="flex items-center gap-1.5 mb-1 px-1">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rc.badge}`}>
                                    {ROLE_CFG[msg.fromRole]?.label||msg.fromRole}
                                  </span>
                                  <span className="text-xs text-slate-500">{name}</span>
                                </div>
                              )}
                              <div className={`px-3.5 py-2 text-sm leading-relaxed break-words
                                rounded-2xl ${isMe
                                  ? `${rc.bubble} rounded-br-md shadow-md`
                                  : `${rc.bubble} rounded-bl-md`}`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                              {isLast && (
                                <div className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400
                                  ${isMe?"justify-end":"justify-start"}`}>
                                  <span>{fmtTime(msg.createdAt)}</span>
                                  {isMe && <CheckCheck className="w-3 h-3 text-blue-400" />}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={endRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <textarea ref={taRef} value={newMsg} onChange={handleTA} onKeyDown={handleKey}
                        placeholder="Nhập tin nhắn... (Enter gửi, Shift+Enter xuống dòng)"
                        rows={1}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800
                          placeholder-slate-400 text-sm
                          focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20
                          resize-none transition-all"
                        style={{ minHeight: "44px", maxHeight: "120px" }} />
                    </div>
                    <button onClick={sendMsg} disabled={!newMsg.trim()||sending}
                      className="flex-shrink-0 w-11 h-11 rounded-2xl
                        bg-gradient-to-br from-orange-500 to-orange-600 text-white
                        flex items-center justify-center shadow-md shadow-orange-500/20
                        hover:shadow-orange-500/30 hover:scale-105 active:scale-95
                        disabled:opacity-50 disabled:scale-100
                        transition-all duration-200">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    Enter gửi · Shift+Enter xuống dòng · Tự làm mới mỗi 10 giây
                  </p>
                </div>
              </div>

              {/* Participants panel */}
              {showPart && (
                <div className="w-72 border-l border-slate-200 bg-white flex flex-col flex-shrink-0 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      Danh sách khách
                      <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                        {totalGuests}
                      </span>
                    </h3>
                    <button onClick={() => setShowPart(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loadingBks ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-orange-500" /></div>
                    ) : bookings.length===0 ? (
                      <div className="text-center p-8 text-slate-400">
                        <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Chưa có khách đặt tour</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {bookings.map(bk => {
                          const init = bk.customerName?.split(" ").map((n:string)=>n[0]).slice(-2).join("").toUpperCase()||"?";
                          return (
                            <div key={bk._id} className="p-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200
                                  flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {bk.customerAvatar
                                    ? <img src={bk.customerAvatar} alt="" className="w-full h-full object-cover" />
                                    : <span className="font-bold text-orange-700 text-sm">{init}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-800 text-sm truncate">{bk.customerName}</p>
                                  <div className="mt-1 space-y-0.5">
                                    {bk.customerPhone && (
                                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Phone className="w-3 h-3" />{bk.customerPhone}
                                      </p>
                                    )}
                                    {bk.customerEmail && (
                                      <p className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                                        <Mail className="w-3 h-3 flex-shrink-0" />{bk.customerEmail}
                                      </p>
                                    )}
                                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                      <Users className="w-3 h-3" />{bk.guestCount||1} khách
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BOOKING_STATUS_CFG[bk.bookingStatus]?.className || "bg-slate-100 text-slate-600"}`}>
                                      {BOOKING_STATUS_CFG[bk.bookingStatus]?.label || bk.bookingStatus}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">#{bk.code}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mb-5">
              <MessageSquare className="w-10 h-10 opacity-40" />
            </div>
            <h2 className="text-lg font-semibold text-slate-600 mb-2">Chọn một tour để chat</h2>
            <p className="text-sm text-center max-w-xs text-slate-400">
              Liên lạc trực tiếp với khách hàng và thành viên trong nhóm tour
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
