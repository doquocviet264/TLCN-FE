"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { blogApi, type BlogSummary } from "@/lib/blog/blogApi";

interface RelatedPostsProps {
  tags: string[];
  currentSlug: string;
}

export default function RelatedPosts({ tags, currentSlug }: RelatedPostsProps) {
  const [posts, setPosts] = useState<BlogSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!tags || tags.length === 0) {
        setLoading(false);
        return;
      }
      try {
        // Lấy bài cùng tag đầu tiên, lọc bỏ bài hiện tại
        const cleanTag = tags[0].startsWith("#") ? tags[0].slice(1) : tags[0];
        const res = await blogApi.getBlogs(1, 6, undefined, undefined, cleanTag);
        const related = (res.data ?? [])
          .filter((p) => p.slug !== currentSlug)
          .slice(0, 3);
        setPosts(related);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [tags, currentSlug]);

  if (loading) {
    return (
      <div className="mt-12">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Bài viết liên quan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-slate-100 animate-pulse h-52" />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Bài viết liên quan</h3>
          <p className="text-xs text-slate-500">Có thể bạn cũng thích</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {posts.map((post) => {
          const img = post.cover || post.thumbnail || "/hot1.jpg";
          const date = post.createdAt
            ? new Date(post.createdAt).toLocaleDateString("vi-VN")
            : "";
          return (
            <Link
              key={post.slug}
              href={`/user/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300"
            >
              <div className="relative h-36 w-full overflow-hidden">
                <Image
                  src={img}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width:640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="flex flex-col flex-1 p-4">
                <h4 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors mb-2">
                  {post.title}
                </h4>
                <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {date}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-orange-500 group-hover:text-orange-600">
                    Đọc tiếp
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
