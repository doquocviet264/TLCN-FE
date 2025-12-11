"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Trophy,
  Flame,
  Target,
  Star,
  TrendingUp,
  Award,
  Compass,
} from "lucide-react";
import { checkinApi } from "@/lib/checkin/checkinApi";
import useUser from "#/src/hooks/useUser";

// Animated counter component
function AnimatedCounter({
  value,
  duration = 2000,
}: {
  value: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const incrementTime = duration / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

// Circular progress component
function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "#10b981",
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min((value / max) * 100, 100);
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-800">
          <AnimatedCounter value={value} />
        </span>
        <span className="text-xs text-slate-500">/{max} tỉnh</span>
      </div>
    </div>
  );
}

// Rank badge component
const RANKS = [
  { min: 0, name: "Tân binh", icon: "🌱", color: "from-slate-400 to-slate-500" },
  { min: 5, name: "Lữ khách", icon: "🎒", color: "from-green-400 to-emerald-500" },
  { min: 10, name: "Phượt thủ", icon: "🏕️", color: "from-blue-400 to-cyan-500" },
  { min: 20, name: "Thám hiểm gia", icon: "🧭", color: "from-purple-400 to-violet-500" },
  { min: 35, name: "Chinh phục giả", icon: "⛰️", color: "from-orange-400 to-amber-500" },
  { min: 50, name: "Thổ địa", icon: "🏆", color: "from-yellow-400 to-orange-500" },
  { min: 63, name: "Huyền thoại", icon: "👑", color: "from-rose-400 to-pink-500" },
];

function getRank(count: number) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (count >= r.min) rank = r;
  }
  return rank;
}

function getNextRank(count: number) {
  for (const r of RANKS) {
    if (count < r.min) return r;
  }
  return null;
}

export default function JourneyStats() {
  const { user, isAuthenticated } = useUser();
  const [stats, setStats] = useState({
    totalProvinces: 0,
    manualProvinces: 0,
    tourProvinces: 0,
    totalVouchers: 0,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await checkinApi.getUserJourney();
        const provinces = res.provinces || [];
        const manualProvinces = res.manualProvinces || [];

        setStats({
          totalProvinces: provinces.length + manualProvinces.length,
          manualProvinces: manualProvinces.length,
          tourProvinces: provinces.length,
          totalVouchers: provinces.length, // Mỗi check-in qua tour = 1 voucher
          streak: Math.floor(Math.random() * 7) + 1, // Demo streak
        });
      } catch (error) {
        console.error("Error fetching journey stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAuthenticated]);

  const currentRank = getRank(stats.totalProvinces);
  const nextRank = getNextRank(stats.totalProvinces);
  const progressToNext = nextRank
    ? ((stats.totalProvinces - currentRank.min) / (nextRank.min - currentRank.min)) * 100
    : 100;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Tiến độ</p>
              <h3 className="text-4xl font-black">
                {Math.round((stats.totalProvinces / 63) * 100)}%
              </h3>
              <p className="text-emerald-200 text-xs mt-1">
                {stats.totalProvinces}/63 tỉnh thành
              </p>
            </div>
            <CircularProgress
              value={stats.totalProvinces}
              max={63}
              size={80}
              strokeWidth={6}
              color="#ffffff"
            />
          </div>
        </motion.div>

        {/* Rank Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-gradient-to-br ${currentRank.color} rounded-2xl p-6 text-white shadow-lg`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Danh hiệu</p>
              <h3 className="text-2xl font-black">{currentRank.name}</h3>
              {nextRank && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span>Tiếp theo: {nextRank.name}</span>
                    <span>{nextRank.icon}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNext}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>
              )}
            </div>
            <span className="text-4xl">{currentRank.icon}</span>
          </div>
        </motion.div>

        {/* Vouchers Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Voucher đã nhận</p>
              <h3 className="text-3xl font-black text-slate-800">
                <AnimatedCounter value={stats.totalVouchers} />
              </h3>
              <p className="text-emerald-600 text-xs mt-1 font-medium">
                🎁 Phiếu giảm giá
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </motion.div>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Chuỗi hoạt động</p>
              <h3 className="text-3xl font-black text-slate-800">
                <AnimatedCounter value={stats.streak} /> ngày
              </h3>
              <p className="text-orange-600 text-xs mt-1 font-medium">
                🔥 Đang giữ streak!
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Breakdown Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Qua tour</p>
              <p className="text-xl font-bold text-blue-700">{stats.tourProvinces}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Compass className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Tự đánh dấu</p>
              <p className="text-xl font-bold text-purple-700">{stats.manualProvinces}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Còn lại</p>
              <p className="text-xl font-bold text-emerald-700">{63 - stats.totalProvinces}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Xếp hạng</p>
              <p className="text-xl font-bold text-amber-700">Top 10%</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
