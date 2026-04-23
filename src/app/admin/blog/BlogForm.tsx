'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BlogPost } from '@/types/blog'
import { createBlog, updateBlog } from '@/lib/admin/adminBlogApi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

interface BlogFormProps {
  initialData?: BlogPost
  isEditing?: boolean
}

export function BlogForm({ initialData, isEditing = false }: BlogFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    content: initialData?.content || '',
    tags: (initialData?.tags || []).join(', '),
    coverImageUrl: initialData?.coverImageUrl || '',
    status: (initialData?.status as 'draft' | 'published' | 'archived') || 'draft'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("📝 Creating blog:", data.title);
      return createBlog(data);
    },
    onSuccess: (result) => {
      console.log("✅ Blog created successfully:", result.post?._id);
      toast.success('Tạo bài viết thành công!')
      queryClient.invalidateQueries({ queryKey: ['adminBlogs'] })
      setTimeout(() => router.push('/admin/blog'), 1500)
    },
    onError: (error: any) => {
      console.error("❌ Create blog failed:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Lỗi khi tạo bài viết')
      setErrors({ submit: error.response?.data?.message || error.message })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("📝 Updating blog:", initialData!._id, data.title);
      return updateBlog(initialData!._id, data);
    },
    onSuccess: (result) => {
      console.log("✅ Blog updated successfully:", result.post?._id);
      toast.success('Cập nhật bài viết thành công!')
      queryClient.invalidateQueries({ queryKey: ['adminBlogs'] })
      queryClient.invalidateQueries({ queryKey: ['adminBlog', initialData!._id] })
      setTimeout(() => router.push('/admin/blog'), 1500)
    },
    onError: (error: any) => {
      console.error("❌ Update blog failed:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật bài viết')
      setErrors({ submit: error.response?.data?.message || error.message })
    }
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc'
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung là bắt buộc'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        tags: formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0),
        coverImageUrl: formData.coverImageUrl.trim(),
        status: formData.status
      }

      if (isEditing) {
        await updateMutation.mutateAsync(submitData)
      } else {
        await createMutation.mutateAsync(submitData)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/blog')
  }

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            {isEditing ? 'Cập Nhật Bài Viết' : 'Tạo Bài Viết Mới'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            {isEditing ? 'Chỉnh sửa nội dung blog' : 'Bắt đầu soạn thảo blog mới'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          ← Trở về danh sách
        </button>
      </div>

      {/* Form Container */}
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Content Column */}
          <div className="flex-1 space-y-6">
             {errors.submit && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                <p className="font-medium">Lỗi khi lưu bài viết</p>
                <p className="text-sm mt-1">{errors.submit}</p>
              </div>
             )}

             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-10 min-h-[600px]">
               <div className="space-y-8">
                  {/* Title (Huge, borderless) */}
                  <div>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Nhập tiêu đề bài viết..."
                      className="w-full text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight placeholder-slate-300 focus:outline-none bg-transparent"
                    />
                    {errors.title && <p className="mt-2 text-sm text-red-500 font-medium">*{errors.title}</p>}
                  </div>

                  {/* Summary */}
                  <div>
                    <textarea
                      name="summary"
                      value={formData.summary}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Tóm tắt ngắn gọn nội dung (không bắt buộc)..."
                      className="w-full text-lg md:text-xl text-slate-500 placeholder-slate-300 focus:outline-none bg-transparent resize-none leading-relaxed"
                    />
                  </div>

                  {/* Divider */}
                  <div className="h-px w-16 bg-slate-200"></div>

                  {/* Content */}
                  <div>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Bắt đầu viết nội dung ở đây..."
                      rows={15}
                      className="w-full text-base md:text-lg text-slate-800 focus:outline-none bg-transparent font-serif leading-loose resize-y min-h-[400px]"
                    />
                    {errors.content && <p className="mt-2 text-sm text-red-500 font-medium">*{errors.content}</p>}
                  </div>
               </div>
             </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:w-80 xl:w-96 space-y-6">
             <div className="sticky top-6 space-y-6">
               
               {/* Action Buttons */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-slate-900 px-6 py-3.5 font-bold text-white shadow hover:bg-slate-800 hover:shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      'Đang lưu...' 
                    ) : isEditing ? (
                      <>Lưu Thay Đổi</>
                    ) : (
                      <>Đăng Bài Viết</>
                    )}
                  </button>
               </div>

               {/* Meta info & Setting */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">Thông tin thiết lập</h3>
                 
                 <div className="space-y-6">
                    {/* Status */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                         Trạng Thái
                      </label>
                      <div className="relative">
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border-0 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 appearance-none cursor-pointer transition select-none"
                        >
                          <option value="draft">Bản nháp</option>
                          <option value="published">Xuất bản ngay</option>
                          <option value="archived">Lưu trữ lại</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <span className="text-xs font-bold">▼</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                         Từ Khóa
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="Thêm từ khóa, cách nhau bởi dấu phẩy..."
                        className="w-full px-4 py-2.5 border-0 bg-slate-50 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 transition"
                      />
                    </div>
                 </div>
               </div>

               {/* Cover Image */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">Ảnh Bìa Blog</h3>
                 <div className="space-y-4">
                    <input
                      type="text"
                      name="coverImageUrl"
                      value={formData.coverImageUrl}
                      onChange={handleInputChange}
                      placeholder="Dán URL ảnh vào đây..."
                      className="w-full px-4 py-2.5 border-0 bg-slate-50 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-slate-700 transition text-sm text-center"
                    />
                    
                    {formData.coverImageUrl ? (
                      <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-[4/3] flex items-center justify-center relative group shadow-sm">
                        <img
                          src={formData.coverImageUrl}
                          alt="preview"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 aspect-[4/3] flex flex-col items-center justify-center text-slate-400 transition hover:bg-slate-50 hover:border-slate-300">
                        <span className="text-sm font-semibold">Chưa có ảnh bìa</span>
                        <span className="text-xs text-slate-400 mt-1">Dán URL ảnh phía trên</span>
                      </div>
                    )}
                 </div>
               </div>

             </div>
          </div>
        </form>
      </div>
    </div>
  )
}
