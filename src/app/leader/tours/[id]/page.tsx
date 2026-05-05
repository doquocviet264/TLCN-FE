"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Send,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plane,
  Flag,
  FileText,
  Loader2,
} from "lucide-react";
import {
  leaderToursApi,
  LeaderTour,
  TimelineEvent,
  Expense,
  Passenger,
} from "@/lib/leader/leaderApi";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Chờ xác nhận" },
  confirmed: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Đã xác nhận" },
  in_progress: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Đang diễn ra" },
  completed: { bg: "bg-slate-500/10", text: "text-slate-400", label: "Hoàn thành" },
  closed: { bg: "bg-red-500/10", text: "text-red-400", label: "Đã đóng" },
};

const eventTypeIcons: Record<string, any> = {
  departed: Plane,
  arrived: MapPin,
  checkpoint: Flag,
  note: FileText,
  finished: CheckCircle2,
};

const eventTypeLabels: Record<string, string> = {
  departed: "Xuất phát",
  arrived: "Đến nơi",
  checkpoint: "Điểm dừng",
  note: "Ghi chú",
  finished: "Kết thúc",
};

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params?.id as string;

  const [tour, setTour] = useState<LeaderTour | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "expenses" | "passengers">("timeline");

  // Timeline Form
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [timelineForm, setTimelineForm] = useState({
    eventType: "checkpoint" as TimelineEvent["eventType"],
    place: "",
    note: "",
  });
  const [isSubmittingTimeline, setIsSubmittingTimeline] = useState(false);

  // Expense Form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    note: "",
    visibleToCustomers: true,
  });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!tourId) return;
      try {
        const [tourData, expenseResp, passengersResp] = await Promise.all([
          leaderToursApi.getTourDetail(tourId),
          leaderToursApi.getTourExpenses(tourId).catch(() => ({ data: [], total: 0, count: 0 })),
          leaderToursApi.getPassengers(tourId).catch(() => ({ data: [], total: 0 })),
        ]);
        setTour(tourData);
        setExpenses(expenseResp.data ?? []);
        setPassengers(passengersResp.data ?? []);
      } catch (err) {
        console.error("Error fetching tour:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [tourId]);

  // Submit Timeline Event
  const handleSubmitTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourId) return;

    setIsSubmittingTimeline(true);
    try {
      const result = await leaderToursApi.addTimeline(tourId, {
        eventType: timelineForm.eventType,
        place: timelineForm.place || undefined,
        note: timelineForm.note || undefined,
      });

      // Refresh tour data
      const updatedTour = await leaderToursApi.getTourDetail(tourId);
      setTour(updatedTour);

      // Reset form
      setTimelineForm({ eventType: "checkpoint", place: "", note: "" });
      setShowTimelineForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi thêm sự kiện");
    } finally {
      setIsSubmittingTimeline(false);
    }
  };

  // Submit Expense
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourId || !expenseForm.title || !expenseForm.amount) return;

    setIsSubmittingExpense(true);
    try {
      const result = await leaderToursApi.addExpense(tourId, {
        title: expenseForm.title,
        amount: Number(expenseForm.amount),
        note: expenseForm.note || undefined,
        visibleToCustomers: expenseForm.visibleToCustomers,
      });

      // Refresh expenses
      const updatedExpenses = await leaderToursApi.getTourExpenses(tourId);
      setExpenses(updatedExpenses.data ?? []);

      // Reset form
      setExpenseForm({ title: "", amount: "", note: "", visibleToCustomers: true });
      setShowExpenseForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi thêm chi phí");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải thông tin tour...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Không tìm thấy tour
        </h2>
        <button
          onClick={() => router.push("/leader/tours")}
          className="text-blue-400 hover:underline"
        >
          Quay lại danh sách tour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/leader/tours")}
        className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Quay lại</span>
      </button>

      {/* Tour Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-3xl p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 text-white`}
              >
                {statusColors[tour.status]?.label}
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">
              {tour.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-blue-100">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {tour.destination}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {tour.bookedCount || 0}/{tour.quantity} khách
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          {(tour.status === "confirmed" || tour.status === "in_progress") && (
            <div className="flex gap-3">
              {tour.status === "confirmed" && (
                <button
                  onClick={() => {
                    setTimelineForm({ ...timelineForm, eventType: "departed" });
                    setShowTimelineForm(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-medium hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Plane className="w-5 h-5" />
                  Bắt đầu tour
                </button>
              )}
              {tour.status === "in_progress" && (
                <button
                  onClick={() => {
                    setTimelineForm({ ...timelineForm, eventType: "finished" });
                    setShowTimelineForm(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white text-slate-800 font-medium hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Kết thúc tour
                </button>
              )}
            </div>
          )}
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute -right-5 -bottom-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === "timeline"
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Clock className="w-5 h-5" />
          Timeline
        </button>
        <button
          onClick={() => setActiveTab("passengers")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === "passengers"
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-5 h-5" />
          Hành khách ({passengers.length})
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === "expenses"
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <DollarSign className="w-5 h-5" />
          Chi phí ({expenses.length})
        </button>
      </div>

      {/* Timeline Tab */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          {/* Add Timeline Button */}
          {(tour.status === "confirmed" || tour.status === "in_progress") && (
            <button
              onClick={() => setShowTimelineForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Thêm sự kiện
            </button>
          )}

          {/* Timeline Form Modal */}
          {showTimelineForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">
                  Thêm sự kiện Timeline
                </h3>
                <form onSubmit={handleSubmitTimeline} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Loại sự kiện
                    </label>
                    <select
                      value={timelineForm.eventType}
                      onChange={(e) =>
                        setTimelineForm({
                          ...timelineForm,
                          eventType: e.target.value as TimelineEvent["eventType"],
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none"
                    >
                      <option value="departed" className="bg-slate-800">Xuất phát</option>
                      <option value="arrived" className="bg-slate-800">Đến nơi</option>
                      <option value="checkpoint" className="bg-slate-800">Điểm dừng</option>
                      <option value="note" className="bg-slate-800">Ghi chú</option>
                      <option value="finished" className="bg-slate-800">Kết thúc</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Địa điểm (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={timelineForm.place}
                      onChange={(e) =>
                        setTimelineForm({ ...timelineForm, place: e.target.value })
                      }
                      placeholder="VD: Sân bay Nội Bài"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      value={timelineForm.note}
                      onChange={(e) =>
                        setTimelineForm({ ...timelineForm, note: e.target.value })
                      }
                      placeholder="Thêm ghi chú..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTimelineForm(false)}
                      className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingTimeline}
                      className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmittingTimeline ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Timeline List */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            {!tour.timeline || tour.timeline.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500">Chưa có sự kiện nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tour.timeline.map((event, index) => {
                  const IconComponent = eventTypeIcons[event.eventType] || FileText;
                  return (
                    <div
                      key={event._id || index}
                      className="flex gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-white">
                            {eventTypeLabels[event.eventType] || event.eventType}
                          </span>
                          <span className="text-sm text-slate-500">
                            {formatDateTime(event.at)}
                          </span>
                        </div>
                        {event.place && (
                          <p className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.place}
                          </p>
                        )}
                        {event.note && (
                          <p className="text-slate-500 mt-1">{event.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Passengers Tab */}
      {activeTab === "passengers" && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          {passengers.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">Chưa có hành khách đặt chỗ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-400">Mã đặt vé</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-400">Tên khách</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-400">SĐT</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-400">Người lớn</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-400">Trẻ em</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-400">Tổng tiền</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-400">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {passengers.map((p, i) => {
                    const name = p.userId?.fullName ?? p.fullName ?? "—";
                    const phone = p.userId?.phoneNumber ?? p.phoneNumber ?? "—";
                    return (
                      <tr key={p._id || i} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.code}</td>
                        <td className="px-4 py-3 font-medium text-white">{name}</td>
                        <td className="px-4 py-3 text-slate-400">{phone}</td>
                        <td className="px-4 py-3 text-center text-slate-300">{p.numAdults}</td>
                        <td className="px-4 py-3 text-center text-slate-300">{p.numChildren}</td>
                        <td className="px-4 py-3 text-right font-semibold text-orange-400">
                          {p.totalPrice?.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            p.bookingStatus === "confirmed" ? "bg-emerald-500/10 text-emerald-400" :
                            p.bookingStatus === "cancelled" ? "bg-red-500/10 text-red-400" :
                            "bg-amber-500/10 text-amber-400"
                          }`}>
                            {p.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {/* Add Expense Button */}
          {(tour.status === "confirmed" || tour.status === "in_progress") && (
            <button
              onClick={() => setShowExpenseForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Thêm chi phí
            </button>
          )}

          {/* Expense Form Modal */}
          {showExpenseForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">
                  Thêm chi phí phát sinh
                </h3>
                <form onSubmit={handleSubmitExpense} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tên chi phí *
                    </label>
                    <input
                      type="text"
                      value={expenseForm.title}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, title: e.target.value })
                      }
                      placeholder="VD: Ăn trưa đoàn"
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Số tiền (VNĐ) *
                    </label>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, amount: e.target.value })
                      }
                      placeholder="VD: 1200000"
                      required
                      min="0"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      value={expenseForm.note}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, note: e.target.value })
                      }
                      placeholder="Thêm ghi chú..."
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="visibleToCustomers"
                      checked={expenseForm.visibleToCustomers}
                      onChange={(e) =>
                        setExpenseForm({
                          ...expenseForm,
                          visibleToCustomers: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-600 text-orange-500 focus:ring-orange-500 bg-slate-700"
                    />
                    <label htmlFor="visibleToCustomers" className="text-sm text-slate-400">
                      Hiển thị cho khách hàng
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingExpense}
                      className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmittingExpense ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Expenses List */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500">Chưa có chi phí nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense, index) => (
                  <div
                    key={expense._id || index}
                    className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white">
                        {expense.title}
                      </h4>
                      {expense.note && (
                        <p className="text-sm text-slate-500 mt-1">{expense.note}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-1">
                        {formatDateTime(expense.occurredAt)}
                        {!expense.visibleToCustomers && (
                          <span className="ml-2 text-amber-500">(Ẩn khách)</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-400">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="pt-4 border-t-2 border-white/20 flex items-center justify-between">
                  <span className="font-bold text-white">Tổng cộng:</span>
                  <span className="text-xl font-bold text-orange-400">
                    {formatCurrency(
                      expenses.reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
