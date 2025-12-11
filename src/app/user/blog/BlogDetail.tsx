// /app/user/blog/BlogDetail.tsx
"use client";

import { CalendarDays, User2, Tag, Star, Clock, Eye } from "lucide-react";
import Image from "next/image";
import {
  BlogDetail as BlogDetailType,
  BlogContentBlock,
} from "@/lib/blog/blogApi";

type Props = {
  post: BlogDetailType;
};

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const calcReadingTime = (text: string): number => {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return minutes;
};

export default function BlogDetail({ post }: Props) {
  const cover =
    post.cover ||
    post.coverImageUrl ||
    post.thumbnail ||
    post.mediaUrls?.[0] ||
    "/blog-placeholder.jpg";

  const date =
    (post as any).publishedAt || post.createdAt || post.updatedAt || undefined;

  const tags = post.tags || [];

  // Lấy plain text để tính read time
  let rawText = "";
  if (Array.isArray(post.content)) {
    const joined = (post.content as BlogContentBlock[])
      .map((b) => b.value)
      .join(" ");
    rawText = stripHtml(joined);
  } else if (typeof post.content === "string") {
    rawText = stripHtml(post.content);
  } else if (post.summary || (post as any).excerpt) {
    rawText = stripHtml(post.summary || (post as any).excerpt || "");
  }
  const readingMinutes = calcReadingTime(rawText);

  // Render phần nội dung
  const renderContent = () => {
    if (Array.isArray(post.content)) {
      return post.content.map((block, idx) => {
        if (block.type === "text" || block.type === "html") {
          return (
            <div
              key={idx}
              className="prose prose-lg max-w-none text-slate-700
                [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900
                [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-800
                [&_p]:my-4 [&_p]:leading-relaxed
                [&_ul]:my-4 [&_ul]:pl-6 [&_li]:my-2
                [&_a]:text-orange-600 [&_a]:hover:text-orange-700 [&_a]:underline
                [&_strong]:text-slate-900 [&_strong]:font-semibold
                [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600"
              dangerouslySetInnerHTML={{ __html: block.value }}
            />
          );
        }
        if (block.type === "image") {
          return (
            <div key={idx} className="my-8 overflow-hidden rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.value}
                alt={post.title ?? "blog image"}
                className="h-auto w-full rounded-2xl object-cover"
              />
            </div>
          );
        }
        if (block.type === "video") {
          return (
            <div key={idx} className="my-8 overflow-hidden rounded-2xl shadow-lg">
              <video
                src={block.value}
                controls
                className="h-auto w-full rounded-2xl"
              />
            </div>
          );
        }
        return null;
      });
    }

    // content là HTML string
    if (typeof post.content === "string") {
      return (
        <div
          className="prose prose-lg max-w-none text-slate-700
            [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900
            [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-800
            [&_p]:my-4 [&_p]:leading-relaxed
            [&_ul]:my-4 [&_ul]:pl-6 [&_li]:my-2
            [&_a]:text-orange-600 [&_a]:hover:text-orange-700 [&_a]:underline
            [&_strong]:text-slate-900 [&_strong]:font-semibold
            [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      );
    }

    // fallback: chỉ có summary
    if (post.summary) {
      return (
        <p className="mt-4 text-base leading-relaxed text-slate-700">
          {post.summary}
        </p>
      );
    }

    return (
      <p className="mt-4 text-base leading-relaxed text-slate-500">
        Nội dung bài viết đang được cập nhật.
      </p>
    );
  };

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      {/* Hero cover */}
      <div className="relative h-[300px] w-full overflow-hidden md:h-[400px]">
        <Image
          src={cover}
          alt={post.title ?? "Cover image"}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/40 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          {/* Category badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 mb-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Travel Blog
            </span>
          </div>

          <h1 className="text-2xl font-bold leading-tight text-white md:text-4xl mb-4">
            {post.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                {(post.author?.name || "A").charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{post.author?.name ?? "Admin"}</span>
            </div>

            {date && (
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-orange-400" />
                <span>
                  {new Date(date).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {readingMinutes > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-orange-400" />
                <span>{readingMinutes} phút đọc</span>
              </div>
            )}

            {/* Rating */}
            {post.ratingAvg != null && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{post.ratingAvg.toFixed(1)}</span>
                <span className="opacity-80">({post.ratingCount ?? 0})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-10 pt-8 md:px-10">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Summary/Excerpt */}
        {(post.summary || (post as any).excerpt) && (
          <div className="mb-8 p-5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500">
            <p className="text-base leading-relaxed text-slate-700 italic">
              {post.summary || (post as any).excerpt}
            </p>
          </div>
        )}

        {/* Content chính */}
        <div className="border-t border-slate-100 pt-8">
          {renderContent()}
        </div>
      </div>
    </article>
  );
}
