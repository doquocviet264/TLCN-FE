"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { useGetBlogs } from "#/hooks/blogs-hook/useBlogs";

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Hiệu ứng cascade cho các bài viết
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function BlogListPage() {
  const [page, setPage] = useState(1);
  const limit = 9; // 3 cột x 3 hàng

  const { data, isLoading, isError } = useGetBlogs(page, limit);

  const blogs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data
    ? Math.max(1, Math.ceil(total / (data.limit || limit)))
    : 1;

  return (
    <main className="relative min-h-screen bg-white font-sans text-slate-600 selection:bg-orange-100 selection:text-orange-900">
      {/* ===== HERO HEADER ===== */}
      <section className="relative overflow-hidden bg-blue-950 py-24 lg:py-32">
        {/* Họa tiết nền (Pattern) */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        ></div>

        {/* Các khối sáng trang trí (Blobs) */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/30 blur-[100px]" />
        <div className="absolute top-1/2 right-0 h-80 w-80 -translate-y-1/2 rounded-full bg-orange-500/20 blur-[100px]" />

        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-extrabold text-white sm:text-7xl leading-tight">
              Blog{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">
                Du Lịch
              </span>
            </h1>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <div className="h-px w-16 bg-slate-700 sm:w-24"></div>
              <p className="max-w-xl text-lg text-slate-300 italic">
                &ldquo;Đừng nghe những gì họ nói. Hãy đi để tự mình cảm nhận.&rdquo;
              </p>
              <div className="h-px w-16 bg-slate-700 sm:w-24"></div>
            </div>
          </motion.div>
        </div>

        {/* Đường cong cắt bên dưới để mềm mại hơn */}

      </section>
      {/* ===== BLOG CONTENT ===== */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 lg:px-0 -mt-8">
        {/* STATE: loading / error / empty */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-lg border border-slate-100 animate-pulse h-full"
              >
                <div className="h-56 bg-slate-200" />
                <div className="flex-1 space-y-4 p-6">
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-slate-200" />
                    <div className="h-6 w-24 rounded-full bg-slate-200" />
                  </div>
                  <div className="h-6 w-full rounded bg-slate-200" />
                  <div className="h-6 w-2/3 rounded bg-slate-200" />
                  <div className="space-y-2 pt-2">
                    <div className="h-3 w-full rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-200" />
                    <div className="h-3 w-3/4 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-20 text-center rounded-3xl border border-red-100 bg-red-50 p-10">
            <h3 className="text-xl font-bold text-red-600 mb-2">
              Đã có lỗi xảy ra!
            </h3>
            <p className="text-red-500">
              Không tải được danh sách bài viết. Vui lòng thử lại sau.
            </p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-slate-100 bg-slate-50 p-10">
            <div className="mx-auto h-20 w-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              Chưa có bài viết nào
            </h3>
            <p className="text-slate-500">
              Hãy quay lại sau để cập nhật những bài viết mới nhất nhé.
            </p>
          </div>
        ) : (
          <>
            {/* GRID 3 CỘT */}
            <motion.section
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {blogs.map((post) => {
                const img = post.cover || post.thumbnail || "/hot1.jpg";
                const createdDate = post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString("vi-VN")
                  : "";

                // Mặc định category nếu không có
                const categories =
                  post.categories && post.categories.length > 0
                    ? post.categories
                    : ["Du lịch", "Kinh nghiệm"];

                return (
                  <motion.article
                    key={post.slug}
                    variants={itemVariants}
                    className="group flex flex-col h-full overflow-hidden rounded-[2rem] bg-white shadow-md border border-slate-100 hover:shadow-xl hover:shadow-orange-100/50 hover:border-orange-100 transition-all duration-300"
                  >
                    {/* Image Container */}
                    <Link
                      href={`/user/blog/${post.slug}`}
                      className="relative h-60 w-full overflow-hidden block"
                    >
                      <Image
                        src={img}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                      />
                      {/* Overlay gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Category Badge (Floating) */}
                      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        {categories.slice(0, 2).map((c: string) => (
                          <span
                            key={c}
                            className="bg-white/90 backdrop-blur-sm text-blue-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6">
                      {/* Date */}
                      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Calendar size={14} className="text-orange-500" />
                        <span>{createdDate}</span>
                      </div>

                      {/* Title */}
                      <Link
                        href={`/user/blog/${post.slug}`}
                        className="block mb-3"
                      >
                        <h2 className="text-xl font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                          {post.title}
                        </h2>
                      </Link>

                      {/* Excerpt */}
                      <p className="mb-6 text-sm text-slate-500 line-clamp-3 leading-relaxed">
                        {post.excerpt ||
                          "Bài viết chia sẻ kinh nghiệm, mẹo du lịch, lịch trình và những điều thú vị trong chuyến đi của bạn. Khám phá ngay để có chuyến đi trọn vẹn!"}
                      </p>

                      {/* Footer Actions */}
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Author avatar placeholder if you have author data */}
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            A
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            Admin
                          </span>
                        </div>

                        <Link
                          href={`/user/blog/${post.slug}`}
                          className="group/btn inline-flex items-center gap-1 text-sm font-bold text-blue-950 hover:text-orange-600 transition-colors"
                        >
                          Đọc tiếp{" "}
                          <ArrowRight
                            size={16}
                            className="transition-transform group-hover/btn:translate-x-1"
                          />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.section>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 flex justify-center gap-2"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-50 disabled:hover:border-slate-200 transition-all"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const num = i + 1;
                  const active = num === page;
                  return (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`h-10 w-10 rounded-full text-sm font-bold transition-all ${
                        active
                          ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30 scale-110"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-orange-500 hover:text-orange-600"
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-50 disabled:hover:border-slate-200 transition-all"
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
