"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminBookings,
  deleteAdminBooking,
  GetAdminBookingsParams,
} from "@/lib/admin/adminBookingApi";
import { getTours } from "@/lib/tours/tour";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import BookingsTable from "./BookingsTable";

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  
  // Local state for filter inputs
  const [filterInputs, setFilterInputs] = useState({
    search: "",
    status: "",
    tourId: "",
    startDate: "",
    endDate: "",
    paymentStatus: "",
    customerType: "",
    paymentMethod: "",
  });

  // Actual filters used for the query
  const [activeFilters, setActiveFilters] = useState<Partial<GetAdminBookingsParams>>({});

  const queryClient = useQueryClient();
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    bookingId: string;
    bookingCode: string;
  }>({ isOpen: false, bookingId: "", bookingCode: "" });

  // Fetch tours for the dropdown
  const { data: toursList } = useQuery({
    queryKey: ["toursForFilter"],
    queryFn: () => getTours(1, 200),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminBookings", page, activeFilters],
    queryFn: () =>
      getAdminBookings({
        page,
        limit: 20,
        ...activeFilters,
      }),
  });

  const handleSearch = () => {
    setActiveFilters({
      ...filterInputs,
      search: filterInputs.search.trim() || undefined,
      status: filterInputs.status || undefined,
      tourId: filterInputs.tourId || undefined,
      startDate: filterInputs.startDate || undefined,
      endDate: filterInputs.endDate || undefined,
      paymentStatus: (filterInputs.paymentStatus as any) || undefined,
      customerType: (filterInputs.customerType as any) || undefined,
      paymentMethod: filterInputs.paymentMethod || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    const empty = {
      search: "",
      status: "",
      tourId: "",
      startDate: "",
      endDate: "",
      paymentStatus: "",
      customerType: "",
      paymentMethod: "",
    };
    setFilterInputs(empty);
    setActiveFilters({});
    setPage(1);
  };

  const updateFilterInput = (key: keyof typeof filterInputs, value: string) => {
    setFilterInputs(prev => ({ ...prev, [key]: value }));
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      showSuccess("Xóa đơn đặt tour thành công!");
      setConfirmDelete({ isOpen: false, bookingId: "", bookingCode: "" });
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Không thể xóa đơn đặt tour");
      setConfirmDelete({ isOpen: false, bookingId: "", bookingCode: "" });
    },
  });

  const totalPages = data ? Math.ceil(data.total / (data.limit || 20)) : 0;

  const confirmDeleteAction = () => {
    if (confirmDelete.bookingId) {
      deleteMutation.mutate(confirmDelete.bookingId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Quản Lý Đặt Tour
          </h1>
          <p className="text-slate-600">Quản lý các đơn đặt tour, thanh toán và trạng thái khách hàng</p>
        </div>
        <Link
          href="/admin/bookings/create"
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition font-semibold shadow-lg shadow-orange-500/25 flex items-center gap-2"
        >
          <i className="ri-add-line"></i>
          Tạo Booking
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <i className="ri-filter-3-line text-orange-500"></i>
             Bộ lọc nâng cao
           </h2>
           <button 
             onClick={handleReset}
             className="text-sm text-slate-500 hover:text-orange-600 transition flex items-center gap-1"
           >
             <i className="ri-refresh-line"></i> Làm mới
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Tìm kiếm</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="ri-search-line"></i>
              </span>
              <input
                type="text"
                placeholder="Tên khách, email, mã đơn, SĐT..."
                value={filterInputs.search}
                onChange={(e) => updateFilterInput("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-slate-50 transition"
              />
            </div>
          </div>

          {/* Tour Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Theo Tour</label>
            <select
              value={filterInputs.tourId}
              onChange={(e) => updateFilterInput("tourId", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 text-sm bg-slate-50 outline-none"
            >
              <option value="">-- Tất cả Tour --</option>
              {toursList?.data?.map((t) => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Trạng thái đơn</label>
            <select
              value={filterInputs.status}
              onChange={(e) => updateFilterInput("status", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 text-sm bg-slate-50 outline-none"
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Khởi hành từ</label>
            <input
              type="date"
              value={filterInputs.startDate}
              onChange={(e) => updateFilterInput("startDate", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 text-sm bg-slate-50 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Khởi hành đến</label>
            <input
              type="date"
              value={filterInputs.endDate}
              onChange={(e) => updateFilterInput("endDate", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 text-sm bg-slate-50 outline-none"
            />
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Thanh toán</label>
            <select
              value={filterInputs.paymentStatus}
              onChange={(e) => updateFilterInput("paymentStatus", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 text-sm bg-slate-50 outline-none"
            >
              <option value="">-- Tất cả --</option>
              <option value="unpaid">Chưa thanh toán</option>
              <option value="deposited">Đã cọc</option>
              <option value="full">Đã trả đủ</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
            >
              <i className="ri-search-line text-lg"></i>
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-slate-600">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          Lỗi: {error instanceof Error ? error.message : "Không thể tải dữ liệu"}
        </div>
      )}

      {/* Table Section */}
      {!isLoading && !error && data && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm px-5 py-3 flex items-center gap-2">
            <i className="ri-list-check text-slate-400"></i>
            <p className="text-slate-600 text-sm">
              Tìm thấy <span className="font-bold text-slate-900">{data.total}</span> đơn đặt tour
              {Object.values(activeFilters).some(v => v !== undefined) && <span className="text-slate-400"> (đã lọc)</span>}
            </p>
          </div>

          {data.data && data.data.length > 0 ? (
            <BookingsTable bookings={data.data} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-slate-600">Không có đơn đặt tour nào.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl shadow-md p-4">
              <p className="text-slate-600 mb-4 md:mb-0 text-sm">
                Tổng cộng: <span className="font-bold text-slate-900">{data.total}</span> đơn &nbsp;|&nbsp; Trang{" "}
                <span className="font-bold text-orange-600">{page}</span> / <span className="font-bold">{totalPages}</span>
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
                >
                  ← Trước
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-2 rounded-lg transition text-sm font-medium ${
                      page === i + 1
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Xóa đơn đặt tour"
        message={`Bạn có chắc chắn muốn xóa đơn ${confirmDelete.bookingCode}? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false, bookingId: "", bookingCode: "" })}
        type="danger"
      />
    </div>
  );
}
