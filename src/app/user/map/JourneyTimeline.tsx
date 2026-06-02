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
  Lock,
  Globe,
  Heart
} from "lucide-react";
import { travelMemoryApi, TravelMemoryPayload } from "@/lib/checkin/travelMemoryApi";
import useUser from "#/src/hooks/useUser";
import { toast } from "react-hot-toast";

interface TimelineItem {
  _id: string;
  provinceName: string;
  visitedAt: string;
  caption: string;
  images: string[];
  privacy: "private" | "public";
  source: "manual" | "tour";
  userId?: {
    _id: string;
    fullName: string;
    avatar: string;
  };
  likesCount?: number;
  isLikedByMe?: boolean;
}

export default function JourneyTimeline({
  initialTab = "me",
  filterProvince,
}: {
  initialTab?: "me" | "community";
  filterProvince?: string;
}) {
  const { isAuthenticated } = useUser();
  const [activeTab, setActiveTab] = useState<"me" | "community">(initialTab);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        if (activeTab === "me") {
          const res = await travelMemoryApi.getMyMemories(filterProvince, 1, 10);
          setTimeline(res.data || []);
        } else {
          const res = await travelMemoryApi.getPublicMemories(filterProvince, 1, 10);
          setTimeline(res.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [isAuthenticated, activeTab, filterProvince]);

  const handleLike = async (id: string, isLiked: boolean) => {
    if (!isAuthenticated) return;
    try {
      setTimeline(prev => prev.map(item => {
        if (item._id === id) {
          return {
            ...item,
            isLikedByMe: !isLiked,
            likesCount: (item.likesCount || 0) + (isLiked ? -1 : 1)
          };
        }
        return item;
      }));
      
      if (isLiked) {
        await travelMemoryApi.unlikeMemory(id);
      } else {
        await travelMemoryApi.likeMemory(id);
      }
    } catch (error: any) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  };

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
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-6">
          <button
            onClick={() => setActiveTab("me")}
            className={`font-bold transition-colors ${activeTab === "me" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Cá nhân
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`font-bold transition-colors ${activeTab === "community" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Cộng đồng
          </button>
        </div>
        <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          {activeTab === "me" ? "Chưa có kỷ niệm nào" : "Chưa có bài đăng nào"}
        </h3>
        <p className="text-slate-500 text-sm">
          {activeTab === "me" 
            ? "Hãy bắt đầu chinh phục Việt Nam bằng cách lưu lại kỷ niệm tại địa điểm đầu tiên!"
            : "Hãy là người đầu tiên chia sẻ kỷ niệm tại đây!"}
        </p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("me")}
            className={`text-lg md:text-xl font-bold pb-1 border-b-2 transition-colors ${activeTab === "me" ? "border-indigo-600 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Của tôi
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`text-lg md:text-xl font-bold pb-1 border-b-2 transition-colors ${activeTab === "community" ? "border-indigo-600 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Cộng đồng
          </button>
        </div>
        {!filterProvince && (
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            Xem tất cả <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative mt-4">
        {/* Vertical line */}
        <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-emerald-200 to-slate-200" />

        <div className="space-y-6">
          {timeline.map((item, index) => {
            const date = formatDate(item.visitedAt);

            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-4 group"
              >
                {/* Date badge */}
                <div className="flex-shrink-0 w-20 text-center">
                  <div
                    className={`relative z-10 w-12 h-12 mx-auto rounded-xl flex flex-col items-center justify-center shadow-md ${
                      item.source === "tour"
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
                        src={(item.images && item.images.length > 0) ? item.images[0] : "/hot1.jpg"}
                        alt={item.provinceName}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                        <Camera size={12} className="text-slate-600" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-800 truncate">
                            {item.provinceName}
                          </h4>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            {item.userId && activeTab === "community" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                                {item.userId.avatar && (
                                  <img src={item.userId.avatar} alt="avatar" className="w-3 h-3 rounded-full object-cover" />
                                )}
                                {item.userId.fullName}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.source === "tour"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {item.source === "tour" ? (
                                <>
                                  <Sparkles size={10} /> Đã xác thực qua tour
                                </>
                              ) : (
                                <>
                                  <MapPin size={10} /> Tự đánh dấu
                                </>
                              )}
                            </span>
                            {activeTab === "me" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                                {item.privacy === "public" ? <Globe size={10} /> : <Lock size={10} />}
                                {item.privacy === "public" ? "Công khai" : "Chỉ mình tôi"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {item.caption && (
                        <p className="text-sm text-slate-600 mt-2 italic border-l-2 border-indigo-200 pl-2">
                          "{item.caption.length > 80 ? item.caption.substring(0, 80) + '...' : item.caption}"
                        </p>
                      )}

                      {item.source === "tour" && (!item.images || item.images.length === 0) && activeTab === "me" && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <a href="/user/bookings" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                            Thêm hình ảnh kỷ niệm <ChevronRight size={12}/>
                          </a>
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(item.visitedAt).toLocaleDateString("vi-VN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        
                        {/* Nút Thích */}
                        {activeTab === "community" && (
                          <button 
                            onClick={() => handleLike(item._id, !!item.isLikedByMe)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
                              item.isLikedByMe 
                                ? "bg-rose-50 text-rose-600" 
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            <Heart size={14} className={item.isLikedByMe ? "fill-rose-500" : ""} />
                            {item.likesCount || 0}
                          </button>
                        )}
                      </div>
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
