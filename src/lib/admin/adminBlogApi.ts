import { adminApi } from "./adminApi";
import { BlogPost } from "@/types/blog";

/** Params để lấy danh sách blog */
export type GetAdminBlogsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "draft" | "pending" | "published" | "archived" | "rejected";
  privacy?: "public" | "private" | "";
};

/** Body để tạo blog */
export type CreateBlogBody = {
  title: string;
  summary?: string;
  content: string;
  tags?: string[];
  coverImageUrl?: string;
  coverImagePublicId?: string;
  status?: "draft" | "pending" | "published" | "archived" | "rejected";
  privacy?: "public" | "private";
};

/** Body để cập nhật blog */
export type UpdateBlogBody = Partial<CreateBlogBody>;

/** Response từ API */
export type BlogResponse = {
  total: number;
  page: number;
  limit: number;
  data: BlogPost[];
};

/** Lấy danh sách blog cho admin */
export async function getAdminBlogs(params?: GetAdminBlogsParams) {
  const { data } = await adminApi.get<BlogResponse>("/blog/admin/list", { params });
  return data;
}

/** Lấy chi tiết blog theo ID */
export async function getAdminBlogById(id: string) {
  const { data } = await adminApi.get<BlogPost>(`/blog/admin/${id}`);
  return data;
}

/** Tạo blog mới */
export async function createBlog(body: CreateBlogBody) {
  const { data } = await adminApi.post<{ message: string; post: BlogPost }>("/blog/admin", body);
  return data;
}

/** Cập nhật blog */
export async function updateBlog(id: string, body: UpdateBlogBody) {
  const { data } = await adminApi.put<{ message: string; post: BlogPost }>(`/blog/admin/${id}`, body);
  return data;
}

/** Xóa blog */
export async function deleteBlog(id: string) {
  const { data } = await adminApi.delete<{ message: string }>(`/blog/admin/${id}`);
  return data;
}

/** Cập nhật status blog */
export async function updateBlogStatus(id: string, body: { status: "draft" | "pending" | "published" | "archived" | "rejected", rejectReason?: string }) {
  const { data } = await adminApi.patch<{ message: string; post: BlogPost }>(`/blog/admin/${id}/status`, body);
  return data;
}
