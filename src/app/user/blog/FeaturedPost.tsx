"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Post } from "@/types/blog";

export default function FeaturedPost({ posts }: { posts?: Post[] }) {
  const [current, setCurrent] = useState(0);
  const postsLength = posts?.length || 0;

  useEffect(() => {
    if (postsLength === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % postsLength);
    }, 4000);
    return () => clearInterval(interval);
  }, [postsLength]);

  // Guard against undefined or empty posts
  if (!posts || posts.length === 0) {
    return null;
  }

  const post = posts[current];
  const dateObj = new Date(post.date);
  const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}/${(
    dateObj.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${dateObj.getFullYear()}`;

  //Lấy text content đầu tiên từ mảng content
  const previewText =
    post.content.find((c) => c.type === "text")?.value?.slice(0, 200) ||
    "Không có nội dung";

  return (
    <section className="w-full bg-[var(--background)] pt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 px-4">
        {/* Nội dung */}
        <div className="flex-1 order-2 md:order-1 text-center md:text-left">
          <p className="text-sm font-semibold tracking-wider text-[var(--gray-2)] mb-2">
            BÀI ĐĂNG NỔI BẬT
          </p>
          <h2 className="text-3xl font-extrabold text-[var(--foreground)] leading-snug mb-4">
            {post.title}
          </h2>
          <p className="text-sm text-[var(--gray-2)] mb-1">
            Người đăng: {post.author} | {formattedDate}
          </p>
          <p className="text-[var(--gray-1)] mb-6">{previewText}...</p>
          <Link href={`/user/blog/${post.slug}`} passHref>
            <Button variant="primary">Đọc bài</Button>
          </Link>
        </div>

        {/* Hình ảnh */}
        <div className="w-full md:flex-1 order-1 md:order-2">
          <div className="relative w-full h-[300px] md:w-[400px] md:h-[310px] lg:w-full lg:h-[360px] overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover transition-all duration-700"
              priority
            />
          </div>
        </div>
      </div>

      {/* Chấm điều hướng */}
      <div className="flex justify-center mt-12 space-x-2">
        {posts.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`cursor-pointer h-2 rounded-full transition-all duration-300 ${
              idx === current
                ? "w-6 bg-[var(--secondary)]"
                : "w-2 bg-[var(--gray-4)]"
            }`}
            aria-label={`Chuyển đến bài ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
