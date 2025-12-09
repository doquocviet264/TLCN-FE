"use client";

import React, { useEffect, useState } from "react";
import BlogCard from "./BlogCard";
import { getBlogs } from "@/lib/blog/blogApi";
import { Post } from "@/types/blog";
import { mapBlogToPost } from "@/lib/blog/mapBlogToPost";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";

type BlogListSectionProps = {
  activeCategoryKey: string;
};

const PAGE_SIZE = 10;

const BlogListSection = ({ activeCategoryKey }: BlogListSectionProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset page khi đổi category
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategoryKey]);

  useEffect(() => {
    async function fetchBlogs(page: number) {
      try {
        const res = await getBlogs(page, PAGE_SIZE);

        let blogs: Post[] = res.data
          .filter((b: any) => b.status === "published")
          .map(mapBlogToPost);

        if (activeCategoryKey !== "all") {
          blogs = blogs.filter((b: Post) => b.category === activeCategoryKey);
        }

        setPosts(blogs);

        const totalPublished = res.total
          ? res.data.filter((b: any) => b.status === "published").length
          : blogs.length;

        setTotalPages(Math.ceil(totalPublished / PAGE_SIZE));
      } catch (err) {
        console.error("Lỗi khi lấy blogs:", err);
      }
    }

    fetchBlogs(currentPage);
  }, [currentPage, activeCategoryKey]);

  return (
    <section className="px-4 pb-10 max-w-7xl mx-auto">
      <div className="space-y-2 shadow-lg">
        {posts.length > 0 ? (
          posts.map((post) => <BlogCard key={post.id} post={post} />)
        ) : (
          <p className="text-center py-10 text-gray-500">Không có bài viết</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-10">
        <button
          className="cursor-pointer text-xl disabled:opacity-30"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <MdNavigateBefore size={24} />
        </button>
        <span className="text-sm text-[var(--gray-2)]">
          {currentPage} / {totalPages}
        </span>
        <button
          className="cursor-pointer text-xl disabled:opacity-30"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          <MdNavigateNext size={24} />
        </button>
      </div>
    </section>
  );
};

export default BlogListSection;
