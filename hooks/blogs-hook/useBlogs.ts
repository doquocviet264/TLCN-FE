// #/hooks/blogs-hook/useBlogs.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { blogApi } from "@/lib/blog/blogApi";
import type { BlogsResponse } from "@/lib/blog/blogApi";

export const useGetBlogs = (page = 1, limit = 9, q?: string) =>
  useQuery<BlogsResponse, Error>({
    queryKey: ["getBlogs", page, limit, q],
    queryFn: () => blogApi.getBlogs(page, limit, q),
    staleTime: 1000 * 60 * 5, // 5 phút
  });

/**
 * Workaround: BE chưa phân trang đúng → FE fetch all rồi tự slice
 */
export const useGetAllBlogs = (currentPage = 1, pageSize = 9) =>
  useQuery<BlogsResponse, Error>({
    // 👈 phải đưa currentPage & pageSize vào queryKey
    queryKey: ["getAllBlogs", currentPage, pageSize],
    queryFn: async () => {
      // Fetch tất cả 1 lần từ BE (page 1, limit lớn)
      const response = await blogApi.getBlogs(1, 1000);

      const allBlogs = response.data || [];
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const paginatedBlogs = allBlogs.slice(start, end);

      return {
        data: paginatedBlogs,
        total: allBlogs.length,
        page: currentPage,
        limit: pageSize,
      };
    },
    staleTime: 1000 * 60 * 5,
    // (tuỳ chọn) giữ lại dữ liệu cũ khi đổi trang – tương đương keepPreviousData v4
    placeholderData: (prev) => prev,
  });
