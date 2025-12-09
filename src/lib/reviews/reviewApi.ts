// /lib/reviews/reviewApi.ts
import axiosInstance from "@/lib/axiosInstance";

/* ================= Types ================= */
export type Review = {
  _id: string;
  tourId: string;
  userId: {
    _id: string;
    fullName?: string;
    username?: string;
    avatarUrl?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewsResponse = {
  total: number;
  averageRating: number;
  data: Review[];
};

export type CreateReviewBody = {
  tourId: string;
  rating: number;
  comment?: string;
};

/* ================= API Functions ================= */

// Lấy danh sách review của 1 tour
export async function getReviewsByTourId(tourId: string): Promise<ReviewsResponse> {
  const { data } = await axiosInstance.get(`/reviews/tour/${tourId}`);
  return {
    total: data?.total ?? 0,
    averageRating: data?.averageRating ?? 0,
    data: Array.isArray(data?.data) ? data.data : [],
  };
}

// Tạo/cập nhật review (yêu cầu đăng nhập + đã hoàn thành tour)
export async function createReview(body: CreateReviewBody): Promise<{ message: string; review: Review }> {
  const { data } = await axiosInstance.post("/reviews", body);
  return data;
}

// Lấy review của user hiện tại
export async function getMyReviews(): Promise<{ total: number; data: Review[] }> {
  const { data } = await axiosInstance.get("/reviews/me");
  return {
    total: data?.total ?? 0,
    data: Array.isArray(data?.data) ? data.data : [],
  };
}
