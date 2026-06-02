import { adminApi } from "./adminApi";

/** Review từ user */
export type ReviewData = {
  _id: string;
  tourId: string;
  userId: {
    _id: string;
    fullName: string;
    username: string;
    avatarUrl?: string;
  };
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  updatedAt: string;
};

/** Params để lấy danh sách reviews */
export type GetAdminReviewsParams = {
  page?: number;
  limit?: number;
  tourId?: string;
  minRating?: number;
  maxRating?: number;
  search?: string; // Tìm theo user name hoặc comment
  startDate?: string;
  endDate?: string;
};

/** Response từ API */
export type ReviewsResponse = {
  total: number;
  page?: number;
  limit?: number;
  averageRating?: number;
  data: ReviewData[];
};

/**
 * Lấy danh sách tất cả reviews (admin)
 * @param params - Filters: tourId, minRating, maxRating, search
 */
export async function getAdminReviews(params?: GetAdminReviewsParams) {
  try {
    console.log("📊 Fetching admin reviews with params:", params);
    const { data } = await adminApi.get<ReviewsResponse>("/reviews/admin", { params });
    console.log("✅ Reviews fetched:", data.total);
    return data;
  } catch (error: any) {
    console.error("❌ Failed to fetch reviews:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Lấy reviews của một tour cụ thể
 * @param tourId - ID của tour
 */
export async function getAdminReviewsByTour(tourId: string) {
  try {
    console.log("📊 Fetching reviews for tour:", tourId);
    const { data } = await adminApi.get<ReviewsResponse>(`/reviews/tour/${tourId}`);
    console.log("✅ Tour reviews fetched:", data.total);
    return data;
  } catch (error: any) {
    console.error("❌ Failed to fetch tour reviews:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Xóa review (admin)
 * @param reviewId - ID của review
 */
export async function deleteAdminReview(reviewId: string) {
  try {
    console.log("🗑️ Deleting review:", reviewId);
    const { data } = await adminApi.delete<{ message: string }>(`/reviews/${reviewId}`);
    console.log("✅ Review deleted");
    return data;
  } catch (error: any) {
    console.error("❌ Failed to delete review:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Cập nhật review (admin - có thể edit comment/rating)
 * @param reviewId - ID của review
 * @param updates - { rating?, comment? }
 */
export async function updateAdminReview(reviewId: string, updates: { rating?: number; comment?: string }) {
  try {
    console.log("✏️ Updating review:", reviewId, updates);
    const { data } = await adminApi.put<{ message: string; review: ReviewData }>(`/reviews/admin/${reviewId}`, updates);
    console.log("✅ Review updated:", data);
    return data;
  } catch (error: any) {
    console.error("❌ Failed to update review:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      error: error
    });
    throw error;
  }
}
