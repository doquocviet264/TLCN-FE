"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DestinationCard from "@/components/cards/DestinationCard";
import Button from "@/components/ui/Button";
import { useGetTours } from "#/hooks/tours-hook/useTours"; // <-- Import Hook lấy Tour

export default function RecommendedPlaces() {
  const router = useRouter();

  // 1. Dùng lại Hook useGetTours (Lấy trang 1, 3 phần tử)
  const { data, isLoading } = useGetTours(1, 3);
  const tours = data?.data || []; // Lấy mảng tour từ response

  // Hàm format giá tiền
  const formatPrice = (price?: number) => {
    if (!price) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <section className="py-12 px-4 select-none">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#144d7e] uppercase tracking-wide">
              Tour Gợi Ý Cho Bạn
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Những hành trình đang được yêu thích nhất
            </p>
          </div>

          <Button
            variant="outline-primary"
            onClick={() => router.push("/user/search")} // Chuyển sang trang tìm kiếm tour
            className="text-xs sm:text-sm px-5 py-2.5 rounded-xl border-slate-200 hover:border-[#144d7e] hover:text-[#144d7e] transition-all"
          >
            Xem tất cả tour
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          // Loading Skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 bg-slate-100 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : tours.length > 0 ? (
          // Hiển thị danh sách Tour
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {tours.map((tour: any) => {
              // Lấy ảnh ưu tiên: image -> images[0] -> cover -> default
              const thumb =
                tour.image ||
                (Array.isArray(tour.images) ? tour.images[0] : null) ||
                tour.cover ||
                "/hot-destination.svg";

              return (
                <div
                  key={tour._id}
                  onClick={() => router.push(`/user/tour/${tour._id}`)}
                  className="cursor-pointer group"
                >
                  <DestinationCard
                    image={thumb}
                    title={tour.title}
                    duration={tour.time || "Liên hệ"}
                    price={formatPrice(tour.priceAdult)}
                    href={`/user/tour/${tour._id}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          // Không có dữ liệu
          <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400">Chưa có tour nào để hiển thị.</p>
          </div>
        )}
      </div>
    </section>
  );
}
