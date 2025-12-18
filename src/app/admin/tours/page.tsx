"use client";

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllToursAdmin, deleteTourAdmin, updateTourStatusAdmin } from '@/lib/admin/adminApi';
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
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    type?: "danger" | "warning";
  }>({ isOpen: false, title: '', message: '', action: () => {}, type: 'warning' })

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminTours", page, searchTerm, statusFilter],
    queryFn: () => getAllToursAdmin({
      page,
      limit: 20,
      search: searchTerm || undefined,
      status: statusFilter || undefined
    }),
  })

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

  // Mutation cập nhật trạng thái tour
  const statusMutation = useMutation({
    mutationFn: ({ tourId, status }: { tourId: string; status: "pending" | "confirmed" | "in_progress" | "completed" | "closed" }) =>
      updateTourStatusAdmin(tourId, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['adminTours'] })
      const messages: Record<string, string> = {
        confirmed: 'Tour đã được xác nhận khởi hành!',
        closed: 'Tour đã được đóng!',
        pending: 'Tour đã chuyển về trạng thái chờ duyệt!',
        in_progress: 'Tour đã bắt đầu!',
        completed: 'Tour đã hoàn thành!',
      }
      showSuccess(messages[status] || 'Cập nhật trạng thái thành công!')
      setConfirmDialog(d => ({ ...d, isOpen: false }))
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Không thể cập nhật trạng thái')
      setConfirmDialog(d => ({ ...d, isOpen: false }))
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800"
      case "in_progress": return "bg-blue-100 text-blue-800"
      case "completed": return "bg-gray-100 text-gray-800"
      case "closed": return "bg-red-100 text-red-800"
      default: return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Chờ duyệt"
      case "confirmed": return "Đã duyệt"
      case "in_progress": return "Đang diễn ra"
      case "completed": return "Hoàn thành"
      case "closed": return "Đóng"
      default: return status
    }
  }

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
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Input */}
          <div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên tour, điểm đến..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="confirmed">Đã duyệt</option>
              <option value="in_progress">Đang diễn ra</option>
              <option value="completed">Hoàn thành</option>
              <option value="closed">Đóng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <p className="text-slate-600">
          Tổng cộng: <span className="font-bold text-slate-900">{total}</span> tours
        </p>
      </div>

      {/* Tours Table */}
      {!tours || tours.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Không tìm thấy tour nào</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Tour</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Điểm đến</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Thời gian</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Giá</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Số khách</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tours.map((tour: any) => (
                    <tr key={tour._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-slate-900 clamp-1">{tour.title}</div>
                          {tour.time && (
                            <div className="text-xs text-slate-500 mt-1">{tour.time}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{tour.destination || '—'}</td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-slate-700">
                          {tour.startDate
                            ? new Date(tour.startDate).toLocaleDateString("vi-VN")
                            : "—"}
                        </div>
                        {tour.endDate && (
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(tour.endDate).toLocaleDateString("vi-VN")}
                          </div>
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
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tour.status)}`}>
                          {getStatusText(tour.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-slate-700">
                          <span className="font-medium">{tour.current_guests || 0}</span>
                          <span className="text-slate-400">/{tour.quantity || 0}</span>
                        </div>
                        {tour.min_guests && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Min: {tour.min_guests}
                            {(tour.current_guests || 0) >= tour.min_guests && (
                              <span className="text-green-600 ml-1">✓</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {/* Nút xem chi tiết/sửa */}
                          <Link
                            href={`/admin/tours/edit/${tour._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Xem/Sửa"
                          >
                            <i className="ri-pencil-line text-lg"></i>
                          </Link>

                          {/* Nút xác nhận tour - chỉ hiện khi pending và đủ khách */}
                          {tour.status === "pending" && (
                            <button
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                title: "Xác nhận khởi hành tour",
                                message: `Xác nhận tour "${tour.title}" sẽ khởi hành? Hiện có ${tour.current_guests || 0}/${tour.min_guests || 0} khách.`,
                                action: () => statusMutation.mutate({ tourId: tour._id, status: "confirmed" }),
                                type: "warning"
                              })}
                              disabled={statusMutation.isPending}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                              title="Xác nhận khởi hành"
                            >
                              <i className="ri-check-double-line text-lg"></i>
                            </button>
                          )}

                          {/* Nút bắt đầu tour - chỉ hiện khi confirmed */}
                          {tour.status === "confirmed" && (
                            <button
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                title: "Bắt đầu tour",
                                message: `Tour "${tour.title}" bắt đầu khởi hành?`,
                                action: () => statusMutation.mutate({ tourId: tour._id, status: "in_progress" }),
                                type: "warning"
                              })}
                              disabled={statusMutation.isPending}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                              title="Bắt đầu tour"
                            >
                              <i className="ri-play-circle-line text-lg"></i>
                            </button>
                          )}

                          {/* Nút hoàn thành tour - chỉ hiện khi in_progress */}
                          {tour.status === "in_progress" && (
                            <button
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                title: "Hoàn thành tour",
                                message: `Tour "${tour.title}" đã hoàn thành?`,
                                action: () => statusMutation.mutate({ tourId: tour._id, status: "completed" }),
                                type: "warning"
                              })}
                              disabled={statusMutation.isPending}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                              title="Hoàn thành tour"
                            >
                              <i className="ri-checkbox-circle-line text-lg"></i>
                            </button>
                          )}

                          {/* Nút đóng tour - hiện khi pending hoặc completed */}
                          {(tour.status === "pending" || tour.status === "completed") && (
                            <button
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                title: "Đóng tour",
                                message: `Đóng tour "${tour.title}"? Tour sẽ không còn nhận đặt chỗ.`,
                                action: () => statusMutation.mutate({ tourId: tour._id, status: "closed" }),
                                type: "danger"
                              })}
                              disabled={statusMutation.isPending}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition disabled:opacity-50"
                              title="Đóng tour"
                            >
                              <i className="ri-close-circle-line text-lg"></i>
                            </button>
                          )}

                          {/* Nút xóa */}
                          <button
                            onClick={() => setConfirmDialog({
                              isOpen: true,
                              title: "Xóa tour",
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
          <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-lg shadow-md p-4">
            <p className="text-slate-600 mb-4 md:mb-0">
              Tổng cộng: <span className="font-bold text-slate-900">{total}</span> tours | Trang{' '}
              <span className="font-bold text-orange-600">{page}</span> of{' '}
              <span className="font-bold">{Math.ceil(total / 20)}</span>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Trước
              </button>

              {[...Array(Math.ceil(total / 20))].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-2 rounded-lg transition ${
                    page === i + 1
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(Math.ceil(total / 20), p + 1))}
                disabled={page >= Math.ceil(total / 20)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
