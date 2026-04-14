// /app/user/blog/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Calendar,
  ArrowRight,
  BookOpen,
  Pen,
  User,
  Star,
  Search,
  Lock,
  Clock,
} from "lucide-react";
import { useGetBlogs } from "#/hooks/blogs-hook/useBlogs";
import useUser from "@/hooks/useUser";
import { useMyBookings } from "#/hooks/bookings-hook/useBooking";
import CreateBlogCTA from "./CreateBlogCTA";
import { useSearchParams } from "next/navigation";

// --- CSS Animation via style tag ---
const fadeInStyle = {
  animation: "blogFadeIn 0.4s ease-out both",
} as const;

export default function BlogListPage() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag") ?? "";

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState(initialTag);

  // Khi URL thay đổi (e.g. người dùng back/forward), đồng bộ lại state
  useEffect(() => {
    const tag = searchParams.get("tag") ?? "";
    setSelectedTag(tag);
    setPage(1);
  }, [searchParams]);
  const limit = 9;

  const { data, isLoading, isError } = useGetBlogs(page, limit, searchQuery, selectedCategory, selectedTag);
  const { user } = useUser();

  // Fetch completed tours để hiển thị CTA
  const { data: bookingsData } = useMyBookings({ enabled: !!user });
  const completedTours = (bookingsData?.data ?? []).filter(
    (b) => b.bookingStatus === "f" // "f" = finished/completed
  ).length;

  const blogs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalComments = data?.totalComments ?? 0;
  const totalAuthors = data?.totalAuthors ?? 0;

  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  // Use API result directly
  const filteredBlogs = blogs;

  return (
    <main className="relative min-h-screen bg-slate-50 font-sans text-slate-600">
      {/* ===== HERO HEADER ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-20 lg:py-28">
        {/* Pattern background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Gradient blobs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 h-80 w-80 -translate-y-1/2 rounded-full bg-orange-500/15 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-500/20 blur-[80px] pointer-events-none" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 mb-6">
              <BookOpen size={14} className="text-orange-400" />
              <span className="text-xs font-semibold text-orange-300 uppercase tracking-wider">
                Travel Blog
              </span>
            </div>

            <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl leading-tight">
              Câu chuyện{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                Du Lịch
              </span>
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-lg text-blue-200">
              Khám phá những trải nghiệm, bí kíp du lịch và câu chuyện thú vị
              từ cộng đồng Travel AHH
            </p>

            {/* Search bar */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
                <Search className="ml-3 h-5 w-5 text-blue-300" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchQuery(searchInput);
                      setPage(1);
                    }
                  }}
                  className="flex-1 bg-transparent text-white placeholder:text-blue-300 outline-none text-sm py-2"
                />
                <button 
                  type="button"
                  onClick={() => {
                    setSearchQuery(searchInput);
                    setPage(1);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl text-sm hover:from-orange-600 hover:to-orange-700 transition-all cursor-pointer relative z-20">
                  Tìm kiếm
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Tất cả", "Du lịch", "Ẩm thực", "Trải nghiệm", "Review", "Cẩm nang", "Kinh nghiệm", "Nghỉ dưỡng"].map((cat) => {
                const isSelected = cat === "Tất cả" ? selectedCategory === "" : selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat === "Tất cả" ? "" : cat);
                      setPage(1);
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "bg-white/10 text-blue-100 hover:bg-white/20 border border-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Selected Tag Indicator */}
            {selectedTag && (
              <div className="mt-4 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-blue-900/50 border border-blue-400/30 text-blue-200 px-4 py-1.5 rounded-lg text-sm">
                  <span>Đang lọc theo HashTag: </span>
                  <span className="font-bold text-orange-400">#{selectedTag}</span>
                  <button onClick={() => { setSelectedTag(""); setPage(1); }} className="ml-2 hover:text-white transition-colors bg-white/10 rounded-full w-5 h-5 flex items-center justify-center">&times;</button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="mt-8 flex justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{total}</p>
                <p className="text-xs text-blue-300">Bài viết</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {totalComments}
                </p>
                <p className="text-xs text-blue-300">Bình luận</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {totalAuthors}
                </p>
                <p className="text-xs text-blue-300">Tác giả</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 50L48 45.7C96 41.3 192 32.7 288 30.2C384 27.7 480 31.3 576 39.2C672 47 768 59 864 59.5C960 60 1056 49 1152 43.5C1248 38 1344 38 1392 38L1440 38V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </section>

      {/* ===== BLOG CONTENT ===== */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 lg:px-0">
        {/* CTA để viết blog nếu user có tour hoàn thành */}
        {user && completedTours > 0 && (
          <div className="mb-10">
            <CreateBlogCTA completedToursCount={completedTours} />
          </div>
        )}

        {/* Header với nút viết bài */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Bài viết mới nhất
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {total} bài viết từ cộng đồng du lịch
            </p>
          </div>
          <Link
            href="/user/post-blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
          >
            <Pen size={16} />
            Viết bài mới
          </Link>
        </div>

        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 animate-pulse h-full"
              >
                <div className="h-52 bg-slate-200" />
                <div className="flex-1 space-y-4 p-5">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-slate-200" />
                    <div className="h-5 w-20 rounded-full bg-slate-200" />
                  </div>
                  <div className="h-5 w-full rounded bg-slate-200" />
                  <div className="h-5 w-2/3 rounded bg-slate-200" />
                  <div className="space-y-2 pt-2">
                    <div className="h-3 w-full rounded bg-slate-200" />
                    <div className="h-3 w-3/4 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          // Error state
          <div className="py-16 text-center rounded-2xl border border-red-100 bg-red-50 p-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">
              Đã có lỗi xảy ra!
            </h3>
            <p className="text-red-500">
              Không tải được danh sách bài viết. Vui lòng thử lại sau.
            </p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          // Empty state
          <div className="py-16 text-center rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="mx-auto h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={36} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {searchQuery ? "Không tìm thấy bài viết" : "Chưa có bài viết nào"}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery
                ? "Thử tìm kiếm với từ khóa khác"
                : "Hãy là người đầu tiên chia sẻ câu chuyện du lịch!"}
            </p>
            <Link
              href="/user/post-blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <Pen size={18} />
              Viết bài đầu tiên
            </Link>
          </div>
        ) : (
          <>
            {/* keyframes animation */}
            <style>{`
              @keyframes blogFadeIn {
                from { opacity: 0; transform: translateY(16px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {/* GRID 3 CỘT */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBlogs.map((post, idx) => {
                const img = post.cover || post.thumbnail || "/hot1.jpg";
                const createdDate = post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString("vi-VN")
                  : "";

                const categories =
                  post.categories && post.categories.length > 0
                    ? post.categories
                    : ["Du lịch"];

                const isPrivate = post.privacy === "private";
                const isPending = post.status === "pending" || post.status === "rejected";
                const isOwnHidden = isPrivate || isPending;
                const linkHref = isOwnHidden ? `/user/blog/preview/${post.slug}` : `/user/blog/${post.slug}`;

                return (
                  <article
                    key={post.slug}
                    style={{ ...fadeInStyle, animationDelay: `${idx * 60}ms` }}
                    className={`group flex flex-col h-full overflow-hidden rounded-2xl bg-white shadow-sm border ${isOwnHidden ? "border-amber-200" : "border-slate-100"} hover:shadow-xl hover:shadow-orange-100/50 hover:border-orange-200 transition-all duration-300`}
                  >
                    <Link
                      href={linkHref}
                      className="relative h-52 w-full overflow-hidden block"
                    >
                      <Image
                        src={img}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Categories */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {categories.slice(0, 2).map((c: string) => (
                          <span
                            key={c}
                            className="bg-white/95 backdrop-blur-sm text-blue-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm"
                          >
                            {c}
                          </span>
                        ))}
                        {isPrivate && (
                           <span className="bg-slate-800/90 backdrop-blur-sm text-white flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-slate-700 shadow-sm">
                             <Lock size={10} /> Riêng tư
                           </span>
                        )}
                        {isPending && (
                           <span className="bg-amber-500/90 backdrop-blur-sm text-white flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                             <Clock size={10} /> Chờ duyệt
                           </span>
                        )}
                      </div>

                      {/* Rating badge */}
                      {post.rating && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                          <Star
                            size={12}
                            className="text-amber-500 fill-amber-500"
                          />
                          <span className="text-xs font-bold text-slate-700">
                            {post.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      {/* Date */}
                      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Calendar size={14} className="text-orange-500" />
                        <span>{createdDate}</span>
                      </div>

                      {/* Title */}
                      <Link
                        href={linkHref}
                        className="block mb-3"
                      >
                        <h2 className="text-lg font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                          {post.title}
                        </h2>
                      </Link>

                      {/* View & Excerpt */}
                      <p className="mb-4 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {post.excerpt ||
                          "Chia sẻ kinh nghiệm và những trải nghiệm du lịch thú vị..."}
                      </p>

                      {/* Tags Fast Filter */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mb-5 flex flex-wrap gap-2">
                          {post.tags.slice(0, 3).map((t: string) => {
                            const cleanTag = t.startsWith("#") ? t.substring(1) : t;
                            return (
                              <button
                                key={t}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedTag(cleanTag);
                                  setSearchQuery("");
                                  setSearchInput("");
                                  setSelectedCategory("");
                                  setPage(1);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="text-[10px] font-bold tracking-wide text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-md hover:bg-orange-500 hover:text-white transition-all duration-300"
                              >
                                #{cleanTag}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {(post.author?.name || "A").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            {post.author?.name || "Ẩn danh"}
                          </span>
                        </div>

                        <Link
                          href={linkHref}
                          className="group/btn inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
                        >
                          Đọc tiếp
                          <ArrowRight
                            size={16}
                            className="transition-transform group-hover/btn:translate-x-1"
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 flex justify-center gap-2"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-50 disabled:hover:border-slate-200 transition-all shadow-sm"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const num = i + 1;
                  const active = num === page;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPage(num)}
                      className={`h-10 w-10 rounded-xl text-sm font-bold transition-all ${
                        active
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-orange-500 hover:text-orange-600 shadow-sm"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-50 disabled:hover:border-slate-200 transition-all shadow-sm"
                >
                  &gt;
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
