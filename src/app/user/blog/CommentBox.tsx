"use client";

import React, { useState } from "react";
import { useAuthStore } from "#/stores/auth";
import { blogApi } from "@/lib/blog/blogApi";
import { toast } from "react-hot-toast";
import { Send, Star, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface CommentBoxProps {
  slug: string;
  onCommentAdded?: (commentData: {
    userId: string;
    fullName: string;
    avatar?: string;
  }) => void;
}

const CommentBox = ({ slug, onCommentAdded }: CommentBoxProps) => {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    if (!content.trim()) {
      toast.error("Vui lòng nhập bình luận");
      return;
    }

    setIsSubmitting(true);
    try {
      await blogApi.createComment(slug, { content: content.trim(), rating });
      setContent("");
      setRating(5);
      toast.success("Bình luận thành công!");

      // Callback với user info
      onCommentAdded?.({
        userId: user.id,
        fullName: user.fullName || user.email || "Bạn",
        avatar: (user as any)?.avatar,
      });
    } catch (error: any) {
      console.error("Comment error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        "Có lỗi khi gửi bình luận. Vui lòng thử lại.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) {
        handleSubmit();
      }
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <LogIn className="h-7 w-7 text-orange-500" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h4 className="font-bold text-slate-800 mb-1">
              Đăng nhập để bình luận
            </h4>
            <p className="text-sm text-slate-600">
              Chia sẻ cảm nhận và kinh nghiệm của bạn với cộng đồng du lịch
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25"
          >
            <LogIn size={16} />
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        {/* User Avatar */}
        <div className="flex-shrink-0 hidden sm:block">
          {(user as any)?.avatar ? (
            <Image
              src={(user as any).avatar}
              alt={user.fullName || "User"}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-orange-100"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-bold text-white ring-2 ring-orange-100">
              {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Comment Form */}
        <div className="flex-1 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">
              {user.fullName || user.email}
            </span>
            <span className="text-xs text-slate-400">đang viết bình luận...</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Đánh giá:</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoverRating(i + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={isSubmitting}
                  className="text-2xl transition-transform hover:scale-110 disabled:opacity-50"
                  title={`${i + 1} sao`}
                >
                  <span
                    className={`transition-colors ${
                      i < (hoverRating || rating)
                        ? "text-amber-400"
                        : "text-slate-200"
                    }`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">
              {rating === 1 && "Tệ"}
              {rating === 2 && "Không hài lòng"}
              {rating === 3 && "Bình thường"}
              {rating === 4 && "Hài lòng"}
              {rating === 5 && "Tuyệt vời"}
            </span>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Chia sẻ cảm nhận của bạn về bài viết này..."
              disabled={isSubmitting}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white disabled:opacity-50 transition-all"
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-400">
              {content.length}/500
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Nhấn Enter để gửi, Shift+Enter để xuống dòng
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Gửi bình luận
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentBox;
