"use client";

import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { blogApi } from "@/lib/blog/blogApi";
import { MessageCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "#/stores/auth";
import { toast } from "react-hot-toast";

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
        console.log("Comments response (normalized):", response);

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
      console.log("Comment added with user data:", commentData);

      if (!commentData.userId) return;

      // cache user info
      userCacheRef.current[commentData.userId] = {
        fullName: commentData.fullName,
        avatar: commentData.avatar,
      };
      console.log("Updated user cache:", userCacheRef.current);

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
    }, [slug, refresh, (user as any)?.id, userId]); // khi user load xong hoặc đổi thì refetch

    // fallback: lắng nghe event window (nếu bạn vẫn dispatch custom event ở nơi khác)
    useEffect(() => {
      const handleCommentAddedEvent = (event: any) => {
        if (event.detail?.slug === slug) {
          console.log("Comment added detected:", event.detail);
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

    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (comments.length === 0) {
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <MessageCircle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-600">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {comment.userAvatar && comment.userAvatar.toString().trim() ? (
                <Image
                  src={comment.userAvatar}
                  alt={comment.userName || "User"}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-orange-500 text-sm font-semibold text-white">
                  {(comment.userName || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {comment.userName && comment.userName.trim()
                      ? comment.userName
                      : "Người dùng"}
                  </p>
                  {comment.rating && (
                    <div className="mt-1 flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < (comment.rating || 0)
                              ? "text-yellow-400"
                              : "text-slate-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chỉ owner mới được xóa */}
                {(comment.isOwner ||
                  (user &&
                    comment.userId &&
                    String(comment.userId) ===
                      String(
                        (user as any).id || (user as any)._id || userId || ""
                      ))) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-slate-400 transition-colors hover:text-red-600"
                    title="Xóa bình luận"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <p className="mt-2 break-words text-sm leading-relaxed text-slate-700">
                {comment.content}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {comment.createdAt
                  ? new Date(comment.createdAt).toLocaleString("vi-VN")
                  : "Vừa xong"}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

CommentsList.displayName = "CommentsList";
export default CommentsList;
