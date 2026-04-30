"use client";

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminBlogs, deleteBlog } from '@/lib/admin/adminBlogApi';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { updateBlogStatus } from '@/lib/admin/adminBlogApi';
import { ApprovalModal } from './ApprovalModal';

const Page = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    blogId: string;
    blogTitle: string;
  }>({ isOpen: false, blogId: '', blogTitle: '' })

  const [approvalState, setApprovalState] = useState<{
    isOpen: boolean;
    blogId: string;
    blogTitle: string;
    isSubmitting: boolean;
  }>({ isOpen: false, blogId: '', blogTitle: '', isSubmitting: false })

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminBlogs", page, statusFilter],
    queryFn: () => getAdminBlogs({ page, limit: 20, status: statusFilter as any || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogs'] })
      toast.success('Xóa bài viết thành công!')
      setConfirmDelete({ isOpen: false, blogId: '', blogTitle: '' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể xóa bài viết')
      setConfirmDelete({ isOpen: false, blogId: '', blogTitle: '' })
    }
  })

  const handleDelete = (id: string, title: string) => {
    setConfirmDelete({
      isOpen: true,
      blogId: id,
      blogTitle: title || 'bài viết này'
    })
  }

  const confirmDeleteAction = () => {
    if (confirmDelete.blogId) {
      deleteMutation.mutate(confirmDelete.blogId)
    }
  }

  const handleApproveAction = async () => {
    if (!approvalState.blogId) return;
    setApprovalState(prev => ({ ...prev, isSubmitting: true }));
    try {
       await updateBlogStatus(approvalState.blogId, { status: "published" });
       queryClient.invalidateQueries({ queryKey: ['adminBlogs'] });
       toast.success('Bài viết đã được xuất bản công khai!');
       setApprovalState({ isOpen: false, blogId: '', blogTitle: '', isSubmitting: false });
    } catch (error: any) {
       toast.error(error.response?.data?.message || 'Không thể phê duyệt bài viết');
       setApprovalState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleRejectAction = async (reason: string) => {
    if (!approvalState.blogId) return;
    setApprovalState(prev => ({ ...prev, isSubmitting: true }));
    try {
       await updateBlogStatus(approvalState.blogId, { status: "rejected", rejectReason: reason });
       queryClient.invalidateQueries({ queryKey: ['adminBlogs'] });
       toast.success('Bài viết đã bị từ chối!');
       setApprovalState({ isOpen: false, blogId: '', blogTitle: '', isSubmitting: false });
    } catch (error: any) {
       toast.error(error.response?.data?.message || 'Không thể từ chối bài viết');
       setApprovalState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const filteredData = data?.data?.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (blog.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  ) || []

  const formatDate = (dateString: string) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const totalPages = Math.ceil((data?.total || 0) / 20) || 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Quản Lý Blog
            </h1>
            <p className="text-slate-600">Điều phối và biên tập nội dung blog hệ thống</p>
          </div>
          <Link
            href="/admin/blog/create"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition font-semibold shadow-lg shadow-orange-500/25"
          >
            + Viết bài mới
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm tiêu đề, tóm tắt..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-700"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="rejected">Bị từ chối</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-medium">Không thể tải dữ liệu blog</p>
          <p className="text-red-600 text-sm mt-2">{(error as any).message}</p>
        </div>
      ) : !filteredData || filteredData.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Chưa có bài viết nào</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Thiết kế & Tác giả</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Tóm tắt</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Ngày tạo</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((blog, index) => (
                    <tr
                      key={blog._id}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {blog.coverImageUrl ? (
                            <img
                              src={blog.coverImageUrl}
                              alt="cover"
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                               <span className="text-xs">ẢNH</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <Link href={`/admin/blog/${blog._id}`} className="font-bold text-slate-900 hover:text-orange-600 transition block truncate mb-1">
                              {blog.title}
                            </Link>
                            <div className="flex items-center gap-1.5">
                               <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                                 {blog.authorModel === 'User' ? 'Người dùng' : 'Admin'}
                               </span>
                               <span className="text-xs text-slate-500 truncate">
                                 {(blog.authorId as any)?.fullName || (blog.authorId as any)?.email}
                               </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 align-top max-w-[200px]">
                        <span className="line-clamp-2">{blog.summary || "—"}</span>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              blog.status === "published"
                                ? "bg-emerald-100 text-emerald-800"
                                : blog.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : blog.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : blog.status === "draft"
                                ? "bg-slate-200 text-slate-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {blog.status === "published" ? "Đã xuất bản" :
                             blog.status === "pending" ? "Chờ duyệt" :
                             blog.status === "rejected" ? "Từ chối" :
                             blog.status === "draft" ? "Nháp" : "Lưu trữ"}
                          </span>
                          <span className="text-xs text-slate-500 pl-1">
                             {blog.privacy === "private" ? "Riêng tư" : "Công khai"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs align-top">
                        {formatDate(blog.createdAt || "")}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-2 justify-center items-center">
                          {blog.status === 'pending' && blog.authorModel === 'User' && (
                             <button
                               onClick={() => setApprovalState({ isOpen: true, blogTitle: blog.title, blogId: blog._id! || '', isSubmitting: false })}
                               title="Kiểm duyệt"
                               className="p-1.5 text-amber-500 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition"
                             >
                                <i className="ri-shield-check-line text-lg"></i>
                             </button>
                          )}
                          <Link
                            href={`/admin/blog/${blog._id}`}
                            title="Sửa"
                            className="p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                          >
                            <i className="ri-pencil-line text-lg"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(blog._id!, blog.title)}
                            disabled={deleteMutation.isPending}
                            title="Xóa"
                            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition disabled:opacity-50"
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

          {/* Footer Info & Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-lg shadow-md p-4">
            <p className="text-slate-600 mb-4 md:mb-0">
              Tổng cộng: <span className="font-bold text-slate-900">{data?.total}</span> Blog | Trang{" "}
              <span className="font-bold text-orange-600">{page}</span> of{" "}
              <span className="font-bold">{totalPages}</span>
            </p>

            {/* Pagination Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Trước
              </button>

              {/* Page Numbers */}
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-2 rounded-lg transition ${
                    page === i + 1
                      ? "bg-orange-500 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Sau →
              </button>
            </div>
          </div>
        </>
      )}
      
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa "${confirmDelete.blogTitle}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false, blogId: '', blogTitle: '' })}
      />

      <ApprovalModal 
        isOpen={approvalState.isOpen}
        blogTitle={approvalState.blogTitle}
        isSubmitting={approvalState.isSubmitting}
        onClose={() => setApprovalState(prev => ({ ...prev, isOpen: false }))}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
      />
    </div>
  )
}

export default Page