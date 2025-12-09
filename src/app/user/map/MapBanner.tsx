"use client";

import React, { useEffect, useState } from "react";
import useUser from "#/src/hooks/useUser"; // Adjust path
import { checkinApi } from "@/lib/checkin/checkinApi";
import { FaTrophy, FaShareAlt, FaMapMarkerAlt } from "react-icons/fa";

export default function MapBanner() {
  const { user, isAuthenticated } = useUser();
  const [firstName, setFirstName] = useState("Bạn");
  const [stats, setStats] = useState({
    count: 0,
    percent: 0,
    rank: "Khách du lịch",
  });

  useEffect(() => {
    if (user && user.fullName) {
      const nameParts = user.fullName.trim().split(" ");
      setFirstName(nameParts[nameParts.length - 1]);
    }
  }, [user]);

  // Logic tính Rank & Phần trăm
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await checkinApi.getUserCheckins();
        const uniqueProvinces = new Set(
          res.map((item: any) => item.placeId?.province || item.placeId?.name)
        );

        const count = uniqueProvinces.size;
        const percent = Math.round((count / 63) * 100);

        let rank = "Người mới bắt đầu";
        if (count >= 5) rank = "Người thích vi vu";
        if (count >= 15) rank = "Phượt thủ tập sự";
        if (count >= 30) rank = "Nhà thám hiểm";
        if (count >= 50) rank = "Thổ địa Việt Nam";
        if (count === 63) rank = "Huyền thoại du lịch";

        setStats({ count, percent, rank });
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, [isAuthenticated]);

  return (
    <section className="relative w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: User Greeting */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-emerald-500 p-0.5 overflow-hidden">
            {/* Avatar Placeholder or Real Image */}
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {firstName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              Hành trình của
            </p>
            <h1 className="text-xl font-extrabold text-slate-800">
              {user?.fullName || "Bạn"}
            </h1>
          </div>
        </div>

        {/* Right: Stats Cards (Gody Style) */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Card 1: Số tỉnh */}
          <div className="flex-1 md:flex-none bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <FaMapMarkerAlt />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Đã đi
              </p>
              <p className="text-sm font-black text-slate-700">
                {stats.count}
                <span className="text-xs font-normal text-slate-400">/63</span>
              </p>
            </div>
          </div>

          {/* Card 2: Danh hiệu */}
          <div className="flex-1 md:flex-none bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl px-4 py-2 border border-orange-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
              <FaTrophy />
            </div>
            <div>
              <p className="text-[10px] text-orange-400 font-bold uppercase">
                Danh hiệu
              </p>
              <p className="text-sm font-black text-orange-700">{stats.rank}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
