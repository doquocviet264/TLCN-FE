"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowLeft, Calendar, MapPin, Users, Clock, Plus, Send,
  DollarSign, CheckCircle2, AlertCircle, Plane, Flag,
  FileText, Loader2, X, TrendingUp, EyeOff,
} from "lucide-react";
import {
  leaderToursApi, LeaderTour, TimelineEvent, Expense, Passenger,
} from "@/lib/leader/leaderApi";

const STATUS_CFG: Record<string, any> = {
  pending:     { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  dot: "bg-amber-500",   label: "Chờ xác nhận",  bar: "from-amber-400 to-amber-500" },
  confirmed:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-500",    label: "Đã xác nhận",   bar: "from-blue-400 to-blue-500" },
  in_progress: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",dot: "bg-emerald-500", label: "Đang diễn ra",  bar: "from-emerald-400 to-emerald-500" },
  completed:   { bg: "bg-slate-100",  text: "text-slate-600",   border: "border-slate-200",  dot: "bg-slate-400",   label: "Hoàn thành",    bar: "from-slate-300 to-slate-400" },
  closed:      { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",    dot: "bg-red-500",     label: "Đã đóng",       bar: "from-red-400 to-red-500" },
};

const EVENT_CFG: Record<string, any> = {
  departed:   { icon: Plane,        color: "text-blue-600",    bg: "bg-blue-100",    border: "border-blue-200",    label: "Xuất phát" },
  arrived:    { icon: MapPin,       color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200", label: "Đến nơi" },
  checkpoint: { icon: Flag,         color: "text-orange-600",  bg: "bg-orange-100",  border: "border-orange-200",  label: "Điểm dừng" },
  note:       { icon: FileText,     color: "text-slate-500",   bg: "bg-slate-100",   border: "border-slate-200",   label: "Ghi chú" },
  finished:   { icon: CheckCircle2, color: "text-violet-600",  bg: "bg-violet-100",  border: "border-violet-200",  label: "Kết thúc" },
};

const BOOKING_STATUS_CFG: Record<string, { label: string; className: string }> = {
  pending:   { label: "Chờ thanh toán", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  confirmed: { label: "Đã xác nhận", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  completed: { label: "Hoàn thành", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  cancelled: { label: "Hủy", className: "bg-red-50 text-red-700 border border-red-200" },
};

const EXPENSE_STATUS_CFG: Record<string, { label: string; className: string }> = {
  pending:  { label: "Chờ duyệt", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  approved: { label: "Đã duyệt", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  rejected: { label: "Từ chối", className: "bg-red-50 text-red-700 border border-red-200" },
};

/* Modal */
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* Page skeleton */
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 space-y-5 animate-pulse">
      <div className="h-8 w-24 bg-slate-200 rounded-xl" />
      <div className="h-48 bg-slate-200 rounded-2xl" />
      <div className="flex gap-2">{Array(3).fill(0).map((_,i)=><div key={i} className="flex-1 h-12 bg-slate-200 rounded-xl"/>)}</div>
      <div className="h-64 bg-white rounded-2xl border border-slate-200" />
    </div>
  );
}

export default function TourDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const tourId  = params?.id as string;

  const [tour,       setTour]       = useState<LeaderTour | null>(null);
  const [expenses,   setExpenses]   = useState<Expense[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [activeTab,  setActiveTab]  = useState<"info"|"timeline"|"expenses"|"passengers"|"report">("info");

  const [showTL, setShowTL] = useState(false);
  const [tlForm, setTlForm] = useState({ eventType: "checkpoint" as TimelineEvent["eventType"], place: "", note: "" });
  const [submTL, setSubmTL] = useState(false);

  const [showExp, setShowExp] = useState(false);
  const [expForm, setExpForm] = useState({ title: "", amount: "", note: "", receiptImages: "", visibleToCustomers: true });
  const [submExp, setSubmExp] = useState(false);

  const [reportForm, setReportForm] = useState({ summary: "", incidents: "", expenseNote: "" });
  const [submReport, setSubmReport] = useState(false);

  useEffect(() => {
    if (!tourId) return;
    (async () => {
      try {
        const [t, e, p] = await Promise.all([
          leaderToursApi.getTourDetail(tourId),
          leaderToursApi.getTourExpenses(tourId).catch(() => ({ data: [], total: 0, count: 0 })),
          leaderToursApi.getPassengers(tourId).catch(() => ({ data: [], total: 0 })),
        ]);
        setTour(t); setExpenses(e.data??[]); setPassengers(p.data??[]);
        setReportForm({
          summary: t.leaderReport?.summary ?? "",
          incidents: t.leaderReport?.incidents ?? "",
          expenseNote: t.leaderReport?.expenseNote ?? "",
        });
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    })();
  }, [tourId]);

  const submitTimeline = async (e: React.FormEvent) => {
    e.preventDefault(); if (!tourId) return;
    setSubmTL(true);
    try {
      await leaderToursApi.addTimeline(tourId, { eventType: tlForm.eventType, place: tlForm.place||undefined, note: tlForm.note||undefined });
      setTour(await leaderToursApi.getTourDetail(tourId));
      setTlForm({ eventType: "checkpoint", place: "", note: "" }); setShowTL(false);
      toast.success("Đã thêm sự kiện!");
    } catch (err: any) { toast.error(err.response?.data?.message || "Lỗi"); }
    finally { setSubmTL(false); }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault(); if (!tourId||!expForm.title||!expForm.amount) return;
    setSubmExp(true);
    try {
      const receiptImages = expForm.receiptImages
        .split(/[\n,]/)
        .map(url => url.trim())
        .filter(Boolean)
        .slice(0, 5);
      await leaderToursApi.addExpense(tourId, {
        title: expForm.title,
        amount: Number(expForm.amount),
        note: expForm.note||undefined,
        receiptImages,
        visibleToCustomers: expForm.visibleToCustomers,
      });
      setExpenses((await leaderToursApi.getTourExpenses(tourId)).data??[]);
      setExpForm({ title:"", amount:"", note:"", receiptImages:"", visibleToCustomers:true }); setShowExp(false);
      toast.success("Đã thêm chi phí!");
    } catch (err: any) { toast.error(err.response?.data?.message || "Lỗi"); }
    finally { setSubmExp(false); }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault(); if (!tourId || !reportForm.summary.trim()) return;
    setSubmReport(true);
    try {
      const noShowBookingIds = passengers.filter(p => !p.isPresent).map(p => p._id);
      await leaderToursApi.submitReport(tourId, {
        summary: reportForm.summary,
        incidents: reportForm.incidents || undefined,
        expenseNote: reportForm.expenseNote || undefined,
        noShowBookingIds,
      });
      setTour(await leaderToursApi.getTourDetail(tourId));
      toast.success("Đã nộp báo cáo tour!");
    } catch (err: any) { toast.error(err.response?.data?.message || "Lỗi"); }
    finally { setSubmReport(false); }
  };

  const toggleCheckin = async (bookingId: string, currentStatus: boolean) => {
    if (!tourId) return;
    const nextStatus = !currentStatus;
    // Optimistic UI update
    setPassengers(prev => prev.map(p => p._id === bookingId ? { ...p, isPresent: nextStatus } : p));
    try {
      await leaderToursApi.updateBookingCheckin(tourId, bookingId, nextStatus);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi điểm danh");
      // Revert on error
      setPassengers(prev => prev.map(p => p._id === bookingId ? { ...p, isPresent: currentStatus } : p));
    }
  };

  const fmtDate     = (d: string) => new Date(d).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const fmtDateTime = (d: string) => new Date(d).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const fmtVND      = (n: number) => new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(n);

  if (isLoading) return <PageSkeleton />;
  if (!tour) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="font-bold text-slate-800 mb-1">Không tìm thấy tour</h2>
        <button onClick={() => router.push("/leader/tours")}
          className="mt-4 px-5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600
            hover:bg-blue-100 transition-all text-sm font-medium">
          Quay lại danh sách
        </button>
      </div>
    </div>
  );

  const cfg       = STATUS_CFG[tour.status] || STATUS_CFG.pending;
  const capacity  = tour.quantity ?? 0;
  const pct       = capacity > 0 ? Math.round((tour.bookedCount||0)/capacity*100) : 0;
  const totalExp  = expenses.reduce((s,e) => s+e.amount, 0);
  const noShowCount = passengers.filter(p => !p.isPresent).length;
  const tabs = [
    { key: "info",       label: "Thông tin",   icon: FileText,     count: 1 },
    { key: "timeline",   label: "Timeline",    icon: Clock,        count: tour.timeline?.length??0 },
    { key: "passengers", label: "Hành khách",  icon: Users,        count: passengers.length },
    { key: "expenses",   label: "Chi phí",     icon: DollarSign,   count: expenses.length },
    { key: "report",     label: "Báo cáo",     icon: FileText,     count: tour.leaderReport ? 1 : 0 },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-5xl mx-auto">

        {/* Back */}
        <button onClick={() => router.push("/leader/tours")}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Quay lại</span>
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl
          bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-800 shadow-lg shadow-blue-900/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(249,115,22,0.2),transparent_55%)]" />
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
              <div className="flex-1 min-w-0">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                  border mb-3 bg-white/20 text-white border-white/30`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${tour.status==="in_progress"?"animate-pulse":""}`} />
                  {cfg.label}
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-white mb-3 leading-tight">{tour.title}</h1>
                <div className="flex flex-wrap gap-4 text-blue-100/80 text-sm">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-300" />{tour.destination}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-300" />{fmtDate(tour.startDate)} – {fmtDate(tour.endDate)}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-300" />{tour.bookedCount||0}/{capacity} khách</span>
                </div>
                {/* Progress */}
                <div className="mt-4 max-w-sm">
                  <div className="flex justify-between text-xs text-blue-200/70 mb-1">
                    <span>Sức chứa</span>
                    <span className="font-semibold text-orange-300">{pct}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-300 rounded-full"
                      style={{width:`${pct}%`}} />
                  </div>
                </div>
              </div>
              {/* Actions */}
              {(tour.status==="confirmed"||tour.status==="in_progress") && (
                <div className="flex gap-3 flex-shrink-0">
                  {tour.status==="confirmed" && (
                    <button onClick={() => { setTlForm({...tlForm, eventType:"departed"}); setShowTL(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-800
                        font-semibold hover:bg-blue-50 active:scale-95 shadow-lg transition-all text-sm">
                      <Plane className="w-4 h-4" /> Bắt đầu tour
                    </button>
                  )}
                  {tour.status==="in_progress" && (
                    <button onClick={() => { setTlForm({...tlForm, eventType:"finished"}); setShowTL(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white
                        font-semibold hover:bg-emerald-600 active:scale-95 shadow-lg shadow-emerald-500/30 transition-all text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Kết thúc tour
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          {tabs.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm
                  font-medium transition-all duration-200
                  ${active
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:block">{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${active?"bg-white/25 text-white":"bg-slate-100 text-slate-500"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT — min-h prevents layout shift when switching tabs ── */}
        <div className="min-h-[480px]">

        {/* ── INFO ── */}
        {activeTab==="info" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-orange-500" /> Chi tiết Tour
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="font-semibold text-emerald-800 mb-2">Bao gồm</h4>
                  {tour.tourId?.includes && tour.tourId.includes.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-emerald-700 space-y-1">
                      {tour.tourId.includes.map((inc: string, idx: number) => <li key={idx}>{inc}</li>)}
                    </ul>
                  ) : <p className="text-sm text-emerald-600/70">Không có dữ liệu</p>}
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <h4 className="font-semibold text-red-800 mb-2">Không bao gồm</h4>
                  {tour.tourId?.excludes && tour.tourId.excludes.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {tour.tourId.excludes.map((exc: string, idx: number) => <li key={idx}>{exc}</li>)}
                    </ul>
                  ) : <p className="text-sm text-red-600/70">Không có dữ liệu</p>}
                </div>
              </div>
            </div>

            {tour.tourId?.itinerary && tour.tourId.itinerary.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 mt-6 pt-6 border-t border-slate-100">
                  <Clock className="w-5 h-5 text-blue-500" /> Lịch trình dự kiến (Itinerary)
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {tour.tourId.itinerary.map((day: any, i: number) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 group-hover:bg-blue-500 group-hover:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors">
                        <span className="font-bold text-sm">{i + 1}</span>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-slate-800 mb-1">{day.title || `Ngày ${i + 1}`}</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-line">{day.activities || day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINE ── */}
        {activeTab==="timeline" && (
          <div className="space-y-4">
            {(tour.status==="confirmed"||tour.status==="in_progress") && (
              <button onClick={() => setShowTL(true)}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-300
                  text-slate-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/50
                  transition-all flex items-center justify-center gap-2 text-sm font-medium">
                <Plus className="w-5 h-5" /> Thêm sự kiện mới
              </button>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {!tour.timeline || tour.timeline.length===0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-600">Chưa có sự kiện nào</p>
                  <p className="text-slate-400 text-sm mt-1">Thêm sự kiện để theo dõi hành trình</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-5 bottom-5 w-px bg-slate-200" />
                  <div className="space-y-5">
                    {tour.timeline.map((ev, i) => {
                      const ec = EVENT_CFG[ev.eventType] || EVENT_CFG.note;
                      const IconC = ec.icon;
                      return (
                        <div key={ev._id||i} className="relative flex gap-4">
                          <div className={`relative z-10 w-10 h-10 rounded-xl ${ec.bg} border ${ec.border}
                            flex items-center justify-center flex-shrink-0`}>
                            <IconC className={`w-5 h-5 ${ec.color}`} />
                          </div>
                          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-white transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className={`font-semibold text-sm ${ec.color}`}>{ec.label}</span>
                              <span className="text-xs text-slate-400 flex-shrink-0">{fmtDateTime(ev.at)}</span>
                            </div>
                            {ev.place && (
                              <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-orange-500" />{ev.place}
                              </p>
                            )}
                            {ev.note && <p className="text-sm text-slate-500 mt-1">{ev.note}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PASSENGERS ── */}
        {activeTab==="passengers" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {passengers.length===0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">Chưa có hành khách</p>
                <p className="text-slate-400 text-sm mt-1">Khách hàng chưa đặt tour này</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    <span className="text-slate-900 font-bold text-lg">{passengers.length}</span> đặt chỗ
                  </p>
                  <p className="text-sm text-slate-500">
                    Tổng: <span className="font-semibold text-orange-600">
                      {fmtVND(passengers.reduce((s,p)=>s+(p.totalPrice??0),0))}
                    </span>
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {["Mã","Khách hàng","Liên hệ","NL/TE","Tổng tiền","Trạng thái","Có mặt","Ghi chú"].map(h=>(
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {passengers.map((p,i)=>{
                        const name = p.userId?.fullName??p.fullName??"—";
                        const phone= p.userId?.phoneNumber??p.phoneNumber??"—";
                        const init = name.split(" ").map((n:string)=>n[0]).slice(-2).join("").toUpperCase();
                        return (
                          <tr key={p._id||i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{p.code}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200
                                  flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">
                                  {init}
                                </div>
                                <span className="font-medium text-slate-800">{name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 text-xs">{phone}</td>
                            <td className="px-4 py-3.5 text-center text-slate-700">
                              {p.numAdults}<span className="text-slate-300 mx-1">/</span>{p.numChildren}
                            </td>
                            <td className="px-4 py-3.5 text-right font-semibold text-orange-600">
                              {p.totalPrice?.toLocaleString("vi-VN")} đ
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${BOOKING_STATUS_CFG[p.bookingStatus]?.className || BOOKING_STATUS_CFG.pending.className}`}>
                                {BOOKING_STATUS_CFG[p.bookingStatus]?.label || p.bookingStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer"
                                  checked={!!p.isPresent}
                                  onChange={() => toggleCheckin(p._id, !!p.isPresent)} />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer
                                  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-['']
                                  after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300
                                  after:border after:rounded-full after:h-4 after:w-4 after:transition-all
                                  peer-checked:bg-orange-500 transition-colors"></div>
                              </label>
                            </td>
                            <td className="px-4 py-3.5">
                              {p.note ? (
                                <button title={`Ghi chú: ${p.note}`}
                                  className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors flex items-center gap-1.5 text-xs font-medium">
                                  <FileText className="w-4 h-4" />
                                  <span className="max-w-[100px] truncate">{p.note}</span>
                                </button>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── EXPENSES ── */}
        {activeTab==="expenses" && (
          <div className="space-y-4">
            {(tour.status==="confirmed"||tour.status==="in_progress") && (
              <button onClick={() => setShowExp(true)}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-300
                  text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50
                  transition-all flex items-center justify-center gap-2 text-sm font-medium">
                <Plus className="w-5 h-5" /> Thêm chi phí phát sinh
              </button>
            )}
            {expenses.length>0 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4
                flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Tổng chi phí phát sinh</p>
                    <p className="text-xs text-slate-500">{expenses.length} khoản chi</p>
                  </div>
                </div>
                <p className="text-lg font-extrabold text-orange-600">{fmtVND(totalExp)}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {expenses.length===0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-600">Chưa có chi phí nào</p>
                  <p className="text-slate-400 text-sm mt-1">Ghi lại các chi phí phát sinh trong tour</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {expenses.map((exp,i)=>(
                    <div key={exp._id||i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 bg-orange-100 border border-orange-200 rounded-xl
                        flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-800">{exp.title}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${EXPENSE_STATUS_CFG[exp.status || "pending"]?.className || EXPENSE_STATUS_CFG.pending.className}`}>
                            {EXPENSE_STATUS_CFG[exp.status || "pending"]?.label || "Chờ duyệt"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {exp.note && <p className="text-xs text-slate-500 truncate">{exp.note}</p>}
                          {!exp.visibleToCustomers && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <EyeOff className="w-3 h-3" /> Ẩn khách
                            </span>
                          )}
                        </div>
                        {exp.receiptImages && exp.receiptImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {exp.receiptImages.map((url, idx) => (
                              <a key={url + idx} href={url} target="_blank" rel="noreferrer"
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 underline">
                                Hóa đơn {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">{fmtDateTime(exp.occurredAt)}</p>
                      </div>
                      <p className="font-bold text-orange-600 flex-shrink-0">{fmtVND(exp.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORT */}
        {activeTab==="report" && (
          <form onSubmit={submitReport} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" /> Báo cáo sau tour
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {tour.leaderReport?.submittedAt
                    ? `Đã nộp lúc ${fmtDateTime(tour.leaderReport.submittedAt)}`
                    : "Tổng kết tình hình thực tế để admin đối soát."}
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {noShowCount} booking chưa điểm danh có mặt
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tổng kết chuyến đi <span className="text-red-500">*</span>
              </label>
              <textarea value={reportForm.summary}
                onChange={e => setReportForm({...reportForm, summary:e.target.value})}
                required rows={4}
                placeholder="VD: Tour diễn ra đúng lịch trình, đoàn phản hồi tốt..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sự cố phát sinh</label>
                <textarea value={reportForm.incidents}
                  onChange={e => setReportForm({...reportForm, incidents:e.target.value})}
                  rows={3}
                  placeholder="VD: Khách đến trễ, đổi điểm đón..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ghi chú chi phí</label>
                <textarea value={reportForm.expenseNote}
                  onChange={e => setReportForm({...reportForm, expenseNote:e.target.value})}
                  rows={3}
                  placeholder="VD: Chi phí phát sinh đã có hóa đơn..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none" />
              </div>
            </div>

            {tour.leaderReport?.reviewNote && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                <span className="font-semibold">Ghi chú admin:</span> {tour.leaderReport.reviewNote}
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={submReport || !reportForm.summary.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold shadow-md shadow-orange-500/20 disabled:opacity-50">
                {submReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Nộp báo cáo
              </button>
            </div>
          </form>
        )}

        </div>{/* end min-h tab content wrapper */}

        {/* ── MODAL Timeline ── */}
        <Modal open={showTL} onClose={() => setShowTL(false)} title="Thêm sự kiện Timeline">
          <form onSubmit={submitTimeline} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Loại sự kiện</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(EVENT_CFG).map(([key, ec]) => {
                  const IC = ec.icon; const sel = tlForm.eventType===key;
                  return (
                    <button key={key} type="button"
                      onClick={() => setTlForm({...tlForm, eventType: key as any})}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all
                        ${sel?"border-orange-400 bg-orange-50 text-orange-700":"border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}>
                      <IC className={`w-5 h-5 ${sel?ec.color:"text-slate-400"}`} />
                      {ec.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Địa điểm <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </label>
              <input type="text" value={tlForm.place}
                onChange={e => setTlForm({...tlForm,place:e.target.value})}
                placeholder="VD: Sân bay Nội Bài"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800
                  placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400
                  focus:ring-2 focus:ring-orange-400/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ghi chú <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </label>
              <textarea value={tlForm.note}
                onChange={e => setTlForm({...tlForm,note:e.target.value})}
                placeholder="Thêm ghi chú..." rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800
                  placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400
                  focus:ring-2 focus:ring-orange-400/20 transition-all resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowTL(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600
                  hover:bg-slate-50 text-sm font-medium transition-all">Hủy</button>
              <button type="submit" disabled={submTL}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600
                  text-white text-sm font-semibold hover:from-orange-600 hover:to-orange-700
                  disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all">
                {submTL?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                Lưu sự kiện
              </button>
            </div>
          </form>
        </Modal>

        {/* ── MODAL Expense ── */}
        <Modal open={showExp} onClose={() => setShowExp(false)} title="Thêm chi phí phát sinh">
          <form onSubmit={submitExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên chi phí <span className="text-red-500">*</span>
              </label>
              <input type="text" value={expForm.title}
                onChange={e => setExpForm({...expForm,title:e.target.value})}
                placeholder="VD: Ăn trưa đoàn" required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800
                  placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400
                  focus:ring-2 focus:ring-orange-400/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số tiền (VNĐ) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" value={expForm.amount}
                  onChange={e => setExpForm({...expForm,amount:e.target.value})}
                  placeholder="1.200.000" required min="0"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800
                    placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400
                    focus:ring-2 focus:ring-orange-400/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ghi chú <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </label>
              <textarea value={expForm.note}
                onChange={e => setExpForm({...expForm,note:e.target.value})}
                placeholder="Thêm ghi chú..." rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800
                  placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400
                  focus:ring-2 focus:ring-orange-400/20 transition-all resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Link ảnh hóa đơn <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </label>
              <textarea value={expForm.receiptImages}
                onChange={e => setExpForm({...expForm,receiptImages:e.target.value})}
                placeholder="Mỗi dòng một URL ảnh hóa đơn" rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800
                  placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400
                  focus:ring-2 focus:ring-orange-400/20 transition-all resize-none" />
            </div>
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200
              bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={expForm.visibleToCustomers}
                onChange={e => setExpForm({...expForm,visibleToCustomers:e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">Hiển thị cho khách hàng</p>
                <p className="text-xs text-slate-500">Khách hàng có thể xem khoản chi này</p>
              </div>
            </label>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowExp(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600
                  hover:bg-slate-50 text-sm font-medium transition-all">Hủy</button>
              <button type="submit" disabled={submExp}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600
                  text-white text-sm font-semibold hover:from-orange-600 hover:to-orange-700
                  disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all">
                {submExp?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                Lưu chi phí
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
