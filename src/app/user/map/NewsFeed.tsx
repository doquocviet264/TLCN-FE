"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  Clock,
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Award,
  Compass,
  Mountain,
  TreePine,
  Activity,
} from "lucide-react";
import { checkinApi } from "@/lib/checkin/checkinApi";
import useUser from "#/src/hooks/useUser";

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vừa xong";
};

// Sample images for provinces
const PROVINCE_IMAGES: Record<string, string> = {
  "ha noi": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=800",
  "ho chi minh": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
  "da nang": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
  "quang ninh": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
  "lao cai": "https://images.unsplash.com/photo-1570366583862-f91883984fde?w=800",
  "khanh hoa": "https://images.unsplash.com/photo-1573790387438-4da905039392?w=800",
  "lam dong": "https://images.unsplash.com/photo-1586595256352-14d4bc5e5fc7?w=800",
};

const getProvinceImage = (province: string) => {
  const normalized = province
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    PROVINCE_IMAGES[normalized] ||
    `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800`
  );
};

// Simplified Achievements list for Timeline
const ACHIEVEMENTS = [
  { id: "first_step", name: "Bước chân đầu tiên", req: 1, icon: MapPin, color: "from-green-400 to-emerald-500", rarity: "Thường" },
  { id: "explorer_5", name: "Lữ khách mới", req: 5, icon: Compass, color: "from-blue-400 to-cyan-500", rarity: "Thường" },
  { id: "explorer_10", name: "Phượt thủ tập sự", req: 10, icon: Mountain, color: "from-purple-400 to-violet-500", rarity: "Không phổ biến" },
  { id: "explorer_20", name: "Thám hiểm gia", req: 20, icon: TreePine, color: "from-teal-400 to-emerald-500", rarity: "Không phổ biến" },
  { id: "explorer_35", name: "Chinh phục nửa Việt Nam", req: 35, icon: Sparkles, color: "from-amber-400 to-orange-500", rarity: "Hiếm" },
  { id: "explorer_50", name: "Thổ địa", req: 50, icon: Award, color: "from-rose-400 to-pink-500", rarity: "Sử thi" },
  { id: "explorer_63", name: "Huyền thoại Việt Nam", req: 63, icon: Sparkles, color: "from-yellow-400 to-amber-500", rarity: "Huyền thoại" },
];

type TimelineEvent = {
  id: string;
  type: "checkin" | "achievement";
  date: Date;
  // For checkins
  province?: string;
  source?: "tour" | "manual";
  image?: string;
  // For achievements
  achievement?: typeof ACHIEVEMENTS[0];
};

export default function NewsFeed() {
  const { user, isAuthenticated } = useUser();
  const [feed, setFeed] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareEvent, setShareEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await checkinApi.getUserJourney();
        const events: TimelineEvent[] = [];
        
        const tourProvinces = res.provinces || [];
        const manualProvinces = res.manualProvinces || [];
        const totalProvinces = tourProvinces.length + manualProvinces.length;

        // 1. Generate Check-in events
        tourProvinces.forEach((p: string, idx: number) => {
          events.push({
            id: `chk-tour-${idx}`,
            type: "checkin",
            date: new Date(Date.now() - idx * 5 * 24 * 60 * 60 * 1000), // Mock date
            province: p,
            source: "tour",
            image: getProvinceImage(p),
          });
        });

        manualProvinces.forEach((p: string, idx: number) => {
          events.push({
            id: `chk-man-${idx}`,
            type: "checkin",
            date: new Date(Date.now() - (events.length + idx) * 3 * 24 * 60 * 60 * 1000), // Mock date
            province: p,
            source: "manual",
            image: getProvinceImage(p),
          });
        });

        // 2. Generate Achievement events
        let count = 0;
        ACHIEVEMENTS.forEach((ach) => {
          if (totalProvinces >= ach.req) {
            count++;
            events.push({
              id: `ach-${ach.id}`,
              type: "achievement",
              date: new Date(Date.now() - count * 4 * 24 * 60 * 60 * 1000), // Mock date intertwining with checkins
              achievement: ach,
            });
          }
        });

        // Sort descending by date
        events.sort((a, b) => b.date.getTime() - a.date.getTime());
        setFeed(events);
      } catch (error) {
        console.error("Error fetching feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [isAuthenticated]);

  // Inject mock data immediately if feed is empty after loading
  useEffect(() => {
    if (!loading && feed.length === 0) {
      const mockEvents: TimelineEvent[] = [
        {
          id: "mock-1",
          type: "achievement",
          date: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
          achievement: ACHIEVEMENTS[0], // Bước chân đầu tiên
        },
        {
          id: "mock-2",
          type: "checkin",
          date: new Date(Date.now() - 5 * 3600 * 1000), // 5 hours ago
          province: "Hà Nội",
          source: "tour",
          image: getProvinceImage("Hà Nội"),
        },
        {
          id: "mock-3",
          type: "achievement",
          date: new Date(Date.now() - 24 * 3600 * 1000), // 1 day ago
          achievement: ACHIEVEMENTS[1], // Lữ khách mới
        },
        {
          id: "mock-4",
          type: "checkin",
          date: new Date(Date.now() - 2 * 24 * 3600 * 1000), // 2 days ago
          province: "Hồ Chí Minh",
          source: "manual",
          image: getProvinceImage("Hồ Chí Minh"),
        }
      ];
      setFeed(mockEvents);
    }
  }, [loading, feed.length]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-200 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-200 rounded w-1/6" />
              </div>
            </div>
            <div className="h-64 bg-slate-200 rounded-2xl w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
          <Activity className="text-orange-500" size={24} />
          Bảng tin Cộng đồng
        </h2>
      </div>

      {/* Feed Cards */}
      {feed.map((event, index) => {
        const isAchievement = event.type === "achievement";
        const Icon = isAchievement ? event.achievement?.icon : undefined;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Card Header (User Info) */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                  <Image
                    src={user?.avatarUrl || "https://ui-avatars.com/api/?name=" + (user?.fullName || "User") + "&background=0D8ABC&color=fff"}
                    alt="Avatar"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                    {user?.fullName || "Người dùng"}
                  </h4>
                  <div className="flex items-center text-xs text-slate-500 mt-0.5 gap-1.5">
                    <span>{timeAgo(event.date)}</span>
                    {event.type === "checkin" && (
                      <>
                        <span>•</span>
                        <MapPin size={12} className="text-orange-500" />
                        <span className="font-medium">{event.province}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Body */}
            {isAchievement ? (
              // Achievement Body
              <div className="px-4 pb-4">
                <div className="text-sm text-slate-700 mb-3">
                  Tuyệt vời! Bạn vừa mở khóa một danh hiệu mới trên hành trình của mình 🎉
                </div>
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${event.achievement?.color} p-6 text-center text-white shadow-inner`}>
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl mb-4 border border-white/30">
                      {Icon && <Icon size={32} className="text-white drop-shadow-md" />}
                    </div>
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/20">
                      {event.achievement?.rarity}
                    </span>
                    <h3 className="text-2xl font-black drop-shadow-md">{event.achievement?.name}</h3>
                  </div>
                </div>
              </div>
            ) : (
              // Check-in Body
              <div className="px-0">
                <div className="px-4 mb-3 text-sm text-slate-700">
                  Đã đặt chân đến vùng đất <span className="font-bold text-slate-900">{event.province}</span>! 
                  {event.source === "tour" ? " (Đi cùng AHH Travel)" : ""}
                </div>
                <div className="relative w-full aspect-video bg-slate-100">
                  <Image
                    src={event.image || "/hot1.jpg"}
                    alt={event.province || "Location"}
                    fill
                    className="object-cover"
                  />
                  {event.source === "tour" && (
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border border-emerald-100">
                      <Sparkles size={14} /> +1 Voucher
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Card Footer (Mock Interactions) */}
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium text-sm">
                <Heart size={18} /> Thích
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium text-sm">
                <MessageCircle size={18} /> Bình luận
              </button>
              <button 
                onClick={() => setShareEvent(event)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium text-sm"
              >
                <Share2 size={18} /> Chia sẻ
              </button>
            </div>
          </motion.div>
        );
      })}

      {/* Share Modal (Graphic Poster Mockup) */}
      {shareEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative"
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Chia sẻ khoảnh khắc</h3>
              <button 
                onClick={() => setShareEvent(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>

            {/* Poster Canvas UI */}
            <div className="p-6 bg-slate-50 flex justify-center">
              <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-xl relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 border-[8px] border-white flex flex-col">
                
                {/* Header Logo */}
                <div className="flex items-center justify-between px-4 pt-4 relative z-10">
                  <span className="text-white font-black tracking-widest text-sm">AHH TRAVEL</span>
                  <Sparkles size={16} className="text-orange-400" />
                </div>

                {/* Poster Content */}
                <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                  {shareEvent.type === "achievement" ? (
                    <div className="text-center w-full">
                      <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl mb-4 border border-white/30">
                        {shareEvent.achievement?.icon && React.createElement(shareEvent.achievement.icon, { size: 40, className: "text-white" })}
                      </div>
                      <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Mở khóa danh hiệu</p>
                      <h2 className="text-2xl font-black text-white drop-shadow-md px-2 leading-tight">
                        {shareEvent.achievement?.name}
                      </h2>
                    </div>
                  ) : (
                    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                       <Image
                          src={shareEvent.image || "/hot1.jpg"}
                          alt={shareEvent.province || "Location"}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <div className="flex items-center gap-1.5 text-orange-400 mb-1">
                            <MapPin size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Đã đặt chân đến</span>
                          </div>
                          <h2 className="text-2xl font-black leading-tight drop-shadow-lg">{shareEvent.province}</h2>
                        </div>
                    </div>
                  )}
                </div>

                {/* Footer User Info */}
                <div className="p-4 bg-black/20 backdrop-blur-md flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                    <Image
                      src={user?.avatarUrl || "https://ui-avatars.com/api/?name=" + (user?.fullName || "User") + "&background=fff&color=0D8ABC"}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-none mb-1">{user?.fullName || "Khách du lịch"}</p>
                    <p className="text-blue-200 text-xs">{shareEvent.type === "achievement" ? "Chinh phục Việt Nam" : "Nhật ký hành trình"}</p>
                  </div>
                </div>

                {/* Overlay patterns */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none mix-blend-overlay" />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-3">
              <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-3 font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                Đăng lên Facebook
              </button>
              <button className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-3 font-bold text-sm hover:bg-slate-200 transition-colors">
                Tải ảnh xuống
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
