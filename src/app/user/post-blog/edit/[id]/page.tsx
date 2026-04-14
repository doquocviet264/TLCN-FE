// /app/user/post-blog/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Pen,
  Send,
  ArrowLeft,
  ImagePlus,
  Type,
  Tag,
  Globe,
  Lock,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useUser from "@/hooks/useUser";
import { blogApi } from "@/lib/blog/blogApi";
import PostForm from "../../PostForm";
import CoverUpload from "../../CoverUpload";
import CategoryTagsForm from "../../CategoryTagsForm";
import PostPrivacySettings from "../../PostPrivacySettings";

export default function EditBlogPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: userLoading } = useUser();

  // Form state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [wardName, setWardName] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");

  // UI state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        setIsLoadingPost(true);
        const post = await blogApi.getOwnPostById(id);
        setTitle(post.title || "");
        setSummary(post.summary || "");
        
        let c = "";
        if (typeof post.content === "string") {
            c = post.content;
        } else if (Array.isArray(post.content)) {
            c = JSON.stringify(post.content);
        }
        setContent(c);
        
        setCoverPreview(post.coverImageUrl || post.cover || post.thumbnail || null);
        setCategories(post.categories || []);
        setTags(post.tags || []);
        setAddress(post.locationDetail || "");
        setProvinceName(post.province || "");
        setWardName(post.ward || "");
        setPrivacy((post.privacy as any) || "public");
      } catch (err) {
         toast.error("Không tải được dữ liệu bài viết");
         router.push("/user/profile?tab=posts");
      } finally {
         setIsLoadingPost(false);
      }
    };
    fetchPost();
  }, [id, router]);

  // Handle cover image
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleCoverChange = (file: File | null) => {
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Ảnh bìa không được vượt quá 5MB");
        return;
      }

      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverImage(null);
      setCoverPreview(null);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }

    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (summary.trim()) formData.append("summary", summary.trim());
      formData.append("content", content);
      formData.append("privacy", privacy);

      if (coverImage) {
        formData.append("cover", coverImage);
      }

      if (categories.length > 0) {
        formData.append("categories", JSON.stringify(categories));
      }

      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
      }

      // Thêm địa chỉ và vị trí nếu có
      if (address.trim()) {
        formData.append("locationDetail", address.trim());
      }

      if (provinceName) {
        formData.append("province", provinceName);
      }

      if (wardName) {
        formData.append("ward", wardName);
      }

      const result = await blogApi.updateBlog(id, formData);

      toast.success("Cập nhật bài viết thành công!");
      router.push("/user/profile?tab=posts");
    } catch (error: any) {
      console.error("Update blog error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        "Có lỗi khi cập nhật bài viết. Vui lòng thử lại.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (userLoading || isLoadingPost) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Pen className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Đăng nhập để viết bài
          </h2>
          <p className="text-slate-600 mb-6">
            Bạn cần đăng nhập để chia sẻ câu chuyện du lịch của mình với cộng
            đồng Travel AHH
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25"
          >
            Đăng nhập ngay
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 pb-16 pt-8">
        {/* Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Blobs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="absolute top-1/2 right-0 h-80 w-80 -translate-y-1/2 rounded-full bg-orange-500/15 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-4">
          {/* Back button */}
          <Link
            href="/user/blog"
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Quay lại Blog</span>
          </Link>

          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Pen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cập nhật bài viết</h1>
              <p className="text-blue-200 mt-1">
                Chỉnh sửa câu chuyện và kinh nghiệm du lịch của bạn
              </p>
            </div>
          </div>

          {/* User info */}
          <div className="mt-6 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 w-fit">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
              {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-white">
                {user.fullName || user.email}
              </p>
              <p className="text-xs text-blue-200">Tác giả</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 -mt-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Cover Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Ảnh bìa</h3>
                  <p className="text-xs text-slate-500">
                    Thêm ảnh bìa để bài viết nổi bật hơn
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <CoverUpload
                cover={coverPreview}
                onCoverChange={(file) => handleCoverChange(file)}
                onRemove={() => handleCoverChange(null)}
              />
            </div>
          </div>

          {/* Post Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Type className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Nội dung</h3>
                  <p className="text-xs text-slate-500">
                    Viết tiêu đề và nội dung bài viết
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <PostForm
                title={title}
                summary={summary}
                content={content}
                privacy={privacy}
                onTitleChange={setTitle}
                onSummaryChange={setSummary}
                onContentChange={setContent}
                onPrivacyClick={() => setShowPrivacyModal(true)}
              />
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Danh mục & Thẻ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Giúp bài viết dễ tìm kiếm hơn
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <CategoryTagsForm
                categories={categories}
                tags={tags}
                address={address}
                provinceCode={provinceCode}
                provinceName={provinceName}
                wardCode={wardCode}
                wardName={wardName}
                onCategoriesChange={setCategories}
                onTagsChange={setTags}
                onAddressChange={setAddress}
                onLocationChange={(pCode, pName, wCode, wName) => {
                  setProvinceCode(pCode);
                  setProvinceName(pName);
                  setWardCode(wCode);
                  setWardName(wName);
                }}
              />
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Privacy indicator */}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  {privacy === "public" ? (
                    <>
                      <Globe className="w-4 h-4 text-blue-200" />
                      <span className="text-sm text-blue-100">Công khai</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-blue-200" />
                      <span className="text-sm text-blue-100">Riêng tư</span>
                    </>
                  )}
                </button>

                <div className="text-blue-200 text-sm">
                  {title.trim() && content.trim() ? (
                    <span className="flex items-center gap-1 text-emerald-300">
                      <CheckCircle size={14} />
                      Sẵn sàng đăng bài
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertCircle size={14} />
                      Vui lòng điền đầy đủ thông tin
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đăng...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Cập nhật bài viết
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <PostPrivacySettings
          value={privacy}
          onChange={(p) => setPrivacy(p as "public" | "private")}
          onClose={() => setShowPrivacyModal(false)}
        />
      )}
    </main>
  );
}
