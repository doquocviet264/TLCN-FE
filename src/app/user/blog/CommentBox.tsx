"use client";

import React, { useState } from "react";
import { useAuthStore } from "#/stores/auth";
import { blogApi } from "@/lib/blog/blogApi";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";

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

  if (!user) {
    return (
      <div className="pt-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm text-amber-800">
            <a href="/auth/login" className="font-semibold hover:underline">
              Đăng nhập
            </a>{" "}
            để bình luận
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì!"
            disabled={isSubmitting}
            className="w-full h-[60px] p-4 shadow-lg resize-none text-sm focus:outline-none bg-white rounded-lg disabled:opacity-50"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  disabled={isSubmitting}
                  className="text-lg transition-colors disabled:opacity-50"
                  title={`${i + 1} sao`}
                >
                  <span
                    className={
                      i < rating ? "text-yellow-400" : "text-slate-300"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              variant="primary"
              className="rounded-full px-4 py-1 text-sm focus:outline-none"
            >
              {isSubmitting ? "Đang gửi..." : "Bình luận"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentBox;
