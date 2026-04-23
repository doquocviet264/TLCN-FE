"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  getTourByIdAdmin,
  listDeparturesAdmin,
  createDepartureAdmin,
  patchDepartureStatus,
  assignLeaderToDeparture,
  DepartureResponse,
} from "@/lib/admin/adminApi";
import { getAdminLeaders } from "@/lib/admin/adminLeaderApi";
import { getAdminBookings, BookingData } from "@/lib/admin/adminBookingApi";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending:     { bg: "bg-yellow-100", text: "text-yellow-800", label: "Chờ xác nhận" },
  confirmed:   { bg: "bg-blue-100",   text: "text-blue-800",   label: "Đã xác nhận" },
  in_progress: { bg: "bg-emerald-100",text: "text-emerald-800",label: "Đang diễn ra" },
  completed:   { bg: "bg-slate-100",  text: "text-slate-800",  label: "Hoàn thành" },
  closed:      { bg: "bg-red-100",    text: "text-red-800",    label: "Đã đóng" },
};

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("vi-VN") : "—";

const fmtVND = (n?: number) =>
  n != null ? n.toLocaleString("vi-VN") + " đ" : "—";

const getDaysFromDuration = (duration = "") => {
  const match = duration.match(/(\d+)\s*ngày/i);
  return match ? parseInt(match[1]) : 0;
};

export default function AdminTourDetail() {
  const { id: tourId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // ─── Tour Template ────────────────────────────────────────────
  const { data: tour, isLoading: tourLoading } = useQuery({
    queryKey: ["adminTour", tourId],
    queryFn: () => getTourByIdAdmin(tourId),
    enabled: !!tourId,
  });

  // ─── Departures ───────────────────────────────────────────────
  const { data: depData, isLoading: depLoading } = useQuery({
    queryKey: ["adminDepartures", tourId],
    queryFn: () => listDeparturesAdmin(tourId, { limit: 100 }),
    enabled: !!tourId,
  });
  const departures: DepartureResponse[] = depData?.data ?? [];

  // ─── Leaders (để gán) ─────────────────────────────────────────
  const { data: leadersResp } = useQuery({
    queryKey: ["adminLeaders", "all"],
    queryFn: () => getAdminLeaders({ limit: 100, status: "active" }),
  });
  const leaders = leadersResp?.data ?? [];

  // ─── State: Form tạo Departure ────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDep, setNewDep] = useState({
    startDate: "",
    endDate: "",
    min_guests: 10,
    max_guests: 30,
    priceAdult: 0,
    priceChild: 0,
  });

  // ─── State: Gán Leader cho Departure ─────────────────────────
  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    departureId: string;
    leaderId: string;
  }>({ open: false, departureId: "", leaderId: "" });

  // ─── State: Confirm đổi status ───────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; message: string; action: () => void;
  }>({ open: false, title: "", message: "", action: () => {} });

  // ─── State: Danh sách khách hàng (Passengers) ────────────────
  const [passengerModal, setPassengerModal] = useState<{
    open: boolean; departureId: string; label: string;
  }>({ open: false, departureId: "", label: "" });

  const { data: passengersResp, isLoading: passengersLoading } = useQuery({
    queryKey: ["adminDeparturePassengers", passengerModal.departureId],
    queryFn: () => getAdminBookings({ tourId: passengerModal.departureId, limit: 100 }),
    enabled: passengerModal.open && !!passengerModal.departureId,
  });
  const passengers: BookingData[] = passengersResp?.data ?? [];

  // Pre-fill prices and max guests when opening create form
  useEffect(() => {
    if (showCreateForm && tour) {
      setNewDep(prev => ({
        ...prev,
        priceAdult: tour.priceAdult || 0,
        priceChild: tour.priceChild || 0,
        max_guests: tour.quantity || 30,
      }));
    }
  }, [showCreateForm, tour]);

  const handleStartDateChange = (val: string) => {
    const days = getDaysFromDuration(tour?.time);
    let end = val;
    if (days > 0 && val) {
      const d = new Date(val);
      d.setDate(d.getDate() + (days - 1));
      end = d.toISOString().split("T")[0];
    }
    setNewDep(prev => ({ ...prev, startDate: val, endDate: end }));
  };

  // ─── Mutations ───────────────────────────────────────────────
  const createDepMut = useMutation({
    mutationFn: () => {
      const start = new Date(newDep.startDate);
      const end = new Date(newDep.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        throw new Error("Không được tạo lịch khởi hành trong quá khứ!");
      }
      if (end < start) {
        throw new Error("Ngày kết thúc không được trước ngày khởi hành!");
      }
      
      // Kiểm tra trùng ngày khởi hành (chỉ lấy YYYY-MM-DD để so sánh)
      const isDuplicate = departures.some(d => 
        new Date(d.startDate).toISOString().split('T')[0] === newDep.startDate
      );
      if (isDuplicate) {
        throw new Error("Lịch khởi hành cho ngày này đã tồn tại!");
      }

      return createDepartureAdmin(tourId, {
        startDate: newDep.startDate,
        endDate:   newDep.endDate,
        min_guests: newDep.min_guests,
        max_guests: newDep.max_guests,
        priceAdult: newDep.priceAdult || undefined,
        priceChild: newDep.priceChild || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminDepartures", tourId] });
      showSuccess("Tạo lịch khởi hành thành công!");
      setShowCreateForm(false);
      setNewDep({ startDate: "", endDate: "", min_guests: 10, max_guests: 30, priceAdult: 0, priceChild: 0 });
    },
    onError: (e: any) => showError(e.response?.data?.message || "Lỗi tạo lịch"),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DepartureResponse["status"] }) =>
      patchDepartureStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminDepartures", tourId] });
      showSuccess("Cập nhật trạng thái thành công!");
      setConfirmDialog(d => ({ ...d, open: false }));
    },
    onError: (e: any) => showError(e.response?.data?.message || "Lỗi cập nhật"),
  });

  const assignMut = useMutation({
    mutationFn: ({ id, leaderId }: { id: string; leaderId: string | null }) =>
      assignLeaderToDeparture(id, leaderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminDepartures", tourId] });
      showSuccess("Phân công Leader thành công!");
      setAssignModal(m => ({ ...m, open: false }));
    },
    onError: (e: any) => showError(e.response?.data?.message || "Lỗi phân công"),
  });

  // ─── Render ──────────────────────────────────────────────────
  if (tourLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
  if (!tour) return (
    <div className="p-8 text-center text-red-500">❌ Không tìm thấy tour.</div>
  );

  return (
    <>
      <Toast {...toast} onClose={hideToast} />

      <ConfirmDialog
        isOpen={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
        type="warning"
        onConfirm={() => confirmDialog.action()}
        onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
      />

      {/* Passenger List Modal */}
      {passengerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  👥 Danh sách hành khách
                </h3>
                <p className="text-sm text-slate-500 mt-1">Lịch khởi hành: <span className="font-semibold text-orange-600">{passengerModal.label}</span></p>
              </div>
              <button 
                onClick={() => setPassengerModal(m => ({ ...m, open: false }))}
                className="p-2 hover:bg-slate-200 rounded-full transition"
              >
                <i className="ri-close-line text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {passengersLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                   <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                   <div className="text-slate-500">Đang tải danh sách...</div>
                </div>
              ) : passengers.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4 text-slate-300">🎫</div>
                  <p className="text-slate-500">Chưa có khách hàng nào đặt lịch này.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 sticky top-0 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Mã đơn</th>
                      <th className="px-4 py-3 text-left">Khách hàng</th>
                      <th className="px-4 py-3 text-center">Người lớn</th>
                      <th className="px-4 py-3 text-center">Trẻ em</th>
                      <th className="px-4 py-3 text-left">Số điện thoại</th>
                      <th className="px-4 py-3 text-left">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {passengers.map(bk => (
                      <tr key={bk._id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-4 font-mono font-bold text-blue-600">{bk.code}</td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800">{bk.fullName}</div>
                          <div className="text-xs text-slate-500">{bk.email}</div>
                        </td>
                        <td className="px-4 py-4 text-center font-medium">{bk.numAdults}</td>
                        <td className="px-4 py-4 text-center font-medium">{bk.numChildren}</td>
                        <td className="px-4 py-4 text-slate-700">{bk.phoneNumber}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            bk.bookingStatus === 'c' ? 'bg-green-100 text-green-700' :
                            bk.bookingStatus === 'x' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {bk.bookingStatus === 'c' ? 'Đã xác nhận' : bk.bookingStatus === 'x' ? 'Đã hủy' : 'Chờ xử lý'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <div className="mr-auto flex gap-6 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-500">Tổng khách</span>
                  <span className="font-bold text-lg text-slate-900">
                    {passengers.reduce((acc, curr) => acc + (curr.numAdults || 0) + (curr.numChildren || 0), 0)}
                  </span>
                </div>
                <div className="flex flex-col">
                   <span className="text-slate-500">Tổng người lớn</span>
                   <span className="font-bold text-lg text-slate-900">
                    {passengers.reduce((acc, curr) => acc + (curr.numAdults || 0), 0)}
                  </span>
                </div>
                <div className="flex flex-col">
                   <span className="text-slate-500">Tổng trẻ em</span>
                   <span className="font-bold text-lg text-slate-900">
                    {passengers.reduce((acc, curr) => acc + (curr.numChildren || 0), 0)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setPassengerModal(m => ({ ...m, open: false }))}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Leader Modal */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              👮 Phân công Leader
            </h3>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={assignModal.leaderId}
              onChange={e => setAssignModal(m => ({ ...m, leaderId: e.target.value }))}
            >
              <option value="">-- Gỡ Leader --</option>
              {leaders.map((l: any) => (
                <option key={l._id} value={l._id}>
                  {l.fullName} ({l.username}) – {l.phoneNumber}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2.5 font-medium transition"
                onClick={() => assignMut.mutate({ id: assignModal.departureId, leaderId: assignModal.leaderId || null })}
                disabled={assignMut.isPending}
              >
                {assignMut.isPending ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg py-2.5 font-medium transition"
                onClick={() => setAssignModal(m => ({ ...m, open: false }))}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-[95%] max-w-6xl py-8 space-y-8 pb-20">
        {/* Header */}
        <header className="border-b pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/admin/tours" className="hover:text-orange-500 transition">
              ← Quản lý Tours
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">{tour.title}</h1>
              <p className="text-slate-600 mt-1">📍 {tour.destination}</p>
            </div>
            <Link
              href={`/admin/tours/edit/${tourId}`}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-md"
            >
              ✏️ Sửa Tour Template
            </Link>
          </div>
        </header>

        {/* Tour Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Giá người lớn", value: fmtVND(tour.priceAdult) },
            { label: "Giá trẻ em",   value: fmtVND(tour.priceChild) },
            { label: "Số lịch KH",   value: String(departures.length) },
            { label: "Đang diễn ra", value: String(departures.filter(d => d.status === "in_progress").length) },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border shadow-sm p-4">
              <div className="text-xs text-slate-500 mb-1">{card.label}</div>
              <div className="text-xl font-bold text-slate-900">{card.value}</div>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════
            BẢNG LỊCH KHỞI HÀNH (DEPARTURES)
        ════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border shadow p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-800">📅 Các Lịch Khởi Hành</h2>
            <button
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition shadow-md text-sm"
              onClick={() => setShowCreateForm(v => !v)}
            >
              {showCreateForm ? "✕ Hủy" : "+ Tạo lịch khởi hành mới"}
            </button>
          </div>

          {/* Form tạo departure mới */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200 flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày khởi hành *</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                    value={newDep.startDate}
                    onChange={e => handleStartDateChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày về *</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                    value={newDep.endDate}
                    onChange={e => setNewDep(d => ({ ...d, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số lượng tối thiểu</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                    value={newDep.min_guests}
                    onChange={e => setNewDep(d => ({ ...d, min_guests: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số lượng tối đa</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                    value={newDep.max_guests}
                    onChange={e => setNewDep(d => ({ ...d, max_guests: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giá người lớn (Mặc định: {fmtVND(tour.priceAdult)})</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                    value={newDep.priceAdult}
                    onChange={e => setNewDep(d => ({ ...d, priceAdult: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giá trẻ em (Mặc định: {fmtVND(tour.priceChild)})</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                    value={newDep.priceChild}
                    onChange={e => setNewDep(d => ({ ...d, priceChild: Number(e.target.value) }))}
                  />
                </div>
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 font-medium transition text-sm shadow-md disabled:opacity-60 h-[38px] flex items-center justify-center"
                  disabled={createDepMut.isPending || !newDep.startDate || !newDep.endDate}
                  onClick={() => createDepMut.mutate()}
                >
                  {createDepMut.isPending ? "Đang tạo..." : "✔ Tạo lịch KH"}
                </button>
              </div>
            </div>
          )}

          {/* Bảng danh sách departures */}
          {depLoading ? (
            <div className="text-center py-8 text-slate-400">Đang tải lịch khởi hành...</div>
          ) : departures.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <div className="text-4xl mb-3">📭</div>
              <p>Chưa có lịch khởi hành nào. Hãy tạo lịch đầu tiên!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Khởi hành</th>
                    <th className="px-4 py-3 text-left font-semibold">Kết thúc</th>
                    <th className="px-4 py-3 text-left font-semibold">Số khách</th>
                    <th className="px-4 py-3 text-left font-semibold">Leader</th>
                    <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departures.map(dep => {
                    const sc = STATUS_COLORS[dep.status] ?? STATUS_COLORS.pending;
                    const leaderObj = typeof dep.leaderId === "object" && dep.leaderId !== null
                      ? dep.leaderId as any
                      : null;
                    return (
                      <tr key={dep._id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-medium text-slate-800">{fmtDate(dep.startDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmtDate(dep.endDate)}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{dep.current_guests}</span>
                          <span className="text-slate-400">/{dep.min_guests} min</span>
                        </td>
                        <td className="px-4 py-3">
                          {leaderObj ? (
                            <span className="text-sky-700 font-medium">{leaderObj.fullName}</span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Chưa gán</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {/* Xem khách hàng */}
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition text-xs font-semibold border border-orange-200"
                              onClick={() => setPassengerModal({
                                open: true,
                                departureId: dep._id,
                                label: fmtDate(dep.startDate),
                              })}
                            >
                              <i className="ri-group-line" />
                              Xem khách
                            </button>

                            {/* Phân công Leader */}
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition text-xs font-semibold border border-sky-200"
                              onClick={() => setAssignModal({
                                open: true,
                                departureId: dep._id,
                                leaderId: leaderObj?._id ?? "",
                              })}
                            >
                              <i className="ri-user-star-line" />
                              Phân công
                            </button>

                            {/* Xác nhận */}
                            {dep.status === "pending" && (
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition text-xs font-semibold border border-green-200"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  title: "Xác nhận lịch khởi hành",
                                  message: `Xác nhận lịch khởi hành ngày ${fmtDate(dep.startDate)}?`,
                                  action: () => statusMut.mutate({ id: dep._id, status: "confirmed" }),
                                })}
                              >
                                <i className="ri-check-double-line" />
                                Xác nhận
                              </button>
                            )}

                            {/* Bắt đầu */}
                            {dep.status === "confirmed" && (
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition text-xs font-semibold border border-blue-200"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  title: "Khởi hành chuyến đi",
                                  message: `Bắt đầu chuyến đi ngày ${fmtDate(dep.startDate)}?`,
                                  action: () => statusMut.mutate({ id: dep._id, status: "in_progress" }),
                                })}
                              >
                                <i className="ri-play-circle-line" />
                                Khởi hành
                              </button>
                            )}

                            {/* Hoàn thành */}
                            {dep.status === "in_progress" && (
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition text-xs font-semibold border border-emerald-200"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  title: "Kết thúc chuyến đi",
                                  message: `Đánh dấu hoàn thành chuyến đi ngày ${fmtDate(dep.startDate)}?`,
                                  action: () => statusMut.mutate({ id: dep._id, status: "completed" }),
                                })}
                              >
                                <i className="ri-checkbox-circle-line" />
                                Hoàn thành
                              </button>
                            )}

                            {/* Đóng */}
                            {(dep.status === "pending" || dep.status === "completed") && (
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition text-xs font-semibold border border-orange-200"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  title: "Đóng lịch khởi hành",
                                  message: `Đóng lịch khởi hành ngày ${fmtDate(dep.startDate)}?`,
                                  action: () => statusMut.mutate({ id: dep._id, status: "closed" }),
                                })}
                              >
                                <i className="ri-close-circle-line" />
                                Đóng
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
