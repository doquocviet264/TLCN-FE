// /app/user/blog/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { blogApi, type BlogSummary } from "@/lib/blog/blogApi";
import { Search } from "lucide-react";

const PER_PAGE = 9;

function BlogListPageContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const [search, setSearch] = useState(sp.get("q") || "");
  const [page, setPage] = useState(() =>
    Math.max(1, Number(sp.get("page") || 1))
  );

  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateURL = (qValue: string, pValue: number) => {
    const params = new URLSearchParams();
    if (qValue.trim()) params.set("q", qValue.trim());
    if (pValue > 1) params.set("page", String(pValue));
    router.replace(`/user/blog?${params.toString()}`, { scroll: false });
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await blogApi.getBlogs(page, PER_PAGE, search);
      setBlogs(res.data || []);
      setTotal(res.total || 0);
      const limit = res.limit || PER_PAGE;
      setTotalPages(Math.max(1, Math.ceil((res.total || 0) / limit)));
    } catch (err) {
      console.error("Error getBlogs", err);
      setError("Không tải được danh sách bài viết.");
      setBlogs([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateURL(search, 1);
    fetchBlogs();
  };

  const onPageChange = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next === page) return;
    setPage(next);
    updateURL(search, next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const makeExcerpt = (b: BlogSummary) =>
    b.excerpt ||
    b.tags?.join(", ") ||
    "Chia sẻ kinh nghiệm du lịch chi tiết, thực tế.";

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* background gradient nhẹ */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-slate-50" />

      {/* Hero */}
      <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">
              AHH Travel Blog
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Kinh nghiệm & câu chuyện du lịch
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Tổng hợp những bài viết, review, bí kíp vi vu khắp nơi từ AHH
              Travel và cộng đồng.
            </p>
          </div>

          <form
            onSubmit={onSearchSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur"
          >
            <div className="flex items-center gap-2">
              <Search className="ml-1 h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bài viết, địa điểm..."
                className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="rounded-xl bg-[var(--primary,#16a34a)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              >
                Tìm
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 pb-12">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse"
              >
                <div className="h-40 bg-slate-200" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : blogs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
            Chưa có bài blog nào được đăng.
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Trang {page}/{totalPages} · Tổng {total.toLocaleString("vi-VN")}{" "}
                bài viết
              </span>
              <Link
                href="/user/blog/post"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                + Viết bài mới
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((b) => (
                <Link
                  key={b.slug}
                  href={`/user/blog/${b.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={b.cover || b.thumbnail || "/blog-placeholder.jpg"}
                      alt={b.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-emerald-600">
                      {b.categories?.[0] && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5">
                          {b.categories[0]}
                        </span>
                      )}
                      {b.rating != null && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                          ★ {b.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <h2 className="line-clamp-2 text-sm font-semibold text-slate-900">
                      {b.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-xs text-slate-600">
                      {makeExcerpt(b)}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4 text-[11px] text-slate-500">
                      <span>
                        {b.author?.name ? `Bởi ${b.author.name}` : "Ẩn danh"}
                      </span>
                      {b.createdAt && (
                        <span>
                          {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="rounded-full px-3 py-1 text-xs text-slate-700 disabled:opacity-40 hover:bg-slate-100"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    const active = p === page;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onPageChange(p)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          active
                            ? "bg-[var(--primary,#16a34a)] text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-full px-3 py-1 text-xs text-slate-700 disabled:opacity-40 hover:bg-slate-100"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function BlogListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogListPageContent />
    </Suspense>
  );
}
