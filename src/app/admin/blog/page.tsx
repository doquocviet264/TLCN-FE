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
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
            Quản Lý Blog
          </h1>
          <p className="text-slate-500 font-medium text-sm">Điều phối và biên tập nội dung blog hệ thống</p>
        </div>
        <Link
          href="/admin/blog/create"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow hover:shadow-md"
        >
          + Viết bài mới
        </Link>
      </div>

      {/* Unified Tooling Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 mb-6 flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Tìm kiếm tiêu đề, tóm tắt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-transparent border-0 focus:ring-0 text-slate-700 placeholder-slate-400 font-medium"
          />
        </div>
        
        <div className="w-px bg-slate-100 hidden md:block mx-1"></div>
        
        <div className="md:w-56 relative flex items-center">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="w-full px-4 py-2.5 bg-slate-50/50 md:bg-transparent rounded-xl border-0 focus:ring-0 text-slate-600 font-semibold appearance-none cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="draft">Bản nháp</option>
            <option value="published">Đã xuất bản</option>
            <option value="rejected">Bị từ chối</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
          <span className="absolute right-4 pointer-events-none text-slate-400 text-xs font-bold">▼</span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-red-800 font-semibold">Không thể tải dữ liệu blog</p>
          <p className="text-red-500 text-sm mt-1">{(error as any).message}</p>
        </div>
      ) : !filteredData || filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-2xl text-slate-300">📝</span>
          </div>
          <h3 className="text-slate-700 font-bold mb-1">Chưa có bài viết nào</h3>
          <p className="text-slate-500 text-sm font-medium">Bắt đầu bằng cách tạo một Blog mới</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-2xl w-1/3">Thiết kế & Tác giả</th>
                    <th className="px-6 py-4">Tóm tắt</th>
                    <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4 text-center rounded-tr-2xl">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((blog) => (
                    <tr
                      key={blog._id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-4">
                          {blog.coverImageUrl ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0 group-hover:shadow-md transition">
                              <img
                                src={blog.coverImageUrl}
                                alt="cover"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-300">
                               <span className="text-xl font-light">ẢNH</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pt-1">
                            <Link href={`/admin/blog/${blog._id}`} className="font-bold text-slate-900 group-hover:text-blue-600 transition block truncate mb-1 text-base">
                              {blog.title}
                            </Link>
                            <div className="flex items-center gap-1.5">
                               <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                 {blog.authorModel === 'User' ? 'Người dùng' : 'Quản trị viên'}
                               </span>
                               <span className="text-xs text-slate-500 truncate font-medium">
                                 {(blog.authorId as any)?.fullName || (blog.authorId as any)?.email}
                               </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-500 font-medium align-top max-w-[200px]">
                        <span className="line-clamp-2 leading-relaxed">{blog.summary || "—"}</span>
                      </td>
                      <td className="px-6 py-5 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-2 items-start pt-1">
                          {/* Status Pill */}
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase inline-flex items-center gap-1.5 ${
                              blog.status === "published"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : blog.status === "pending"
                                ? "bg-amber-500/10 text-amber-600"
                                : blog.status === "rejected"
                                ? "bg-red-500/10 text-red-600"
                                : blog.status === "draft"
                                ? "bg-slate-500/10 text-slate-600"
                                : "bg-blue-500/10 text-blue-600"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              blog.status === "published" ? "bg-emerald-500" :
                              blog.status === "pending" ? "bg-amber-500" :
                              blog.status === "rejected" ? "bg-red-500" :
                              blog.status === "draft" ? "bg-slate-400" : "bg-blue-400"
                            }`}></span>
                            
                            {blog.status === "published" ? "Đã xuất bản" :
                             blog.status === "pending" ? "Chờ duyệt" :
                             blog.status === "rejected" ? "Từ chối" :
                             blog.status === "draft" ? "Nháp" : "Lưu trữ"}
                          </span>

                          <span className="text-xs font-semibold text-slate-400 pl-1">
                             {blog.privacy === "private" ? "Riêng tư" : "Công khai"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-400 text-xs font-medium align-top pt-6">
                        {formatDate(blog.createdAt || "")}
                      </td>
                      <td className="px-6 py-5 align-top pt-5">
                        <div className="flex flex-nowrap gap-1 justify-center opacity-70 group-hover:opacity-100 transition">
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
                            title="Chỉnh sửa chi tiết"
                            className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition"
                          >
                            <i className="ri-pencil-line text-lg"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(blog._id!, blog.title)}
                            disabled={deleteMutation.isPending}
                            title="Xóa vĩnh viễn"
                            className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition disabled:opacity-50"
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
          <div className="flex flex-col md:flex-row items-center justify-between text-sm">
            <p className="text-slate-500 font-medium mb-4 md:mb-0">
              Tìm thấy <span className="font-bold text-slate-800">{data?.total}</span> Blog | Trang{" "}
              <span className="font-bold text-slate-800">{page}</span> /{" "}
              <span>{totalPages}</span>
            </p>

            {/* Pagination Controls */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 disabled:opacity-30 transition"
              >
                ‹
              </button>

              {/* Page Numbers */}
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold transition ${
                    page === i + 1
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-200/50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 disabled:opacity-30 transition"
              >
                ›
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