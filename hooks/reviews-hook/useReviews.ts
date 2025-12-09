// hooks/reviews-hook/useReviews.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReviewsByTourId,
  createReview,
  getMyReviews,
  type ReviewsResponse,
  type CreateReviewBody,
} from "@/lib/reviews/reviewApi";

// Hook lấy reviews của 1 tour
export const useGetTourReviews = (tourId?: string) =>
  useQuery<ReviewsResponse, Error>({
    queryKey: ["tourReviews", tourId ?? ""],
    queryFn: () => getReviewsByTourId(tourId!),
    enabled: !!tourId,
    staleTime: 30 * 1000, // 30s
  });

// Hook tạo/cập nhật review
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateReviewBody) => createReview(body),
    onSuccess: (_, variables) => {
      // Invalidate tour reviews để refetch
      queryClient.invalidateQueries({ queryKey: ["tourReviews", variables.tourId] });
      // Invalidate my reviews
      queryClient.invalidateQueries({ queryKey: ["myReviews"] });
    },
  });
};

// Hook lấy reviews của user hiện tại
export const useGetMyReviews = () =>
  useQuery({
    queryKey: ["myReviews"],
    queryFn: getMyReviews,
    staleTime: 60 * 1000, // 1 phút
  });
