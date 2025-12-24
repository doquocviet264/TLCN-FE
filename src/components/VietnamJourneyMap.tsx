"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  FaTimes,
  FaMapMarkerAlt,
  FaSearchPlus,
  FaSearchMinus,
  FaRedo,
  FaCheck,
  FaGift,
} from "react-icons/fa";
import { checkinApi } from "@/lib/checkin/checkinApi";
import { useAuthStore } from "#/stores/auth";
import { VIETNAM_PATHS, MAP_VIEWBOX } from "./VietnamMapPaths"; // Import file data

const COLORS = {
  BOOKING_VISITED: "#10b981", // Xanh ngọc - đã đi qua tour đặt trên web (TỰ ĐỘNG)
  MANUAL_VISITED: "#3b82f6", // Xanh dương - tự đánh dấu (đi ngoài web)
  LOCKED: "#e5e7eb", // Xám - chưa đi
  HOVER: "#fcd34d", // Vàng - đang hover
  STROKE: "#ffffff",
};

export default function VietnamJourneyMap() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mapRef = useRef<SVGSVGElement | null>(null);

  // Tỉnh từ booking đã hoàn thành trên web (TỰ ĐỘNG - xanh ngọc)
  const [bookingProvinces, setBookingProvinces] = useState<Set<string>>(
    new Set()
  );
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

  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [showManualSuccess, setShowManualSuccess] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  // Normalize string helper
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  // Helper: Lưu/lấy manual provinces từ localStorage
  const MANUAL_STORAGE_KEY = "ahh_manual_provinces";

  const getStoredManualProvinces = (): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(MANUAL_STORAGE_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        return new Set(arr.map((p: string) => normalize(p)));
      }
    } catch (e) {
      console.error("Error reading manual provinces:", e);
    }
    return new Set();
  };

  const saveManualProvince = (provinceName: string) => {
    try {
      const current = getStoredManualProvinces();
      current.add(normalize(provinceName));
      localStorage.setItem(MANUAL_STORAGE_KEY, JSON.stringify(Array.from(current)));
    } catch (e) {
      console.error("Error saving manual province:", e);
    }
  };

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
            fromBookingsSet.add(normalize(p));
          });
        }

        // Tỉnh từ manual check-in (THỦ CÔNG - user đi ngoài web)
        const fromManualSet = new Set<string>();
        if (res.fromManualCheckins && Array.isArray(res.fromManualCheckins)) {
          res.fromManualCheckins.forEach((p: string) => {
            fromManualSet.add(normalize(p));
          });
        }

        // Kết hợp với localStorage (fallback nếu API chưa sync)
        const storedManual = getStoredManualProvinces();
        storedManual.forEach((p) => fromManualSet.add(p));

        setBookingProvinces(fromBookingsSet);
        setManualProvinces(fromManualSet);

        console.log("Từ booking (tự động):", Array.from(fromBookingsSet));
        console.log("Tự đánh dấu (thủ công):", Array.from(fromManualSet));
      } catch (error) {
        console.error("Lỗi tải hành trình:", error);
        // Fallback: chỉ lấy từ localStorage
        const storedManual = getStoredManualProvinces();
        setManualProvinces(storedManual);
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
      } catch (apiError) {
        // Nếu API lỗi, vẫn lưu local
        console.log("API manual mark không available, lưu local");
      }

      // Lưu vào localStorage
      saveManualProvince(selectedProvince);

      // Tô màu xanh dương cho tỉnh đánh dấu thủ công
      setManualProvinces((prev) =>
        new Set(prev).add(normalize(selectedProvince))
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
      alert("Đánh dấu thất bại. Vui lòng thử lại!");
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
    const x = Math.min(e.clientX, window.innerWidth - 320);
    const y = Math.min(e.clientY, window.innerHeight - 250);
    setPopupPos({ x, y });
  };

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
                const normalizedTitle = normalize(p.title);
                const isFromBooking = bookingProvinces.has(normalizedTitle);
                const isManual = manualProvinces.has(normalizedTitle);
                const isHovered = hoveredName === p.title;
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
                    d={p.d}
                    fill={getFillColor()}
                    stroke={COLORS.STROKE}
                    strokeWidth={0.5}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredName(p.title)}
                    onMouseLeave={() => setHoveredName(null)}
                    onClick={(e) => handlePathClick(e, p.title)}
                  />
                );
              })}
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
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                  <FaMapMarkerAlt size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedProvince}
                </h3>

                {/* Đã đi qua tour trên web (TỰ ĐỘNG) */}
                {bookingProvinces.has(normalize(selectedProvince)) ? (
                  <div className="mt-3 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold flex items-center gap-2">
                    <FaCheck className="text-emerald-500" />
                    Đã đi qua tour trên web
                  </div>
                ) : manualProvinces.has(normalize(selectedProvince)) ? (
                  /* Đã tự đánh dấu (THỦ CÔNG) */
                  <div className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold flex items-center gap-2">
                    <FaCheck className="text-blue-500" />
                    Đã tự đánh dấu
                  </div>
                ) : (
                  /* Chưa đi - cho phép đánh dấu thủ công */
                  <>
                    <p className="text-sm text-slate-500 my-3">
                      Bạn đã từng đến {selectedProvince} ngoài website này?
                    </p>

                    {/* Nút Đánh dấu thủ công */}
                    <button
                      onClick={handleManualMark}
                      disabled={isLoadingAction}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FaCheck />
                      {isLoadingAction ? "Đang xử lý..." : "Đánh dấu đã đến"}
                    </button>

                    <p className="text-xs text-slate-400 mt-3 italic">
                      * Đánh dấu cho các địa điểm bạn đã đến mà không qua tour của chúng tôi
                    </p>

                    <div className="my-3 flex items-center gap-2">
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <span className="text-xs text-slate-400">hoặc</span>
                      <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    {/* Nút Xem tour */}
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

                {/* Link xem tour (cho tỉnh đã đánh dấu) */}
                {(bookingProvinces.has(normalize(selectedProvince)) || manualProvinces.has(normalize(selectedProvince))) && (
                  <button
                    onClick={handleViewTours}
                    className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium underline"
                  >
                    Xem các tour tại {selectedProvince}
                  </button>
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
    </section>
  );
}
