'use client';

import React, { useEffect, useState } from "react";
import RecentPostCard from "./RecentPostCard";
import { getBlogs } from "@/lib/blog/blogApi";
import { Post } from "@/types/blog";
import { mapBlogToPost } from "@/lib/blog/mapBlogToPost";

const RecentPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await getBlogs(1, 5);
        const publishedPosts = res.data
          .filter((b: any) => b.status === "published")
          .map(mapBlogToPost);

        setPosts(publishedPosts);
      } catch (err) {
        console.error("Lỗi khi lấy recent posts:", err);
      }
    }

    fetchBlogs();
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">BÀI VIẾT MỚI ĐĂNG</h2>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <RecentPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default RecentPosts;
