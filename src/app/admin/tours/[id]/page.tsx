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

  // ─── State: Bộ lọc trạng thái ─────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>("");
  const filteredDeps = statusFilter
    ? departures.filter(d => d.status === statusFilter)
    : departures;

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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Link
                href="/admin/tours"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-600 hover:text-orange-600 hover:shadow-md transition mb-4"
              >
                <i className="ri-arrow-left-line"></i>
                Quản lý Tours
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">{tour.title}</h1>
              <p className="text-slate-600 mt-1">📍 {tour.destination}</p>
            </div>
          </div>
        </div>

        {/* Tour Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Giá người lớn", value: fmtVND(tour.priceAdult) },
            { label: "Giá trẻ em",   value: fmtVND(tour.priceChild) },
            { label: "Số lịch KH",   value: String(departures.length) },
            { label: "Đang diễn ra", value: String(departures.filter(d => d.status === "in_progress").length) },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs text-slate-500 mb-1">{card.label}</div>
              <div className="text-xl font-bold text-slate-900">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Bộ lọc trạng thái */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full md:w-56">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="in_progress">Đang diễn ra</option>
                <option value="completed">Hoàn thành</option>
                <option value="closed">Đã đóng</option>
              </select>
            </div>
          </div>
        </div>

        {/* BẢNG LỊCH KHỞI HÀNH */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="ri-calendar-event-fill text-orange-500 text-xl"></i>
              Danh Sách Lịch Khởi Hành
            </h2>
            <button
              className={`px-5 py-2.5 rounded-lg font-semibold transition text-sm flex items-center gap-2 ${
                showCreateForm 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25'
              }`}
              onClick={() => setShowCreateForm(v => !v)}
            >
              {showCreateForm ? (
                <><i className="ri-close-line text-lg"></i> Đóng</>
              ) : (
                <><i className="ri-add-line text-lg"></i> Tạo lịch mới</>
              )}
            </button>
          </div>

          {/* Form tạo departure mới */}
          {showCreateForm && (
            <div className="mb-6 p-4 md:p-6 bg-slate-50 rounded-lg flex flex-col gap-4">
              <h3 className="text-sm font-medium text-slate-700 pb-3 border-b border-slate-200 flex items-center gap-2">
                <i className="ri-calendar-check-line text-orange-500 text-lg"></i>
                Thiết lập thông tin lịch khởi hành
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày khởi hành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    value={newDep.startDate}
                    onChange={e => handleStartDateChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày về (Tự động)
                  </label>
                  <input
                    type="date"
                    disabled
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                    value={newDep.endDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số khách tối thiểu
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    value={newDep.min_guests}
                    onChange={e => setNewDep(d => ({ ...d, min_guests: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số khách tối đa
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    value={newDep.max_guests}
                    onChange={e => setNewDep(d => ({ ...d, max_guests: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giá người lớn (Mặc định: {fmtVND(tour.priceAdult)})
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    value={newDep.priceAdult}
                    onChange={e => setNewDep(d => ({ ...d, priceAdult: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giá trẻ em (Mặc định: {fmtVND(tour.priceChild)})
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    value={newDep.priceChild}
                    onChange={e => setNewDep(d => ({ ...d, priceChild: Number(e.target.value) }))}
                  />
                </div>
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 font-semibold transition text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-[38px] flex items-center justify-center gap-2"
                  disabled={createDepMut.isPending || !newDep.startDate || !newDep.endDate}
                  onClick={() => createDepMut.mutate()}
                >
                  {createDepMut.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line"></i>
                      Lưu lịch khởi hành
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Bảng danh sách departures */}
          {depLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-slate-600">Đang tải dữ liệu...</span>
            </div>
          ) : filteredDeps.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-calendar-line text-4xl text-slate-300 block mb-3"></i>
              <p className="text-slate-500">{statusFilter ? 'Không có lịch khởi hành nào với trạng thái này.' : 'Chưa có lịch khởi hành nào. Hãy tạo lịch đầu tiên!'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Khởi hành</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Kết thúc</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Số khách</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Leader</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeps.map(dep => {
                    const sc = STATUS_COLORS[dep.status] ?? STATUS_COLORS.pending;
                    const leaderObj = typeof dep.leaderId === "object" && dep.leaderId !== null
                      ? dep.leaderId as any
                      : null;
                    return (
                      <tr key={dep._id} className="hover:bg-slate-50 transition duration-200 group">
                        <td className="px-4 py-4 font-medium text-slate-900">{fmtDate(dep.startDate)}</td>
                        <td className="px-4 py-4 text-slate-600 text-sm">{fmtDate(dep.endDate)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <i className="ri-group-line text-slate-400"></i>
                            <span className="font-medium text-slate-700">{dep.current_guests}</span>
                            <span className="text-slate-400 text-xs ml-1">/ {dep.min_guests} min</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {leaderObj ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs">
                                {leaderObj.fullName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sky-700 font-medium text-sm hover:underline cursor-pointer">{leaderObj.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-sm flex items-center gap-1.5">
                              <i className="ri-error-warning-line"></i> Chưa gán
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {/* Xem khách hàng */}
                            <button
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                              title="Xem danh sách khách"
                              onClick={() => setPassengerModal({
                                open: true,
                                departureId: dep._id,
                                label: fmtDate(dep.startDate),
                              })}
                            >
                              <i className="ri-team-line text-lg" />
                            </button>

                            {/* Phân công Leader */}
                            <button
                              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Phân công Leader"
                              onClick={() => setAssignModal({
                                open: true,
                                departureId: dep._id,
                                leaderId: leaderObj?._id ?? "",
                              })}
                            >
                              <i className="ri-user-star-line text-lg" />
                            </button>

                            {/* Xác nhận */}
                            {dep.status === "pending" && (
                              <button
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  !leaderObj ? "Cần phân công Leader trước khi xác nhận" :
                                  dep.current_guests < 1 ? "Cần có ít nhất 1 khách để xác nhận" :
                                  new Date() > new Date(dep.startDate) ? "Lịch khởi hành đã qua, không thể xác nhận" :
                                  "Xác nhận lịch khởi hành"
                                }
                                disabled={!leaderObj || dep.current_guests < 1 || new Date() > new Date(dep.startDate)}
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  title: "Xác nhận lịch khởi hành",
                                  message: `Bạn đang xác nhận lịch ngày ${fmtDate(dep.startDate)}.${dep.current_guests < dep.min_guests ? `\n\n⚠️ CẢNH BÁO: Số khách hiện tại (${dep.current_guests}) chưa đạt mức tối thiểu (${dep.min_guests}). Bạn có chắc chắn muốn chạy tour này?` : ""}`,
                                  action: () => statusMut.mutate({ id: dep._id, status: "confirmed" }),
                                })}
                              >
                                <i className="ri-check-double-line text-lg" />
                              </button>
                            )}

                            {/* Bắt đầu */}
                            {dep.status === "confirmed" && (
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  Date.now() < new Date(dep.startDate).setHours(0,0,0,0) ? "Chưa đến ngày khởi hành" :
                                  Date.now() > new Date(dep.endDate).setHours(23,59,59,999) ? "Đã quá ngày kết thúc" :
                                  "Khởi hành chuyến đi"
                                }
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  title: "Khởi hành chuyến đi",
                                  message: `Bắt đầu chuyến đi ngày ${fmtDate(dep.startDate)}?`,
                                  action: () => statusMut.mutate({ id: dep._id, status: "in_progress" }),
                                })}
                              >
                                <i className="ri-play-circle-line text-lg" />
                              </button>
                            )}

                            {/* Hoàn thành */}
                            {dep.status === "in_progress" && (
                              <button
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  Date.now() < new Date(dep.endDate).setHours(0,0,0,0) ? "Chuyến đi chưa kết thúc" :
                                  "Kết thúc chuyến đi"
                                }
                                disabled={Date.now() < new Date(dep.endDate).setHours(0,0,0,0)}
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  title: "Kết thúc chuyến đi",
                                  message: `Đánh dấu hoàn thành chuyến đi ngày ${fmtDate(dep.startDate)}?`,
                                  action: () => statusMut.mutate({ id: dep._id, status: "completed" }),
                                })}
                              >
                                <i className="ri-checkbox-circle-line text-lg" />
                              </button>
                            )}

                            {/* Đóng */}
                            {dep.status === "pending" && (
                              <button
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Đóng lịch khởi hành"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  title: "Đóng lịch khởi hành",
                                  message: `Đóng lịch khởi hành ngày ${fmtDate(dep.startDate)}? Các thay đổi sẽ không thể hoàn tác.`,
                                  action: () => statusMut.mutate({ id: dep._id, status: "closed" }),
                                })}
                              >
                                <i className="ri-close-circle-line text-lg" />
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
        </div>
      </div>
    </>
  );
}
