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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    type?: "danger" | "warning";
  }>({ isOpen: false, title: '', message: '', action: () => {}, type: 'warning' })

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminTours", page, searchTerm],
    queryFn: () => getAllToursAdmin({
      page,
      limit: 20,
      search: searchTerm || undefined,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (tourId: string) => deleteTourAdmin(tourId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTours'] })
      showSuccess('Xóa tour template thành công!')
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
        <div className="grid grid-cols-1 gap-4">
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Tour Template</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Điểm đến</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Giá cơ sở</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tours.map((tour: any) => (
                    <tr key={tour._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-slate-900 clamp-1">{tour.title}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{tour.destination || '—'}</td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-slate-700 font-medium">
                          NL: {formatVND(tour.priceAdult || 0)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          TE: {formatVND(tour.priceChild || 0)}
                        </div>
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
