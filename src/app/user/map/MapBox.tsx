"use client";

import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { LuTag } from "react-icons/lu";
import { PiMapPinAreaLight } from "react-icons/pi";
import { LiaShoePrintsSolid } from "react-icons/lia";
import { useRouter } from "next/navigation";
import { placeApi } from "@/lib/place/placeApi";
import { checkinApi } from "@/lib/checkin/checkinApi";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import useUser from "#/src/hooks/useUser"; // Hook check login của bạn
import MapBanner from "./MapBanner";
import VietnamJourneyMap from "@/components/VietnamJourneyMap"; // Đây là MapBox của bạn
import CheckinAccordion from "./CheckinAccordion";
import RecommendedPlaces from "./RecommendedPlaces";
type Status = "visited" | null;

export default function VNMap() {
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selectedPath, setSelectedPath] = useState<SVGPathElement | null>(null);

  const [regionStatus, setRegionStatus] = useState<
    Record<string, { status: Status; color: string }>
  >({});
  const [scale, setScale] = useState(1);

  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const mapRef = useRef<SVGSVGElement | null>(null);
  const router = useRouter();

  const getRandomPastelColor = () => {
    const r = Math.floor(Math.random() * 127 + 127);
    const g = Math.floor(Math.random() * 127 + 127);
    const b = Math.floor(Math.random() * 127 + 127);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getColorByStatus = (
    statusObj: { status: Status; color: string } | undefined
  ) => {
    if (!statusObj) return "#D8D8D8";
    return statusObj.color;
  };

  const clampPopupPosition = (x: number, y: number) => {
    const padding = 20,
      popupWidth = 320,
      popupHeight = 220;
    const newX = Math.min(
      Math.max(x, padding),
      window.innerWidth - popupWidth - padding
    );
    const newY = Math.min(
      Math.max(y, padding),
      window.innerHeight - popupHeight - padding
    );
    return { x: newX, y: newY };
  };

  useEffect(() => {
    const paths = document.querySelectorAll<SVGPathElement>("svg path");

    paths.forEach((path) => {
      const title = path.getAttribute("data-title") || "unknown";
      const statusObj = regionStatus[title];

      path.style.fill = getColorByStatus(statusObj);
      path.style.stroke = "#0c5feeff";
      path.style.strokeWidth = "0.5";
      path.style.transition = "fill 0.3s ease";

      path.onmouseenter = () => {
        setHoveredName(title);
        path.style.fill = getRandomPastelColor();
      };

      path.onmouseleave = () => {
        setHoveredName(null);
        setMousePos(null);
        path.style.fill = getColorByStatus(regionStatus[title]);
      };

      path.onmousemove = (e) =>
        setMousePos({ x: e.clientX + 15, y: e.clientY + 15 });

      path.onclick = (e) => {
        setSelectedPath(path);
        setSelectedName(title);
        setPopupPos(clampPopupPosition(e.clientX, e.clientY));
      };
    });
  }, [regionStatus]);

  // 🎯 Pan map chỉ trong vùng svg
  const handlePointerDown = (x: number, y: number, button = 0) => {
    if (button !== 0) return; // chỉ chuột trái
    setIsDragging(true);
    setLastPos({ x, y });
  };

  const handlePointerMove = (x: number, y: number, e?: Event) => {
    if (!isDragging || !lastPos) return;
    if (e) e.preventDefault(); // chỉ block khi đang drag map

    const dx = x - lastPos.x;
    const dy = y - lastPos.y;
    setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x, y });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setLastPos(null);
  };

  useEffect(() => {
    const svg = mapRef.current;
    if (!svg) return;

    const onMouseDown = (e: MouseEvent) =>
      handlePointerDown(e.clientX, e.clientY, e.button);
    const onMouseMove = (e: MouseEvent) =>
      handlePointerMove(e.clientX, e.clientY, e);
    const onMouseUp = () => handlePointerUp();
    const onMouseLeave = () => handlePointerUp();

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        handlePointerDown(t.clientX, t.clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const t = e.touches[0];
        handlePointerMove(t.clientX, t.clientY, e);
      }
    };
    const onTouchEnd = () => handlePointerUp();

    svg.addEventListener("mousedown", onMouseDown);
    svg.addEventListener("mousemove", onMouseMove);
    svg.addEventListener("mouseup", onMouseUp);
    svg.addEventListener("mouseleave", onMouseLeave);

    svg.addEventListener("touchstart", onTouchStart, { passive: false });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onTouchEnd);

    return () => {
      svg.removeEventListener("mousedown", onMouseDown);
      svg.removeEventListener("mousemove", onMouseMove);
      svg.removeEventListener("mouseup", onMouseUp);
      svg.removeEventListener("mouseleave", onMouseLeave);

      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, lastPos]);

  // 🎯 Zoom với con lăn chuột
  useEffect(() => {
    const svg = mapRef.current;
    if (!svg) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(Math.max(s - e.deltaY * 0.001, 0.5), 3));
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, []);

  // --- Checkin & explore ---
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^(xã|phường|thị trấn)\s+/i, "")
      .trim()
      .toLowerCase();

  const handleVisited = async () => {
    if (selectedName) {
      try {
        // --- SỬA Ở ĐÂY: Gọi thẳng API check-in theo tên tỉnh ---
        // Không cần placeApi.getAll() hay find() gì nữa
        await checkinApi.checkinProvince(selectedName);

        // Cập nhật giao diện: Tô màu
        setRegionStatus((prev) => ({
          ...prev,
          [selectedName]: {
            status: "visited",
            color: prev[selectedName]?.color || getRandomPastelColor(),
          },
        }));

        // Đóng popup
        handleClosePopup();

        // (Tùy chọn) Báo thành công
        toast.success(`Đã check-in thành công tại ${selectedName}!`);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          // Lấy message lỗi từ Backend trả về (VD: "Đã check-in rồi")
          const msg = error.response?.data?.message || error.message;
          toast.error(`Lỗi: ${msg}`);
          console.error("Lỗi khi checkin:", error.response?.data);
        } else {
          console.error("Lỗi khi checkin:", error);
        }
      }
    }
  };

  const handleExplore = () => {
    if (selectedPath && selectedName) {
      handleClosePopup();
      router.push("/user/destination");
    }
  };

  const handleClosePopup = () => {
    setSelectedName(null);
    setPopupPos(null);
    setSelectedPath(null);
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-0 sm:px-4 mt-5 relative select-none">
      <div className="absolute -top-3 right-2 z-[9999] flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="shadow-md rounded p-2 hover:bg-gray-100"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="shadow-md rounded p-2 hover:bg-gray-100"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="shadow-md rounded p-2 hover:bg-gray-100"
        >
          ⟳
        </button>
      </div>
      {hoveredName && mousePos && (
        <div
          className="fixed bg-white border border-gray-300 rounded-md px-2 py-1 text-sm shadow-md pointer-events-none z-50 max-w-[200px]"
          style={{ top: mousePos.y, left: mousePos.x }}
        >
          {hoveredName}
        </div>
      )}

      {popupPos && selectedName && (
        <div
          className="fixed bg-white p-5 rounded-xl shadow-lg z-50 min-w-[270px] w-[90%] max-w-[320px]"
          style={{ left: popupPos.x, top: popupPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClosePopup}
            className="absolute top-3 right-3 text-gray-500 hover:text-black"
          >
            <FaTimes size={18} />
          </button>
          <div className="flex justify-around gap-8 mt-4">
            <button
              onClick={handleVisited}
              className="flex flex-col items-center text-sm sm:text-base text-blue-500"
            >
              <div className="flex items-center justify-center w-10 h-10">
                <LiaShoePrintsSolid
                  size={50}
                  className="text-blue-500"
                  stroke="currentColor"
                />
              </div>
              <span className="mt-1 font-medium">ĐÃ ĐI</span>
            </button>

            <button
              onClick={handleExplore}
              className="flex flex-col items-center text-sm sm:text-base text-blue-500"
            >
              <div className="flex items-center justify-center w-10 h-10">
                <PiMapPinAreaLight
                  size={55}
                  className="text-blue-500"
                  stroke="currentColor"
                />
              </div>
              <span className="mt-1 font-medium">KHÁM PHÁ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
