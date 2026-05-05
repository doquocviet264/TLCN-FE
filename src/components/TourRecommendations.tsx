"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import useUser from "@/hooks/useUser";
import {
  trackClick,
  trackImpressions,
  SourceType,
  ModelType,
} from "@/utils/tracking";
import CardHot from "./cards/CardHot"; // ← import component (không phải type)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Departure {
  _id: string;
  startDate: string;
  max_guests: number;
  current_guests: number;
  priceAdult: number;
}

interface Tour {
  _id: string;
  title: string;
  destination: string;
  destinationSlug?: string;
  priceAdult: number;
  priceChild?: number;
  salePrice?: number;
  discountPercent?: number;
  time?: string;
  description?: string;
  images: string[];
  quantity?: number;
  startDate?: string;
  upcomingDepartures?: Departure[];
}

interface ApiResponse {
  data: Tour[];
  model?: ModelType;
}

interface Props {
  type: "homepage" | "similar" | "post-booking";
  tourId?: string;
  heading?: string;
  limit?: number;
  showViewAll?: boolean;
}

export default function TourRecommendations({
  type,
  tourId,
  heading,
  limit = 6,
  showViewAll = false,
}: Props) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<ModelType | null>(null);
  const { user } = useUser();

  const getSource = (): SourceType => {
    switch (type) {
      case "homepage":
        return "homepage";
      case "similar":
        return "similar";
      case "post-booking":
        return "post_booking";
      default:
        return "direct";
    }
  };

  useEffect(() => {
    const fetchRec = async () => {
      try {
        let url = "";
        if (type === "homepage") {
          const userId = user?.id || "";
          url = `${API_BASE}/api/recommendations/homepage?limit=${limit}${userId ? `&userId=${userId}` : ""}`;
        }
        if (type === "similar" && tourId) {
          url = `${API_BASE}/api/recommendations/similar/${tourId}?limit=${limit}`;
        }
        if (type === "post-booking" && tourId) {
          const userId = user?.id || "";
          url = `${API_BASE}/api/recommendations/post-booking/${tourId}?limit=${limit}${userId ? `&userId=${userId}` : ""}`;
        }

        if (!url) {
          setLoading(false);
          return;
        }

        const res = await fetch(url, { credentials: "include" });
        const json: ApiResponse = await res.json();

        setTours(json.data ?? []);
        setModel(json.model || null);

        if (json.data && json.data.length > 0) {
          trackImpressions(
            json.data.map((t) => t._id),
            {
              userId: user?.id,
              source: getSource(),
              model: json.model || null,
            },
          );
        }
      } catch (err) {
        console.error("Recommendation fetch error:", err);
        setTours([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRec();
  }, [type, tourId, limit, user?.id]);

  const handleTourClick = useCallback(
    (clickedTourId: string, position: number) => {
      trackClick(clickedTourId, {
        userId: user?.id,
        source: getSource(),
        model,
        position,
      });
    },
    [user?.id, model, type],
  );

  const getSlug = (tour: Tour) => {
    if (tour.destinationSlug) return tour.destinationSlug;
    return (tour.destination || tour.title || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (loading) {
    return (
      <section className="bg-slate-50 px-4 pb-14 pt-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="h-10 bg-slate-200 rounded w-64 mx-auto mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: limit > 6 ? 6 : limit }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-slate-200" />
                <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tours.length === 0) return null;

  return (
    <section className="bg-slate-50 px-4 pb-14 pt-10">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            {model === "deepfm"
              ? "Gợi ý dành riêng cho bạn"
              : "Tour được yêu thích"}
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {heading ?? "Tour gợi ý cho bạn"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {model === "deepfm"
              ? "Được cá nhân hóa dựa trên sở thích của bạn"
              : `Khám phá ${tours.length} hành trình được nhiều khách lựa chọn`}
          </p>
        </div>

        {/* Tour Grid - ĐÃ DÙNG CardHot */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour, index) => {
            const cardProps = {
              image: tour.images?.[0] || "",
              title: tour.title,
              badgeText: tour.discountPercent
                ? `Giảm ${tour.discountPercent}%`
                : model === "deepfm"
                  ? "Gợi ý cho bạn"
                  : undefined,
              originalPrice: tour.priceAdult,
              salePrice: tour.salePrice,
              discountPercent: tour.discountPercent,
              href: `/user/destination/${getSlug(tour)}/${tour._id}`,
              time: tour.time,
              destination: tour.destination,
              upcomingDepartures: tour.upcomingDepartures,
              onClick: () => handleTourClick(tour._id, index),
            };

            return <CardHot key={tour._id} {...cardProps} />;
          })}
        </div>

        {/* View All */}
        {showViewAll && (
          <div className="mt-8 text-center">
            <Link
              href="/user/destination"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
            >
              Xem tất cả tour
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
