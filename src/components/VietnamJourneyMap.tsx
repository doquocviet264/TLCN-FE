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
  VISITED: "#10b981", // Xanh ngọc - đã đi qua tour/voucher
  MANUAL_VISITED: "#3b82f6", // Xanh dương - tự đánh dấu
  LOCKED: "#e5e7eb", // Xám
  HOVER: "#fcd34d", // Vàng
  STROKE: "#ffffff",
};

export default function VietnamJourneyMap() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mapRef = useRef<SVGSVGElement | null>(null);

  const [visitedProvinces, setVisitedProvinces] = useState<Set<string>>(
    new Set()
  );
  // Tỉnh đã đánh dấu thủ công (không nhận voucher)
  const [manualVisitedProvinces, setManualVisitedProvinces] = useState<Set<string>>(
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
  const [showVoucher, setShowVoucher] = useState(false);
  const [earnedVoucher, setEarnedVoucher] = useState<{
    code: string;
    description: string;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  // Normalize string helper
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  // 1. FETCH DATA
  // 1. FETCH DATA (SỬA LẠI ĐOẠN NÀY)
  useEffect(() => {
    const fetchJourney = async () => {
      if (!user) return;
      try {
        // Gọi API lấy danh sách tỉnh đã đi
        const res = await checkinApi.getUserJourney();

        console.log("Dữ liệu từ Server:", res); // <-- Bật cái này lên để debug xem API trả về gì

        const provinces = new Set<string>();

        // API trả về object dạng: { total: 5, provinces: ["Hà Nội", "Lào Cai"], manualProvinces: [...] }
        if (res.provinces && Array.isArray(res.provinces)) {
          res.provinces.forEach((p: string) => {
            // Chuẩn hóa tên (bỏ dấu, thường) để khớp với SVG
            provinces.add(normalize(p));
          });
        }

        setVisitedProvinces(provinces); // Cập nhật State -> Map sẽ tự tô màu Xanh

        // Load tỉnh đánh dấu thủ công
        const manualProvinces = new Set<string>();
        if (res.manualProvinces && Array.isArray(res.manualProvinces)) {
          res.manualProvinces.forEach((p: string) => {
            manualProvinces.add(normalize(p));
          });
        }
        setManualVisitedProvinces(manualProvinces);
      } catch (error) {
        console.error("Lỗi tải hành trình:", error);
      }
    };

    fetchJourney();
  }, [user]);

  // 2. CHECK-IN (qua tour - nhận voucher)
  const handleCheckIn = async () => {
    if (!selectedProvince || isLoadingAction) return;

    setIsLoadingAction(true);
    try {
      // 1. Gọi API và ĐÓN LẤY KẾT QUẢ TRẢ VỀ (chứa voucherCode từ DB)
      const res: any = await checkinApi.checkinProvince(selectedProvince);

      // --- CẬP NHẬT GIAO DIỆN ---

      // 2. Tô màu xanh ngay lập tức
      setVisitedProvinces((prev) =>
        new Set(prev).add(normalize(selectedProvince))
      );

      // 3. Bắn pháo hoa
      (confetti as any)({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#fcd34d", "#3b82f6"],
      });

      // 4. HIỆN VOUCHER TỪ BACKEND (Quan trọng)
      // Lấy voucherCode từ response của server, nếu lỗi thì fallback mã tạm
      const backendVoucher =
        res.voucherCode ||
        `VN-${normalize(selectedProvince).substring(0, 3).toUpperCase()}-2024`;

      setEarnedVoucher({
        code: backendVoucher,
        description: `Voucher giảm 10% cho chuyến đi tiếp theo đến ${selectedProvince}!`,
      });

      setShowVoucher(true);
      setSelectedProvince(null);
    } catch (error: any) {
      console.error("Lỗi check-in:", error);

      // Xử lý thông báo lỗi thân thiện hơn
      const msg =
        error.response?.data?.message || "Check-in thất bại. Vui lòng thử lại!";

      // Nếu lỗi là "Đã check-in rồi" thì chỉ thông báo nhẹ nhàng
      if (msg.includes("đã check-in")) {
        alert(
          "Bạn đã check-in địa điểm này rồi! Hãy kiểm tra trong Kho Voucher nhé."
        );
      } else {
        alert(msg);
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  // 2b. ĐÁNH DẤU THỦ CÔNG (không nhận voucher)
  const handleManualMark = async () => {
    if (!selectedProvince || isLoadingAction) return;

    setIsLoadingAction(true);
    try {
      // Gọi API đánh dấu thủ công (không nhận voucher)
      await checkinApi.manualMarkProvince(selectedProvince);

      // Tô màu xanh dương cho tỉnh đánh dấu thủ công
      setManualVisitedProvinces((prev) =>
        new Set(prev).add(normalize(selectedProvince))
      );

      // Bắn pháo hoa nhẹ
      (confetti as any)({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
      });

      setSelectedProvince(null);
    } catch (error: any) {
      console.error("Lỗi đánh dấu thủ công:", error);
      const msg =
        error.response?.data?.message || "Đánh dấu thất bại. Vui lòng thử lại!";
      alert(msg);
    } finally {
      setIsLoadingAction(false);
    }
  };
  // 3. ZOOM/PAN CONTROLS
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
            <span>Đã đi (có voucher)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-sm ring-1 ring-blue-200"></span>
            <span>Tự đánh dấu</span>
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
                const isVisited = visitedProvinces.has(normalizedTitle);
                const isManualVisited = manualVisitedProvinces.has(normalizedTitle);
                const isHovered = hoveredName === p.title;
                const isSelected = selectedProvince === p.title;

                // Xác định màu fill
                const getFillColor = () => {
                  if (isSelected) return COLORS.HOVER;
                  if (isHovered) {
                    if (isVisited) return "#059669"; // Đậm hơn khi hover visited
                    if (isManualVisited) return "#2563eb"; // Đậm hơn khi hover manual
                    return COLORS.HOVER;
                  }
                  if (isVisited) return COLORS.VISITED;
                  if (isManualVisited) return COLORS.MANUAL_VISITED;
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

        {/* Check-in Popup */}
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
                {visitedProvinces.has(normalize(selectedProvince)) ? (
                  <div className="mt-3 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold flex items-center gap-2">
                    <FaGift className="text-emerald-500" />
                    Đã đi (có voucher)
                  </div>
                ) : manualVisitedProvinces.has(normalize(selectedProvince)) ? (
                  <div className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold flex items-center gap-2">
                    <FaCheck className="text-blue-500" />
                    Đã tự đánh dấu
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-500 my-3">
                      Chọn cách đánh dấu địa điểm này:
                    </p>

                    {/* Nút Check-in qua tour (nhận voucher) */}
                    <button
                      onClick={handleCheckIn}
                      disabled={isLoadingAction}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FaGift />
                      {isLoadingAction ? "Đang xử lý..." : "Đã đi qua tour (nhận voucher)"}
                    </button>

                    <div className="my-2 flex items-center gap-2">
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <span className="text-xs text-slate-400">hoặc</span>
                      <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    {/* Nút Đánh dấu thủ công (không nhận voucher) */}
                    <button
                      onClick={handleManualMark}
                      disabled={isLoadingAction}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FaCheck />
                      {isLoadingAction ? "Đang xử lý..." : "Tự đánh dấu (không voucher)"}
                    </button>

                    <p className="text-xs text-slate-400 mt-2 italic">
                      * Đánh dấu thủ công sẽ không nhận được phiếu giảm giá
                    </p>
                  </>
                )}
                <button
                  onClick={() => router.push("/user/destination")}
                  className="mt-4 text-xs text-slate-400 hover:text-indigo-600 underline"
                >
                  Xem các tour tại đây
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voucher Modal */}
      <AnimatePresence>
        {showVoucher && earnedVoucher && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden text-center"
            >
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 text-white">
                <h2 className="text-3xl font-black uppercase">Chúc Mừng!</h2>
                <p>Bạn đã mở khóa địa điểm mới</p>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-6">
                  {earnedVoucher.description}
                </p>
                <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-4 font-mono font-bold text-xl text-slate-800">
                  {earnedVoucher.code}
                </div>
                <button
                  onClick={() => setShowVoucher(false)}
                  className="w-full mt-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                >
                  Tuyệt vời!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
