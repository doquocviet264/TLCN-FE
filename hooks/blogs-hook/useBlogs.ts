// #/hooks/blogs-hook/useBlogs.ts
"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { blogApi } from "@/lib/blog/blogApi";
import type { BlogsResponse } from "@/lib/blog/blogApi";

export const useGetBlogs = (page = 1, limit = 9, q?: string, category?: string, tag?: string) =>
  useQuery<BlogsResponse, Error>({
    queryKey: ["getBlogs", page, limit, q, category, tag],
    queryFn: () => blogApi.getBlogs(page, limit, q, category, tag),
    staleTime: 1000 * 60 * 5, // 5 phút
    placeholderData: keepPreviousData,
  });

