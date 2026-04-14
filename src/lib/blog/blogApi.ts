import axiosInstance from "@/lib/axiosInstance";

/* ===== Types ===== */

export type BlogSummary = {
  _id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover?: string;
  coverImageUrl?: string;
  thumbnail?: string;
  categories?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  author?: {
    id?: string | number;
    name?: string;
    avatar?: string;
  };
  rating?: number; // trung bình
  commentsCount?: number;
  status?: "pending" | "published" | "rejected" | "archived";
  privacy?: "public" | "private";
  rejectReason?: string;
};

export type BlogContentBlock = {
  type: "text" | "image" | "video" | "html";
  value: string;
};

export type BlogDetail = BlogSummary & {
  content?: string | BlogContentBlock[];
  summary?: string;
  coverImageUrl?: string;
  ratingAvg?: number;
  ratingCount?: number;
  mediaUrls?: string[];
  wardName?: string;
  ward?: string;
  province?: string;
  locationDetail?: string;
};

// Đổi tên cho thống nhất
export type BlogsResponse = {
  data: BlogSummary[];
  total: number;
  page: number;
  limit: number;
  totalComments?: number;
  totalAuthors?: number;
};

export const getBlogBySlug = async (slug: string): Promise<BlogDetail> => {
  const res = await axiosInstance.get<BlogDetail>(`/blog/${slug}`);
  return res.data;
};

export type BlogComment = {
  id: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  rating?: number;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  isOwner?: boolean;
};

export type BlogCommentsResponse = {
  ratingAvg?: number;
  ratingCount?: number;
  comments: BlogComment[];
};

/* ===== API ===== */

export const getBlogs = async (
  page = 1,
  limit = 9,
  q?: string,
  category?: string,
  tag?: string
): Promise<BlogsResponse> => {
  const res = await axiosInstance.get<BlogsResponse>("/blog", {
    params: {
      page,
      limit,
      q: q?.trim() || undefined,
      category: category || undefined,
      tag: tag || undefined,
    },
  });

  const raw = res.data;

  return {
    ...raw,
    data: raw.data.map((b: any) => ({
      ...b,
      excerpt: b.excerpt ?? b.summary ?? "",
      cover: b.cover ?? b.coverImageUrl ?? b.thumbnail,
    })),
  };
};

// ✅ Normalize comment để luôn có userName, userAvatar, userId chuẩn
export const getComments = async (
  slug: string
): Promise<BlogCommentsResponse> => {
  // dùng any vì đôi khi BE trả array, đôi khi object
  const res = await axiosInstance.get<any>(`/blog/${slug}/comments`);
  const data = res.data;
  console.log("Raw API comments:", data);

  const rawComments = Array.isArray(data) ? data : data?.comments || [];

  const normalizedComments: BlogComment[] = rawComments.map((comment: any) => {
    let userObj: any = null;
    let userIdValue: string | undefined;

    // Trường hợp BE populate userId thành object user
    if (comment.userId && typeof comment.userId === "object") {
      userObj = comment.userId;
      userIdValue = comment.userId._id || comment.userId.id;
    } else {
      userIdValue = comment.userId;
    }

    if (!userObj) {
      userObj = comment.user || comment.author || {};
    }

    const userName =
      comment.userName ||
      userObj.fullName ||
      userObj.name ||
      userObj.username ||
      userObj.email ||
      "Người dùng";

    const userAvatar =
      comment.userAvatar ||
      userObj.avatar ||
      userObj.avatarUrl ||
      userObj.photo ||
      userObj.image ||
      "";

    const mapped: BlogComment = {
      id: comment.id || comment._id,
      userId: userIdValue,
      userName,
      userAvatar,
      content: comment.content,
      rating: comment.rating,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isOwner: Boolean(comment.isOwner),
    };

    console.log("Mapped comment:", mapped);
    return mapped;
  });

  return {
    ratingAvg: data.ratingAvg ?? data.rating ?? undefined,
    ratingCount: data.ratingCount ?? normalizedComments.length,
    comments: normalizedComments,
  };
};

const createComment = async (
  slug: string,
  body: { rating: number; content: string }
): Promise<BlogComment> => {
  const validRating = Math.min(Math.max(Math.floor(body.rating), 1), 5);

  const payload = {
    content: body.content,
    rating: validRating,
  };

  console.log("Creating comment with payload:", payload);
  const res = await axiosInstance.post<BlogComment>(
    `/blog/${slug}/comments`,
    payload
  );
  return res.data;
};

const updateComment = async (
  slug: string,
  commentId: string,
  body: { rating?: number; content?: string }
): Promise<BlogComment> => {
  const res = await axiosInstance.patch<BlogComment>(
    `/blog/${slug}/comments/${commentId}`,
    body
  );
  return res.data;
};

const deleteComment = async (
  slug: string,
  commentId: string
): Promise<void> => {
  await axiosInstance.delete(`/blog/${slug}/comments/${commentId}`);
};

const createBlog = async (formData: FormData) => {
  const res = await axiosInstance.post("/blog/user", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Lấy danh sách bài viết của user đang đăng nhập
const getMyPosts = async (page = 1, limit = 10): Promise<BlogsResponse> => {
  const res = await axiosInstance.get<BlogsResponse>("/blog/user/my-posts", {
    params: { page, limit },
  });
  return res.data;
};

// Cập nhật bài viết của user
const updateBlog = async (id: string, formData: FormData) => {
  const res = await axiosInstance.put(`/blog/user/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Xóa bài viết của user
const deleteBlog = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/blog/user/${id}`);
};

const getOwnPostById = async (id: string): Promise<BlogDetail> => {
  const res = await axiosInstance.get<BlogDetail>(`/blog/user/${id}`);
  return res.data;
};

const previewOwnPost = async (slug: string): Promise<BlogDetail> => {
  const res = await axiosInstance.get<BlogDetail>(`/blog/user/preview/${slug}`);
  return res.data;
};

const togglePrivacy = async (id: string, privacy: "public" | "private"): Promise<any> => {
  const formData = new FormData();
  formData.append("privacy", privacy);
  const res = await axiosInstance.put(`/blog/user/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const blogApi = {
  getBlogs,
  getBlogBySlug,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  createBlog,
  getMyPosts,
  updateBlog,
  deleteBlog,
  getOwnPostById,
  previewOwnPost,
  togglePrivacy,
};
