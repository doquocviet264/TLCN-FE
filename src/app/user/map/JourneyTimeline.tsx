"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Camera,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { checkinApi } from "@/lib/checkin/checkinApi";
import useUser from "#/src/hooks/useUser";

interface TimelineItem {
  id: string;
  province: string;
  date: string;
  type: "tour" | "manual";
  image?: string;
}

// Sample images for provinces (you can replace with real data)
const PROVINCE_IMAGES: Record<string, string> = {
  "ha noi": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=400",
  "ho chi minh": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400",
  "da nang": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400",
  "quang ninh": "https://images.unsplash.com/photo-1528127269322-539801943592?w=400",
  "lao cai": "https://images.unsplash.com/photo-1570366583862-f91883984fde?w=400",
  "khanh hoa": "https://images.unsplash.com/photo-1573790387438-4da905039392?w=400",
  "lam dong": "https://images.unsplash.com/photo-1586595256352-14d4bc5e5fc7?w=400",
};

const getProvinceImage = (province: string) => {
  const normalized = province
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    PROVINCE_IMAGES[normalized] ||
    `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400`
  );
};

export default function JourneyTimeline() {
  const { isAuthenticated } = useUser();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await checkinApi.getUserJourney();

        const items: TimelineItem[] = [];

        // Add tour provinces
        (res.provinces || []).forEach((p: string, idx: number) => {
          items.push({
            id: `tour-${idx}`,
            province: p,
            date: new Date(Date.now() - idx * 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: "tour",
            image: getProvinceImage(p),
          });
        });

        // Add manual provinces
        (res.manualProvinces || []).forEach((p: string, idx: number) => {
          items.push({
            id: `manual-${idx}`,
            province: p,
            date: new Date(
              Date.now() - (items.length + idx) * 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
            type: "manual",
            image: getProvinceImage(p),
          });
        });

        // Sort by date descending
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTimeline(items.slice(0, 10)); // Show last 10 items
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [isAuthenticated]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("vi-VN", { month: "short" }),
      year: date.getFullYear(),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
        <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          Chưa có hành trình nào
        </h3>
        <p className="text-slate-500 text-sm">
          Hãy bắt đầu chinh phục Việt Nam bằng cách check-in địa điểm đầu tiên!
        </p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">
              Dòng thời gian
            </h2>
            <p className="text-sm text-slate-500">
              {timeline.length} địa điểm gần đây
            </p>
          </div>
        </div>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
          Xem tất cả <ChevronRight size={16} />
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-emerald-200 to-slate-200" />

        <div className="space-y-6">
          {timeline.map((item, index) => {
            const date = formatDate(item.date);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-4 group"
              >
                {/* Date badge */}
                <div className="flex-shrink-0 w-20 text-center">
                  <div
                    className={`relative z-10 w-12 h-12 mx-auto rounded-xl flex flex-col items-center justify-center shadow-md ${
                      item.type === "tour"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
                        : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                    }`}
                  >
                    <span className="text-lg font-black leading-none">
                      {date.day}
                    </span>
                    <span className="text-[10px] font-medium opacity-90">
                      {date.month}
                    </span>
                  </div>
                </div>

                {/* Content card */}
                <div className="flex-1 bg-slate-50 rounded-2xl p-4 group-hover:bg-slate-100 transition-colors overflow-hidden">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image || "/hot1.jpg"}
                        alt={item.province}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                        <Camera size={12} className="text-slate-600" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-800 truncate">
                            {item.province}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.type === "tour"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {item.type === "tour" ? (
                                <>
                                  <Sparkles size={10} /> Qua tour
                                </>
                              ) : (
                                <>
                                  <MapPin size={10} /> Tự đánh dấu
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {item.type === "tour" && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-lg text-[10px] font-bold text-amber-700">
                            🎁 +1 Voucher
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(item.date).toLocaleDateString("vi-VN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
