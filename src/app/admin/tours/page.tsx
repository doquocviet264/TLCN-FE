"use client";

import React, { useState, useRef, KeyboardEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllToursAdmin, deleteTourAdmin, getTourTimesAdmin } from '@/lib/admin/adminApi';
import { Toast, useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Link from "next/link";

// Format VND currency
const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const Page = () => {
  const queryClient = useQueryClient()
  const { toast, showSuccess, showError, hideToast } = useToast()

  // ── State phân trang & filter đang áp dụng (gửi lên BE) ──
  const [page, setPage] = useState(1)
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedTime, setAppliedTime] = useState('')
  const [appliedStatus, setAppliedStatus] = useState('')

  // ── State input (chưa submit) ──
  const [inputSearch, setInputSearch] = useState('')
  const [inputTime, setInputTime] = useState('')
  const [inputStatus, setInputStatus] = useState('')

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    type?: "danger" | "warning";
  }>({ isOpen: false, title: '', message: '', action: () => {}, type: 'warning' })

  // ── Fetch danh sách time (cho dropdown) ──
  const { data: timesData } = useQuery({
    queryKey: ['adminTourTimes'],
    queryFn: getTourTimesAdmin,
    staleTime: 5 * 60 * 1000, // cache 5 phút
  })
  const timeOptions: string[] = timesData ?? []

  // ── Fetch danh sách tours theo filter đã áp dụng ──
  const { data, isLoading, error } = useQuery({
    queryKey: ["adminTours", page, appliedSearch, appliedTime, appliedStatus],
    queryFn: () => getAllToursAdmin({
      page,
      limit: 20,
      search: appliedSearch || undefined,
      time: appliedTime || undefined,
      status: appliedStatus || undefined,
    }),
  })

  // ── Xử lý submit tìm kiếm ──
  const handleSearch = () => {
    setAppliedSearch(inputSearch.trim())
    setAppliedTime(inputTime)
    setAppliedStatus(inputStatus)
    setPage(1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  // ── Xóa bộ lọc ──
  const handleClearFilters = () => {
    setInputSearch('')
    setInputTime('')
    setInputStatus('')
    setAppliedSearch('')
    setAppliedTime('')
    setAppliedStatus('')
    setPage(1)
  }

  const hasActiveFilter = appliedSearch || appliedTime || appliedStatus

  // ── Mutation xóa tour ──
  const deleteMutation = useMutation({
    mutationFn: (tourId: string) => deleteTourAdmin(tourId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTours'] })
      showSuccess('Xóa tour thành công!')
      setConfirmDialog(d => ({ ...d, isOpen: false }))
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Không thể xóa tour')
      setConfirmDialog(d => ({ ...d, isOpen: false }))
    }
  })

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Lỗi khi tải dữ liệu tours</p>
        <p className="text-red-600 text-sm mt-2">{(error as any).message}</p>
      </div>
    )

  const tours = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Quản Lý Tours
            </h1>
            <p className="text-slate-600">Quản lý thông tin tours du lịch</p>
          </div>
          <Link
            href="/admin/tours/create"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition font-semibold shadow-lg shadow-orange-500/25"
          >
            + Tạo Tour Mới
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-6">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Tìm kiếm & Bộ lọc</p>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <i className="ri-search-line text-lg"></i>
            </span>
            <input
              id="admin-tour-search"
              type="text"
              placeholder="Tìm theo tên tour, điểm đến..."
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
            />
          </div>

          {/* Time Dropdown */}
          <div className="relative md:w-56">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <i className="ri-time-line text-lg"></i>
            </span>
            <select
              id="admin-tour-time-filter"
              value={inputTime}
              onChange={(e) => setInputTime(e.target.value)}
              className="w-full appearance-none pl-10 pr-8 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-white"
            >
              <option value="">-- Thời gian tour --</option>
              {timeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <i className="ri-arrow-down-s-line text-lg"></i>
            </span>
          </div>

          {/* Status Dropdown */}
          <div className="relative md:w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <i className="ri-toggle-line text-lg"></i>
            </span>
            <select
              id="admin-tour-status-filter"
              value={inputStatus}
              onChange={(e) => setInputStatus(e.target.value)}
              className="w-full appearance-none pl-10 pr-8 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-white"
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="active">Hoạt động</option>
              <option value="hidden">Ẩn</option>
              <option value="paused">Tạm ngưng</option>
              <option value="deleted">Đã xóa</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <i className="ri-arrow-down-s-line text-lg"></i>
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              id="admin-tour-search-btn"
              onClick={handleSearch}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition shadow-sm shadow-orange-300 flex items-center gap-2"
            >
              <i className="ri-search-line"></i>
              Tìm kiếm
            </button>
            {hasActiveFilter && (
              <button
                id="admin-tour-clear-btn"
                onClick={handleClearFilters}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium text-sm transition flex items-center gap-1.5"
                title="Xóa bộ lọc"
              >
                <i className="ri-close-circle-line"></i>
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Active filter tags */}
        {hasActiveFilter && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 self-center">Đang lọc:</span>
            {appliedSearch && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-full text-xs font-medium">
                <i className="ri-search-line text-xs"></i>
                &quot;{appliedSearch}&quot;
              </span>
            )}
            {appliedTime && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-medium">
                <i className="ri-time-line text-xs"></i>
                {appliedTime}
              </span>
            )}
            {appliedStatus && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-medium">
                <i className="ri-toggle-line text-xs"></i>
                {appliedStatus === 'active' ? 'Hoạt động' : 
                 appliedStatus === 'hidden' ? 'Ẩn' : 
                 appliedStatus === 'paused' ? 'Tạm ngưng' : 
                 appliedStatus === 'deleted' ? 'Đã xóa' : appliedStatus}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm px-5 py-3 mb-5 flex items-center gap-2">
        <i className="ri-list-check text-slate-400"></i>
        <p className="text-slate-600 text-sm">
          Tìm thấy <span className="font-bold text-slate-900">{total}</span> tour
          {hasActiveFilter && <span className="text-slate-400"> (đã lọc)</span>}
        </p>
      </div>

      {/* Tours Table */}
      {!tours || tours.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <i className="ri-search-line text-4xl text-yellow-400 mb-3 block"></i>
          <p className="text-yellow-800 font-medium">Không tìm thấy tour nào</p>
          {hasActiveFilter && (
            <p className="text-yellow-600 text-sm mt-1">
              Thử thay đổi từ khóa hoặc{' '}
              <button onClick={handleClearFilters} className="underline font-medium">xóa bộ lọc</button>
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tour Template</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Điểm đến</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Thời gian</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Giá cơ sở</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tours.map((tour: any) => (
                    <tr key={tour._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900 max-w-xs truncate">{tour.title}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-sm">{tour.destination || '—'}</td>
                      <td className="px-4 py-4">
                        {tour.time ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            <i className="ri-time-line text-xs"></i>
                            {tour.time}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-slate-700 font-medium">
                          NL: {formatVND(tour.priceAdult || 0)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          TE: {formatVND(tour.priceChild || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          tour.status === 'active' ? 'bg-green-100 text-green-800' :
                          tour.status === 'hidden' ? 'bg-slate-100 text-slate-800' :
                          tour.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          tour.status === 'deleted' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800' // default active
                        }`}>
                          {tour.status === 'active' ? 'Hoạt động' :
                           tour.status === 'hidden' ? 'Ẩn' :
                           tour.status === 'paused' ? 'Tạm ngưng' :
                           tour.status === 'deleted' ? 'Đã xóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {/* Xem chi tiết (có bảng Lịch Khởi Hành) */}
                          <Link
                            href={`/admin/tours/${tour._id}`}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Xem chi tiết & Lịch khởi hành"
                          >
                            <i className="ri-calendar-line text-lg"></i>
                          </Link>

                          {/* Nút sửa template */}
                          <Link
                            href={`/admin/tours/edit/${tour._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Sửa tour template"
                          >
                            <i className="ri-pencil-line text-lg"></i>
                          </Link>

                          {/* Nút xóa */}
                          <button
                            onClick={() => setConfirmDialog({
                              isOpen: true,
                              title: "Xóa tour template",
                              message: `Xóa tour "${tour.title}"? Hành động này không thể hoàn tác.`,
                              action: () => deleteMutation.mutate(tour._id),
                              type: "danger"
                            })}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Xóa tour"
                          >
                            <i className="ri-delete-bin-6-line text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-xl shadow-sm p-4 gap-3">
            <p className="text-slate-600 text-sm">
              Tổng: <span className="font-bold text-slate-900">{total}</span> tours &nbsp;|&nbsp; Trang{' '}
              <span className="font-bold text-orange-600">{page}</span> / <span className="font-bold">{totalPages}</span>
            </p>

            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                ← Trước
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-2 rounded-lg transition text-sm font-medium ${
                    page === i + 1
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                Sau →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
        type={confirmDialog.type}
        onConfirm={() => {
          confirmDialog.action();
        }}
        onCancel={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
      />
    </div>
  )
}

export default Page
