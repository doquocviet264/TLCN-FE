"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { FaCheck, FaTimes, FaMapMarkerAlt, FaGift, FaHeart, FaSearchPlus, FaSearchMinus, FaRedo } from "react-icons/fa";
import { travelMemoryApi } from "@/lib/checkin/travelMemoryApi";
import { checkinApi } from "@/lib/checkin/checkinApi";
import { useAuthStore } from "#/stores/auth";
import { toast } from "react-hot-toast";
import { VIETNAM_PATHS, MAP_VIEWBOX } from "./VietnamMapPaths"; // Import file data
import MemoryModal from "./MemoryModal";

const COLORS = {
  BOOKING_VISITED: "#10b981", // Xanh ngọc - đã đi qua tour đặt trên web (TỰ ĐỘNG)
  MANUAL_VISITED: "#3b82f6", // Xanh dương - tự đánh dấu (đi ngoài web)
  LOCKED: "#e5e7eb", // Xám - chưa đi
  HOVER: "#fcd34d", // Vàng - đang hover
  STROKE: "#ffffff",
  ARCHIPELAGO: "#f59e0b",
  ARCHIPELAGO_LABEL: "#b45309",
};

const MERGED_PROVINCE_ALIASES: Record<string, string> = {
  "ha giang": "tuyen quang",
};

const MERGED_PROVINCE_LABELS: Record<string, string> = {
  "tuyen quang": "Tuyên Quang (gồm Hà Giang)",
};

const normalizeProvince = (provinceName: string) =>
  provinceName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getMergedProvinceKey = (provinceName: string) => {
  const normalized = normalizeProvince(provinceName);
  return MERGED_PROVINCE_ALIASES[normalized] || normalized;
};

const getProvinceLabel = (provinceName: string) => {
  const mergedKey = getMergedProvinceKey(provinceName);
  return MERGED_PROVINCE_LABELS[mergedKey] || provinceName;
};

const ARCHIPELAGO_SOURCE_PROVINCES = new Set(["VN21", "VN25"]);
const ARCHIPELAGO_MIN_X = 520;
const SPRATLY_MIN_Y = 850;

const splitSvgSubpaths = (pathData: string) =>
  pathData.match(/[Mm][^Mm]*/g) || [pathData];

const getSubpathBounds = (pathData: string) => {
  const numbers = pathData.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;

  for (let i = 0; i < numbers.length - 1; i += 2) {
    maxX = Math.max(maxX, numbers[i]);
    minY = Math.min(minY, numbers[i + 1]);
  }

  return { maxX, minY };
};

const isArchipelagoSubpath = (provinceId: string, subpath: string) => {
  if (!ARCHIPELAGO_SOURCE_PROVINCES.has(provinceId)) return false;

  const bounds = getSubpathBounds(subpath);

  if (provinceId === "VN21") return bounds.maxX >= ARCHIPELAGO_MIN_X;
  if (provinceId === "VN25") {
    return bounds.maxX >= ARCHIPELAGO_MIN_X || bounds.minY >= SPRATLY_MIN_Y;
  }

  return false;
};

const getProvincePathData = (provinceId: string, pathData: string) => {
  if (!ARCHIPELAGO_SOURCE_PROVINCES.has(provinceId)) return pathData;

  return splitSvgSubpaths(pathData)
    .filter((subpath) => !isArchipelagoSubpath(provinceId, subpath))
    .join("");
};

const ARCHIPELAGO_PATHS = VIETNAM_PATHS.flatMap((province) =>
  splitSvgSubpaths(province.d)
    .filter((subpath) => isArchipelagoSubpath(province.id, subpath))
    .map((d, index) => ({
      id: `${province.id}-archipelago-${index}`,
      d,
    }))
);

const ARCHIPELAGO_LABELS = [
  { id: "hoang-sa", label: "Quần đảo Hoàng Sa", x: 704, y: 427 },
  { id: "truong-sa", label: "Quần đảo Trường Sa", x: 754, y: 858 },
];

const MANUAL_STORAGE_KEY = "ahh_manual_provinces";

const getStoredManualProvinces = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(MANUAL_STORAGE_KEY);
    if (stored) {
      const arr = JSON.parse(stored);
      return new Set(arr.map((p: string) => getMergedProvinceKey(p)));
    }
  } catch (e) {
    console.error("Error reading manual provinces:", e);
  }
  return new Set();
};

const saveManualProvince = (provinceName: string) => {
  try {
    const current = getStoredManualProvinces();
    current.add(getMergedProvinceKey(provinceName));
    localStorage.setItem(MANUAL_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error("Error saving manual province:", e);
  }
};

export default function VietnamJourneyMap() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mapRef = useRef<SVGSVGElement | null>(null);

  // Tỉnh từ booking đã hoàn thành trên web (TỰ ĐỘNG - xanh ngọc)
  const [bookingProvinces, setBookingProvinces] = useState<Set<string>>(
    new Set()
  );
  const [provinceProgress, setProvinceProgress] = useState<Record<string, any>>({});
  
  const [popupTab, setPopupTab] = useState<"me" | "community">("me");
  const [communityMemories, setCommunityMemories] = useState<any[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(
    null
  );

  useEffect(() => {
    if (selectedProvince && popupTab === "community") {
      setLoadingCommunity(true);
      travelMemoryApi.getPublicMemories(getProvinceLabel(selectedProvince), 1, 10)
        .then(res => setCommunityMemories(res.data || []))
        .catch(err => console.error(err))
        .finally(() => setLoadingCommunity(false));
    }
  }, [selectedProvince, popupTab]);

  const handlePopupLike = async (id: string, isLiked: boolean) => {
    try {
      setCommunityMemories(prev => prev.map(m => m._id === id ? {
        ...m,
        isLikedByMe: !isLiked,
        likesCount: (m.likesCount || 0) + (isLiked ? -1 : 1)
      } : m));
      if (isLiked) await travelMemoryApi.unlikeMemory(id);
      else await travelMemoryApi.likeMemory(id);
    } catch (e) {
      console.error(e);
    }
  };
  // Tỉnh tự đánh dấu - đi ngoài web này (THỦ CÔNG - xanh dương)
  const [manualProvinces, setManualProvinces] = useState<Set<string>>(
    new Set()
  );
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );

  const [showManualSuccess, setShowManualSuccess] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  // 1. FETCH DATA - Lấy dữ liệu hành trình từ 2 nguồn
  useEffect(() => {
    const fetchJourney = async () => {
      if (!user) return;
      try {
        // Gọi API mới lấy dữ liệu kết hợp: booking (tự động) + manual (thủ công)
        const res = await checkinApi.getFullJourney();
        console.log("Dữ liệu hành trình từ Server:", res);

        // Tỉnh từ booking đã hoàn thành (TỰ ĐỘNG - user đi tour trên web)
        const fromBookingsSet = new Set<string>();
        if (res.fromBookings && Array.isArray(res.fromBookings)) {
          res.fromBookings.forEach((p: string) => {
            fromBookingsSet.add(getMergedProvinceKey(p));
          });
        }

        // Tỉnh từ manual check-in (THỦ CÔNG - user đi ngoài web)
        const fromManualSet = new Set<string>();
        const progressByKey: Record<string, any> = {};
        
        // Phase 1 API returns `progress` array
        if (res.progress && Array.isArray(res.progress)) {
          res.progress.forEach((p: any) => {
            progressByKey[getMergedProvinceKey(p.provinceName)] = p;
            if (p.source === "tour" || p.source === "both") {
              fromBookingsSet.add(getMergedProvinceKey(p.provinceName));
            }
            if (p.source === "manual" || p.source === "both") {
              fromManualSet.add(getMergedProvinceKey(p.provinceName));
            }
          });
        } else {
          // Fallback cho API cũ
          if (res.fromManualCheckins && Array.isArray(res.fromManualCheckins)) {
            res.fromManualCheckins.forEach((p: string) => {
              fromManualSet.add(getMergedProvinceKey(p));
            });
          }
        }

        // Kết hợp với localStorage (fallback nếu API chưa sync)
        setBookingProvinces(fromBookingsSet);
        setManualProvinces(fromManualSet);
        setProvinceProgress(progressByKey);

        console.log("Từ booking (tự động):", Array.from(fromBookingsSet));
        console.log("Tự đánh dấu (thủ công):", Array.from(fromManualSet));
      } catch (error) {
        console.error("Lỗi tải hành trình:", error);
        // Fallback: chỉ lấy từ localStorage
        const storedManual = getStoredManualProvinces();
        setManualProvinces(storedManual);
        setProvinceProgress({});
      }
    };

    fetchJourney();
  }, [user]);

  // 2. Xem tour tại tỉnh này (dẫn đến trang destination)
  const handleViewTours = () => {
    if (!selectedProvince) return;
    // Encode tên tỉnh để search
    const searchQuery = encodeURIComponent(selectedProvince);
    router.push(`/user/destination?search=${searchQuery}`);
    setSelectedProvince(null);
  };

  // 3. ĐÁNH DẤU THỦ CÔNG - Cho những địa điểm đã đi NGOÀI web này
  const handleManualMark = async () => {
    if (!selectedProvince || isLoadingAction) return;

    setIsLoadingAction(true);
    try {
      // Gọi API đánh dấu thủ công (nếu có)
      try {
        await checkinApi.manualMarkProvince(selectedProvince);
      } catch {
        // Nếu API lỗi, vẫn lưu local
        console.log("API manual mark không available, lưu local");
      }

      // Lưu vào localStorage
      saveManualProvince(selectedProvince);

      // Tô màu xanh dương cho tỉnh đánh dấu thủ công
      setManualProvinces((prev) =>
        new Set(prev).add(getMergedProvinceKey(selectedProvince))
      );

      // Bắn pháo hoa nhẹ
      (confetti as any)({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
      });

      // Hiện thông báo thành công
      setShowManualSuccess(true);
      setTimeout(() => setShowManualSuccess(false), 2000);

      setSelectedProvince(null);
    } catch (error: any) {
      console.error("Lỗi đánh dấu thủ công:", error);
      toast.error("Đánh dấu thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoadingAction(false);
    }
  };

  // 4. ZOOM/PAN CONTROLS
  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const resetMap = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const handlePathClick = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    setSelectedProvince(title);
    setPopupTab("me");
    const x = Math.min(e.clientX, window.innerWidth - 320);
    const y = Math.min(e.clientY, window.innerHeight - 250);
    setPopupPos({ x, y });
  };

  const selectedProvinceKey = selectedProvince
    ? getMergedProvinceKey(selectedProvince)
    : "";
  const selectedProgress = selectedProvinceKey
    ? provinceProgress[selectedProvinceKey]
    : undefined;

  return (
    <section className="w-full max-w-5xl mx-auto px-4 mt-8 select-none">
      <div className="relative w-full aspect-[4/3] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white/90 backdrop-blur p-2 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700"
          >
            <FaSearchPlus />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700"
          >
            <FaSearchMinus />
          </button>
          <button
            onClick={resetMap}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700"
          >
            <FaRedo />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-100 flex flex-col gap-3 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#10b981] shadow-sm ring-1 ring-emerald-200"></span>
            <span>Đã đi qua tour (tự động)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-sm ring-1 ring-blue-200"></span>
            <span>Tự đánh dấu (đi ngoài web)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#e5e7eb] ring-1 ring-slate-300"></span>
            <span>Chưa đi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#fcd34d] shadow-sm ring-1 ring-yellow-200"></span>
            <span>Đang chọn</span>
          </div>
        </div>

        {/* SVG Area */}
        <div
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            setIsDragging(true);
            setLastPos({ x: e.clientX, y: e.clientY });
          }}
          onMouseMove={(e) => {
            if (!isDragging || !lastPos) return;
            const dx = e.clientX - lastPos.x;
            const dy = e.clientY - lastPos.y;
            setTranslate((p) => ({ x: p.x + dx, y: p.y + dy }));
            setLastPos({ x: e.clientX, y: e.clientY });
            // Tooltip pos
            const rect = mapRef.current?.getBoundingClientRect();
            if (rect)
              setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <svg
            ref={mapRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={MAP_VIEWBOX}
            className="w-full h-full transition-transform duration-100"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            }}
          >
            <g id="vietnam-provinces">
              {VIETNAM_PATHS.map((p) => {
                const normalizedTitle = getMergedProvinceKey(p.title);
                const provinceLabel = getProvinceLabel(p.title);
                const isFromBooking = bookingProvinces.has(normalizedTitle);
                const isManual = manualProvinces.has(normalizedTitle);
                const isHovered = hoveredName === provinceLabel;
                const isSelected = selectedProvince === p.title;

                // Xác định màu fill - ưu tiên: selected > hover > booking > manual > locked
                const getFillColor = () => {
                  if (isSelected) return COLORS.HOVER;
                  if (isHovered) {
                    if (isFromBooking) return "#059669"; // Đậm hơn khi hover booking
                    if (isManual) return "#2563eb"; // Đậm hơn khi hover manual
                    return COLORS.HOVER;
                  }
                  if (isFromBooking) return COLORS.BOOKING_VISITED;
                  if (isManual) return COLORS.MANUAL_VISITED;
                  return COLORS.LOCKED;
                };

                return (
                  <path
                    key={p.id}
                    d={getProvincePathData(p.id, p.d)}
                    fill={getFillColor()}
                    stroke={COLORS.STROKE}
                    strokeWidth={0.5}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredName(provinceLabel)}
                    onMouseLeave={() => setHoveredName(null)}
                    onClick={(e) => handlePathClick(e, p.title)}
                  />
                );
              })}
            </g>
            <g
              id="vietnam-archipelagos"
              pointerEvents="none"
              aria-hidden="true"
              className="select-none"
            >
              {ARCHIPELAGO_PATHS.map((path) => (
                <path
                  key={path.id}
                  d={path.d}
                  fill={COLORS.ARCHIPELAGO}
                  stroke={COLORS.STROKE}
                  strokeWidth={0.7}
                  opacity={0.92}
                />
              ))}
              {ARCHIPELAGO_LABELS.map((item) => (
                <text
                  key={item.id}
                  x={item.x}
                  y={item.y}
                  fill={COLORS.ARCHIPELAGO_LABEL}
                  stroke={COLORS.STROKE}
                  strokeWidth={3}
                  paintOrder="stroke"
                  fontSize={15}
                  fontWeight={700}
                  letterSpacing={0}
                >
                  {item.label}
                </text>
              ))}
            </g>
          </svg>
        </div>

        {/* Tooltip */}
        {hoveredName && mousePos && (
          <div
            className="absolute z-30 px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: mousePos.x, top: mousePos.y - 10 }}
          >
            {hoveredName}
          </div>
        )}

        {/* Province Info Popup */}
        <AnimatePresence>
          {selectedProvince && popupPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-50 bg-white rounded-2xl shadow-2xl p-6 w-80 border border-slate-100"
              style={{ left: popupPos.x, top: popupPos.y }}
            >
              <button
                onClick={() => setSelectedProvince(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
              >
                <FaTimes />
              </button>
              
              <div className="flex flex-col items-center w-full">
                {/* Tabs */}
                <div className="flex w-full mb-4 bg-slate-100 rounded-lg p-1">
                  <button
                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${
                      popupTab === "me" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                    onClick={() => setPopupTab("me")}
                  >
                    Của tôi
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${
                      popupTab === "community" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                    onClick={() => setPopupTab("community")}
                  >
                    Cộng đồng
                  </button>
                </div>

                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                  <FaMapMarkerAlt size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 text-center">
                  {getProvinceLabel(selectedProvince)}
                </h3>
                {selectedProgress && (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selectedProgress.memoryCount || 0} kỷ niệm đã lưu
                  </p>
                )}

                {popupTab === "me" ? (
                  <div className="flex flex-col items-center text-center w-full">
                    {/* Status Badges */}
                {bookingProvinces.has(getMergedProvinceKey(selectedProvince)) ? (
                  <div className="mt-3 px-4 py-3 bg-emerald-100/50 text-emerald-700 rounded-lg text-sm font-bold flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-emerald-500" />
                      Đã xác thực qua tour AHH Travel
                    </div>
                    {/* Province Stamp */}
                    <div className="mt-2 w-full max-w-[220px] border-[3px] border-emerald-500/60 border-dashed rounded-lg p-2 text-center transform -rotate-3 bg-emerald-50/50 relative overflow-hidden shadow-sm">
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <FaMapMarkerAlt size={40} className="text-emerald-600" />
                      </div>
                      <p className="text-[13px] uppercase tracking-[0.15em] font-black text-emerald-600 mb-0.5 relative z-10">
                        Đã chinh phục
                      </p>
                      <p className="text-[9px] text-emerald-600/70 font-semibold uppercase relative z-10">
                        Xác thực: Tour AHH Travel
                      </p>
                    </div>
                  </div>
                ) : manualProvinces.has(getMergedProvinceKey(selectedProvince)) ? (
                  <div className="mt-3 px-4 py-3 bg-blue-100/50 text-blue-700 rounded-lg text-sm font-bold flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-blue-500" />
                      Đã tự đánh dấu
                    </div>
                    {/* Province Stamp */}
                    <div className="mt-2 w-full max-w-[220px] border-[3px] border-blue-500/60 border-dashed rounded-lg p-2 text-center transform rotate-2 bg-blue-50/50 relative overflow-hidden shadow-sm">
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <FaCheck size={40} className="text-blue-600" />
                      </div>
                      <p className="text-[13px] uppercase tracking-[0.15em] font-black text-blue-600 mb-0.5 relative z-10">
                        Đã ghé thăm
                      </p>
                      <p className="text-[9px] text-blue-600/70 font-semibold uppercase relative z-10">
                        Nguồn: Tự đánh dấu
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-500 my-3">
                      Bạn đã từng đến {selectedProvince} ngoài website này?
                    </p>
                  </>
                )}

                <div className="mt-4 w-full space-y-2">
                  <button
                    onClick={() => setIsMemoryModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <FaCheck />
                    Thêm kỷ niệm
                  </button>

                  {!(bookingProvinces.has(getMergedProvinceKey(selectedProvince)) || manualProvinces.has(getMergedProvinceKey(selectedProvince))) && (
                    <>
                      <div className="my-3 flex items-center gap-2">
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <span className="text-xs text-slate-400">hoặc</span>
                        <div className="flex-1 h-px bg-slate-200"></div>
                      </div>
                      <button
                        onClick={handleViewTours}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        <FaGift />
                        Xem tour tại {selectedProvince}
                      </button>
                      <p className="text-xs text-slate-400 mt-2 italic">
                        * Đặt tour và hoàn thành sẽ tự động đánh dấu
                      </p>
                    </>
                  )}
                </div>

                {/* Link xem tour (cho tỉnh đã đánh dấu) */}
                {(bookingProvinces.has(getMergedProvinceKey(selectedProvince)) || manualProvinces.has(getMergedProvinceKey(selectedProvince))) && (
                  <button
                    onClick={handleViewTours}
                    className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium underline"
                  >
                    Xem các tour tại {selectedProvince}
                  </button>
                )}
                  </div>
                ) : (
                  <div className="w-full mt-4 flex flex-col gap-3 max-h-80 overflow-y-auto pr-1 text-left custom-scrollbar">
                    {loadingCommunity ? (
                      <p className="text-xs text-center text-slate-400 my-4">Đang tải...</p>
                    ) : communityMemories.length === 0 ? (
                      <p className="text-xs text-center text-slate-400 my-4">Chưa có bài đăng công khai nào tại đây.</p>
                    ) : (
                      communityMemories.map(m => (
                        <div key={m._id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               {m.userId?.avatar ? (
                                 <img src={m.userId.avatar} className="w-6 h-6 rounded-full object-cover" />
                               ) : (
                                 <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                               )}
                               <span className="text-xs font-bold text-slate-700">{m.userId?.fullName || "Người dùng"}</span>
                             </div>
                             <span className="text-[10px] text-slate-400">{new Date(m.visitedAt).toLocaleDateString("vi-VN")}</span>
                           </div>
                           
                           {m.images && m.images.length > 0 && (
                             <img src={m.images[0]} className="w-full h-24 object-cover rounded-lg" />
                           )}
                           
                           {m.caption && <p className="text-xs text-slate-600 line-clamp-2">"{m.caption}"</p>}
                           
                           <div className="flex items-center justify-between mt-1">
                             <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${m.source === "tour" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                               {m.source === "tour" ? "Qua tour AHH" : "Tự đánh dấu"}
                             </span>
                             
                             <button onClick={() => handlePopupLike(m._id, !!m.isLikedByMe)} className={`flex items-center gap-1 text-[10px] font-bold transition-transform active:scale-90 ${m.isLikedByMe ? "text-rose-500" : "text-slate-400 hover:text-slate-600"}`}>
                               <FaHeart /> {m.likesCount || 0}
                             </button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual Success Toast */}
      <AnimatePresence>
        {showManualSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FaCheck size={20} />
            </div>
            <div>
              <p className="font-bold">Đã đánh dấu thành công!</p>
              <p className="text-sm text-blue-100">Địa điểm đã được thêm vào bản đồ</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Kỷ Niệm */}
      {selectedProvince && (
        <MemoryModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          provinceName={selectedProvince}
          onSuccess={(provinceUnlocked) => {
            const key = getMergedProvinceKey(selectedProvince);
            setProvinceProgress((prev) => {
              const current = prev[key] || {};
              const currentSource = current.source || "manual";
              return {
                ...prev,
                [key]: {
                  ...current,
                  provinceName: selectedProvince,
                  source: currentSource === "tour" ? "both" : currentSource,
                  memoryCount: (current.memoryCount || 0) + 1,
                },
              };
            });
            setManualProvinces((prev) => new Set(prev).add(key));
            if (provinceUnlocked) {
              (confetti as any)({
                particleCount: 80,
                spread: 50,
                origin: { y: 0.6 },
                colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
              });
            }
            setSelectedProvince(null);
          }}
        />
      )}
    </section>
  );
}
