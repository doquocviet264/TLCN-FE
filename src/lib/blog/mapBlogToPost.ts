// src/lib/blog/mapBlogToPost.ts

import { Post } from "@/types/blog";

export function mapBlogToPost(blog: any): Post {
  // Map backend BlogPost to frontend Post type
  // Backend fields: title, slug, content, summary, tags, coverImageUrl, status, publishedAt, authorId, ratingAvg, ratingCount, comments
  
  return {
    id: blog._id,
    slug: blog.slug,
    title: blog.title,
    image: blog.coverImageUrl || "/Logo.svg",

    // categories
    category: blog.categories?.[0] || blog.tags?.[0] || "Khác",
    categories: blog.categories || [],
    tags: blog.tags || [],

    // author
    author: typeof blog.authorId === "object"
      ? (blog.authorId.fullName || blog.authorId.name || blog.authorId.username || blog.authorId.email || "Admin").trim()
      : "Admin",
    authorAvatar: typeof blog.authorId === "object"
      ? blog.authorId.avatar || "/Logo.svg"
      : "/Logo.svg",

    // time & location
    date: blog.publishedAt || blog.createdAt,
    address: blog.locationDetail || "",
    ward: blog.locationDetail || "Chưa cập nhật",

    // content & album
    content: blog.content ? [{ type: 'text', value: blog.content }] : [],
    album: [],

    // privacy & interactions (not in backend admin blogs)
    privacy: "public",
    likeBy: [],
    totalLikes: 0,
    totalComments: blog.comments?.length || 0,
    shareCount: 0,
    viewCount: 0,

    // status & rating
    status: blog.status || "draft",
    ratingAvg: blog.ratingAvg || 0,
    ratingCount: blog.ratingCount || 0,
    comments: blog.comments || [],
  };
}
