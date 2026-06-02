"use client";

import React, { useState } from 'react'
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminReviews, deleteAdminReview, updateAdminReview } from '@/lib/admin/adminReviewApi';
import { Toast, useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReviewTable } from './ReviewTable';
import AdminPagination from '@/components/admin/AdminPagination';

const Page = () => {
  const queryClient = useQueryClient()
  const { toast, showSuccess, showError, hideToast } = useToast()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; reviewId: string; userName: string }>({
    isOpen: false,
    reviewId: '',
    userName: ''
  })
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    reviewId: string
    rating: number
    comment: string
  }>({ isOpen: false, reviewId: '', rating: 5, comment: '' })

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminReviews", page, searchTerm, startDate, endDate],
    queryFn: () => getAdminReviews({
      page,
      limit: 20,
      search: searchTerm || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteAdminReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] })
      showSuccess('Xóa bình luận thành công!')
      setConfirmDelete({ isOpen: false, reviewId: '', userName: '' })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Không thể xóa bình luận')
      setConfirmDelete({ isOpen: false, reviewId: '', userName: '' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { reviewId: string; rating: number; comment: string }) =>
      updateAdminReview(data.reviewId, { rating: data.rating, comment: data.comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] })
      showSuccess('Cập nhật bình luận thành công!')
      setEditModal({ isOpen: false, reviewId: '', rating: 5, comment: '' })
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Không thể cập nhật bình luận')
    }
  })

  const handleDelete = (reviewId: string, userName: string) => {
    setConfirmDelete({ isOpen: true, reviewId, userName })
  }

  const confirmDeleteAction = () => {
    if (confirmDelete.reviewId) {
      deleteMutation.mutate(confirmDelete.reviewId)
    }
  }

  const handleEdit = (reviewId: string, rating: number, comment: string) => {
    setEditModal({ isOpen: true, reviewId, rating, comment })
  }

  const handleUpdateSubmit = () => {
    if (editModal.rating < 1 || editModal.rating > 5) {
      showError('Rating phải từ 1 đến 5')
      return
    }
    updateMutation.mutate({
      reviewId: editModal.reviewId,
      rating: editModal.rating,
      comment: editModal.comment
    })
  }

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Lỗi khi tải dữ liệu bình luận</p>
        <p className="text-red-600 text-sm mt-2">{(error as any).message}</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Quản Lý Bình Luận & Đánh Giá
        </h1>
        <p className="text-slate-600">Quản lý các bình luận và đánh giá từ khách hàng</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Tìm kiếm</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="ri-search-line"></i>
              </span>
              <input
                type="text"
                placeholder="Tên khách hàng, nội dung đánh giá..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm bg-slate-50 transition outline-none"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Từ ngày</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <i className="ri-calendar-line text-lg"></i>
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm bg-slate-50 transition outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Đến ngày</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <i className="ri-calendar-check-line text-lg"></i>
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm bg-slate-50 transition outline-none"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <i className="ri-search-line"></i>
              Tìm kiếm
            </button>
          </div>
        </div>
        
        {(searchTerm || startDate || endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setStartDate('')
                setEndDate('')
                setPage(1)
              }}
              className="text-xs text-slate-400 hover:text-emerald-600 transition flex items-center gap-1.5"
            >
              <i className="ri-refresh-line"></i> Làm mới bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {!data?.data || data.data.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Không tìm thấy bình luận nào</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <ReviewTable
              data={data?.data ?? []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          </div>

          <AdminPagination 
            currentPage={page}
            totalPages={Math.ceil((data?.total || 0) / 20)}
            onPageChange={setPage}
            totalItems={data?.total}
            itemsLabel="bình luận"
            activeColor="emerald"
          />
        </>
      )}

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa bình luận từ ${confirmDelete.userName} không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false, reviewId: '', userName: '' })}
      />

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 transition-opacity" />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Chỉnh sửa bình luận</h3>

            <div className="space-y-4">
              {/* Rating */}
              <div>
                <label className="mb-2 block font-semibold text-slate-900">Đánh giá (1-5 sao)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setEditModal({ ...editModal, rating: star })}
                      className="text-2xl transition"
                    >
                      <i className={`ri-star-${star <= editModal.rating ? 'fill' : 'line'} ${
                        star <= editModal.rating ? 'text-yellow-400' : 'text-slate-300'
                      }`}></i>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="mb-2 block font-semibold text-slate-900">Bình luận</label>
                <textarea
                  value={editModal.comment}
                  onChange={(e) => setEditModal({ ...editModal, comment: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Nhập bình luận"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditModal({ isOpen: false, reviewId: '', rating: 5, comment: '' })}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateSubmit}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Đang xử lý...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Page
