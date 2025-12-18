"use client";

import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { blogApi } from "@/lib/blog/blogApi";
import { MessageCircle, Trash2, MoreHorizontal, Clock } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "#/stores/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface CommentsListProps {
  slug: string;
  refresh?: boolean;
}

interface CommentWithUserCache {
  [userId: string]: {
    fullName: string;
    avatar?: string;
  };
}

export interface CommentsListHandle {
  handleCommentAdded: (data: {
    userId: string;
    fullName: string;
    avatar?: string;
  }) => void;
}

const CommentsList = forwardRef<CommentsListHandle, CommentsListProps>(
  ({ slug, refresh }, ref) => {
    const [comments, setComments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // lấy cả user và userId trong store
    const { user, userId } = useAuthStore();
    const userCacheRef = useRef<CommentWithUserCache>({});

    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const response = await blogApi.getComments(slug);

        let commentsData = response.comments || [];

        // id hiện tại của user đang đăng nhập
        const currentUserId =
          (user as any)?.id || (user as any)?._id || userId || undefined;

        commentsData = commentsData.map((c: any) => {
          const cached = userCacheRef.current[c.userId];

          let userName = c.userName;
          let userAvatar = c.userAvatar;

          // 1. Nếu đã cache user info (từ lúc user vừa comment), ưu tiên dùng
          if (cached) {
            userName = cached.fullName || userName;
            userAvatar = cached.avatar || userAvatar;
          }
          // 2. Nếu là comment của current user -> dùng profile trong store
          else if (
            user &&
            (c.isOwner ||
              (currentUserId &&
                c.userId &&
                String(c.userId) === String(currentUserId)))
          ) {
            userName =
              (user as any).fullName ||
              (user as any).username ||
              (user as any).email ||
              userName;
            userAvatar =
              (user as any).avatar || (user as any).avatarUrl || userAvatar;
          }

          return {
            ...c,
            userName: userName || "Người dùng",
            userAvatar: userAvatar || "",
          };
        });

        setComments(commentsData);
      } catch (error) {
        console.error("Fetch comments error:", error);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Hàm được gọi từ ngoài khi vừa comment xong
    const handleCommentAdded = (commentData: {
      userId: string;
      fullName: string;
      avatar?: string;
    }) => {
      if (!commentData.userId) return;

      // cache user info
      userCacheRef.current[commentData.userId] = {
        fullName: commentData.fullName,
        avatar: commentData.avatar,
      };

      // refetch để lấy comment mới
      fetchComments();
    };

    // expose handleCommentAdded ra ngoài qua ref
    useImperativeHandle(ref, () => ({
      handleCommentAdded,
    }));

    useEffect(() => {
      fetchComments();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, refresh, (user as any)?.id, userId]);

    // fallback: lắng nghe event window
    useEffect(() => {
      const handleCommentAddedEvent = (event: any) => {
        if (event.detail?.slug === slug) {
          if (event.detail?.userId && event.detail?.fullName) {
            userCacheRef.current[event.detail.userId] = {
              fullName: event.detail.fullName,
              avatar: event.detail.avatar,
            };
          }
          fetchComments();
        }
      };

      window.addEventListener("commentAdded", handleCommentAddedEvent);
      return () =>
        window.removeEventListener("commentAdded", handleCommentAddedEvent);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const handleDeleteComment = async (commentId: string) => {
      if (!confirm("Bạn chắc chắn muốn xóa bình luận này?")) return;

      try {
        await blogApi.deleteComment(slug, commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success("Xóa bình luận thành công!");
      } catch (error) {
        console.error("Delete comment error:", error);
        toast.error("Không thể xóa bình luận. Vui lòng thử lại.");
      }
    };

    // Format time ago
    const formatTimeAgo = (dateStr: string) => {
      if (!dateStr) return "Vừa xong";
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString("vi-VN");
    };

    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="h-12 w-12 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 rounded-lg bg-slate-200" />
                  <div className="h-3 w-full rounded-lg bg-slate-200" />
                  <div className="h-3 w-2/3 rounded-lg bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (comments.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-orange-500" />
          </div>
          <h4 className="font-bold text-slate-800 mb-1">Chưa có bình luận</h4>
          <p className="text-sm text-slate-500">
            Hãy là người đầu tiên chia sẻ cảm nhận của bạn!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment, index) => {
            const isOwner =
              comment.isOwner ||
              (user &&
                comment.userId &&
                String(comment.userId) ===
                  String(
                    (user as any).id || (user as any)._id || userId || ""
                  ));

            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative rounded-2xl border p-5 transition-all hover:shadow-md ${
                  isOwner
                    ? "border-orange-200 bg-gradient-to-br from-orange-50/50 to-white"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {comment.userAvatar && comment.userAvatar.toString().trim() ? (
                      <Image
                        src={comment.userAvatar}
                        alt={comment.userName || "User"}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-bold text-white shadow-sm ring-2 ring-white">
                        {(comment.userName || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">
                            {comment.userName && comment.userName.trim()
                              ? comment.userName
                              : "Người dùng"}
                          </span>
                          {isOwner && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[10px] font-semibold text-orange-600 uppercase">
                              Bạn
                            </span>
                          )}
                        </div>

                        {/* Rating stars */}
                        {comment.rating && (
                          <div className="mt-1 flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < (comment.rating || 0)
                                    ? "text-amber-400"
                                    : "text-slate-200"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-1 text-xs text-slate-400">
                              ({comment.rating}/5)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Delete button - only for owner */}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Xóa bình luận"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Comment content */}
                    <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
                      {comment.content}
                    </p>

                    {/* Timestamp */}
                    <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      <span>{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }
);

CommentsList.displayName = "CommentsList";
export default CommentsList;
