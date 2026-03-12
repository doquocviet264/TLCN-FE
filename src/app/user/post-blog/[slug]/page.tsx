// /app/user/blog/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { blogApi, type BlogDetail, type BlogComment } from "@/lib/blog/blogApi";
import { Star } from "lucide-react";
import { useAuthStore } from "#/stores/auth";
import { toast } from "react-hot-toast";

const renderBlock = (block: any, idx: number) => {
  if (!block) return null;
  switch (block.type) {
    case "image":
      return (
        <div key={idx} className="my-4 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.value} alt="" className="w-full object-cover" />
        </div>
      );
    case "video":
      return (
        <div key={idx} className="my-4 overflow-hidden rounded-2xl">
          <video src={block.value} controls className="w-full rounded-2xl" />
        </div>
      );
    case "html":
      return (
        <div
          key={idx}
          className="prose prose-sm max-w-none prose-img:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: block.value }}
        />
      );
    case "text":
    default:
      return (
        <p
          key={idx}
          className="mb-3 text-[15px] leading-relaxed text-slate-800"
        >
          {block.value}
        </p>
      );
  }
};

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { user, token } = useAuthStore();
  const isLoggedIn = !!(token?.accessToken || user);

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [ratingAvg, setRatingAvg] = useState<number | undefined>(undefined);
  const [ratingCount, setRatingCount] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState("");

  const [myRating, setMyRating] = useState(5);
  const [myContent, setMyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const data = await blogApi.getBlogBySlug(slug);
        setBlog(data);
      } catch (err) {
        console.error("getBlogBySlug error", err);
        setError("Không tải được bài viết.");
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const res = await blogApi.getComments(slug);
        setComments(res.comments || []);
        setRatingAvg(res.ratingAvg);
        setRatingCount(res.ratingCount);
      } catch (err) {
        console.error("getComments error", err);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchBlog();
    fetchComments();
  }, [slug]);

  const handleSubmitComment = async () => {
    if (!isLoggedIn) {
      toast.error("Bạn cần đăng nhập để bình luận.");
      return;
    }
    if (!myContent.trim()) return;

    try {
      setSubmitting(true);
      const newComment = await blogApi.createComment(slug, {
        rating: myRating,
        content: myContent.trim(),
      });
      setComments((prev) => [newComment, ...prev]);
      setMyContent("");

      // tạm thời cập nhật ratingAvg client-side cho vui
      const newCount = (ratingCount || 0) + 1;
      const newAvg =
        ((ratingAvg || 0) * (ratingCount || 0) + myRating) / newCount;
      setRatingAvg(newAvg);
      setRatingCount(newCount);
    } catch (err) {
      console.error("createComment error", err);
      toast.error("Không gửi được bình luận.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-slate-600">
        Đang tải bài viết…
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-rose-700">
        {error || "Không tìm thấy bài viết."}
      </div>
    );
  }

  const cover = blog.cover || blog.thumbnail || "/blog-placeholder.jpg";

  return (
    <div className="bg-slate-50 pb-16">
      <article className="mx-auto max-w-4xl px-4 pt-8">
        {/* Cover */}
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
          <Image
            src={cover}
            alt={blog.title}
            width={1200}
            height={600}
            className="h-64 w-full object-cover sm:h-80"
          />
        </div>

        {/* Meta */}
        <header className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700">
            {blog.categories?.map((c) => (
              <span
                key={c}
                className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium"
              >
                {c}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>
              {blog.author?.name ? `Bởi ${blog.author.name}` : "Ẩn danh"}
            </span>
            {blog.createdAt && (
              <span>
                {new Date(blog.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            )}
            {blog.wardName && (
              <span>
                {blog.wardName +
                  (blog.locationDetail ? ` – ${blog.locationDetail}` : "")}
              </span>
            )}

            {ratingAvg != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                <Star className="h-3 w-3 fill-current" />
                {ratingAvg.toFixed(1)} ({ratingCount || 0})
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          {blog.content && Array.isArray(blog.content) && blog.content.length > 0 ? (
            blog.content.map((b, i) => renderBlock(b, i))
          ) : typeof blog.content === "string" && blog.content ? (
            <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
          ) : (
            <p className="text-sm text-slate-600">
              Bài viết này chưa có nội dung chi tiết.
            </p>
          )}
        </section>

        {/* Comments */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Bình luận & đánh giá
          </h2>

          {/* Form comment */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span className="text-slate-700">Đánh giá của bạn:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMyRating(n)}
                  className="inline-flex"
                >
                  <Star
                    className={`h-5 w-5 ${
                      n <= myRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={myContent}
              onChange={(e) => setMyContent(e.target.value)}
              placeholder={
                isLoggedIn
                  ? "Chia sẻ cảm nhận của bạn về bài viết hoặc chuyến đi..."
                  : "Đăng nhập để bình luận về bài viết này."
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-1 focus:ring-emerald-400 disabled:bg-slate-100"
              disabled={!isLoggedIn || submitting}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={!isLoggedIn || submitting || !myContent.trim().length}
                className="rounded-xl bg-[var(--primary,#16a34a)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 hover:brightness-110"
              >
                Gửi bình luận
              </button>
            </div>
          </div>

          {/* List comments */}
          <div className="space-y-3">
            {loadingComments ? (
              <p className="text-sm text-slate-500">Đang tải bình luận…</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận
                nhé!
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                        {c.userAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.userAvatar}
                            alt={c.userName || ""}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          (c.userName || "U")[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {c.userName || "Ẩn danh"}
                        </p>
                        {c.createdAt && (
                          <p className="text-[11px] text-slate-400">
                            {new Date(c.createdAt).toLocaleString("vi-VN")}
                          </p>
                        )}
                      </div>
                    </div>
                    {c.rating != null && (
                      <div className="flex items-center gap-1 text-xs text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{c.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-700">
                    {c.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </article>
    </div>
  );
}
