"use client";

import React from "react";

interface DestinationData {
  name: string;
  bookings: number;
  revenue: number;
  guests: number;
}

interface DestinationMapProps {
  data: DestinationData[];
}

// Vietnam destination coordinates (approximate for visualization)
const DESTINATION_COORDS: Record<string, { x: number; y: number; region: string }> = {
  // North
  "Hà Nội": { x: 58, y: 18, region: "north" },
  "Hạ Long": { x: 65, y: 16, region: "north" },
  "Sapa": { x: 48, y: 10, region: "north" },
  "Ninh Bình": { x: 55, y: 22, region: "north" },
  "Hà Giang": { x: 52, y: 6, region: "north" },
  "Cao Bằng": { x: 62, y: 8, region: "north" },
  "Lào Cai": { x: 48, y: 8, region: "north" },
  // Central
  "Đà Nẵng": { x: 55, y: 42, region: "central" },
  "Huế": { x: 52, y: 38, region: "central" },
  "Hội An": { x: 56, y: 44, region: "central" },
  "Quảng Bình": { x: 50, y: 34, region: "central" },
  "Nha Trang": { x: 58, y: 55, region: "central" },
  "Quy Nhơn": { x: 58, y: 50, region: "central" },
  "Miền Trung": { x: 55, y: 45, region: "central" },
  "Bình Thuận": { x: 58, y: 60, region: "central" },
  "Phú Yên": { x: 58, y: 52, region: "central" },
  // South
  "TP.HCM": { x: 50, y: 72, region: "south" },
  "Hồ Chí Minh": { x: 50, y: 72, region: "south" },
  "Phú Quốc": { x: 38, y: 78, region: "south" },
  "Đà Lạt": { x: 55, y: 65, region: "south" },
  "Cần Thơ": { x: 45, y: 78, region: "south" },
  "Vũng Tàu": { x: 55, y: 74, region: "south" },
  "Côn Đảo": { x: 62, y: 76, region: "south" },
  "Miền Tây": { x: 42, y: 80, region: "south" },
  // Highlands
  "Đắk Lắk": { x: 55, y: 58, region: "highlands" },
  "Buôn Ma Thuột": { x: 55, y: 58, region: "highlands" },
  "Gia Lai": { x: 58, y: 55, region: "highlands" },
  "Pleiku": { x: 58, y: 55, region: "highlands" },
  "Tây Nguyên": { x: 55, y: 56, region: "highlands" },
  "Kon Tum": { x: 55, y: 52, region: "highlands" },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const DestinationMap: React.FC<DestinationMapProps> = ({ data }) => {
  // Find coordinates for each destination
  const mappedData = data.map((item, index) => {
    // Try to find exact match or partial match
    let coords = DESTINATION_COORDS[item.name];

    if (!coords) {
      // Try partial match
      const key = Object.keys(DESTINATION_COORDS).find(
        k => item.name?.toLowerCase().includes(k.toLowerCase()) ||
             k.toLowerCase().includes(item.name?.toLowerCase() || "")
      );
      if (key) coords = DESTINATION_COORDS[key];
    }

    // Default position if not found
    if (!coords) {
      coords = { x: 50 + (index * 5) % 20, y: 40 + (index * 8) % 30, region: "unknown" };
    }

    return { ...item, coords, index };
  });

  const maxBookings = Math.max(...data.map(d => d.bookings), 1);

  const getMarkerSize = (bookings: number) => {
    const ratio = bookings / maxBookings;
    return Math.max(16, Math.min(36, 16 + ratio * 20));
  };

  const getMarkerColor = (index: number) => {
    const colors = [
      "bg-orange-500",
      "bg-blue-500",
      "bg-emerald-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-amber-500",
    ];
    return colors[index % colors.length];
  };

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-100">
            🗺️
          </span>
          Bản đồ điểm đến
        </h3>
        <p className="mt-8 text-center text-sm text-slate-500">
          Chưa có dữ liệu điểm đến
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-100">
            🗺️
          </span>
          Bản đồ điểm đến
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Phân bố lượt đặt tour theo vùng miền
        </p>
      </div>

      {/* Map Container */}
      <div className="relative h-72 rounded-xl bg-gradient-to-b from-blue-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
        {/* Vietnam outline (simplified SVG) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Simplified Vietnam shape */}
          <path
            d="M 55 5
               Q 70 8 68 15
               L 70 20
               Q 65 25 58 28
               L 55 35
               Q 52 40 55 45
               L 60 50
               Q 62 55 58 60
               L 55 65
               Q 52 70 50 75
               L 45 80
               Q 38 85 35 82
               L 40 75
               Q 45 70 48 65
               L 50 55
               Q 48 45 45 40
               L 42 30
               Q 45 20 50 15
               L 55 5 Z"
            fill="rgba(16, 185, 129, 0.15)"
            stroke="rgba(16, 185, 129, 0.4)"
            strokeWidth="0.5"
          />

          {/* Region labels */}
          <text x="55" y="12" className="fill-slate-400 text-[3px] font-medium">Bắc</text>
          <text x="55" y="42" className="fill-slate-400 text-[3px] font-medium">Trung</text>
          <text x="48" y="75" className="fill-slate-400 text-[3px] font-medium">Nam</text>
        </svg>

        {/* Destination markers */}
        {mappedData.map((item) => {
          const size = getMarkerSize(item.bookings);
          return (
            <div
              key={item.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{
                left: `${item.coords.x}%`,
                top: `${item.coords.y}%`,
              }}
            >
              {/* Pulse animation */}
              <div
                className={`absolute rounded-full ${getMarkerColor(item.index)} opacity-30 animate-ping`}
                style={{ width: size, height: size, left: -size/2, top: -size/2 }}
              />

              {/* Marker */}
              <div
                className={`relative rounded-full ${getMarkerColor(item.index)} border-2 border-white shadow-lg flex items-center justify-center text-white font-bold`}
                style={{ width: size, height: size, fontSize: size * 0.35 }}
              >
                {item.index + 1}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-slate-300">{item.bookings} đặt • {item.guests} khách</p>
                  <p className="text-emerald-400">{formatCurrency(item.revenue)}</p>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {mappedData.slice(0, 6).map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800"
          >
            <div
              className={`h-2.5 w-2.5 rounded-full ${getMarkerColor(item.index)}`}
            />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DestinationMap;
