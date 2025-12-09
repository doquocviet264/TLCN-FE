"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Map as MapIcon,
  Trophy,
  Gift,
  Lock,
  Plane,
  ChevronDown,
  Globe2,
  ArrowRight,
  MapPin,
} from "lucide-react";

// --- Imports Components Bản Đồ ---
import MapBanner from "./MapBanner";
import VietnamJourneyMap from "@/components/VietnamJourneyMap";
import CheckinAccordion from "./CheckinAccordion";
import RecommendedPlaces from "./RecommendedPlaces";
import useUser from "#/src/hooks/useUser";

// --- Imports Components Tour ---
import CardHot from "@/components/cards/CardHot";
import { getTours } from "@/lib/tours/tour";

// =========================================================
// 1. CÁC HÀM HỖ TRỢ XỬ LÝ TOUR (GIỮ NGUYÊN CODE CỦA BẠN)
// =========================================================
const slugify = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const titleFromSlug = (s?: string) => (s ? s.replace(/-/g, " ") : "");
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "";

const toNum = (v?: number | string) => {
  if (typeof v === "number") return v;
  if (typeof v === "string")
    return Number(v.replace(/[^\d]/g, "")) || undefined;
};

const computePercent = (t: any) => {
  if (t?.discountPercent > 0) return Math.round(t.discountPercent);
  const origin = toNum(t?.priceAdult);
  const sale =
    toNum(t?.salePrice) ?? (origin ? origin - (t?.discountAmount || 0) : 0);
  if (origin && sale < origin) return Math.round((1 - sale / origin) * 100);
  return 0;
};

const pickTourImage = (t: any) =>
  t?.image ?? t?.cover ?? t?.images?.[0] ?? "/hot1.jpg";

// Animation Variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function UserHomeMapPage() {
  const { isAuthenticated, loading: userLoading } = useUser();
  const router = useRouter();

  // --- State cho Tour ---
  const [tours, setTours] = useState<any[]>([]);
  const [tourLoading, setTourLoading] = useState(true);

  // --- Effect gọi API Tour (Code của bạn) ---
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setTourLoading(true);
        // Lấy 4 tour gợi ý
        const res = await getTours(1, 4, {});
        setTours(res.data || []);
      } catch (error) {
        console.error("Lỗi tải tour:", error);
      } finally {
        setTourLoading(false);
      }
    };

    // Chỉ gọi khi đã đăng nhập (hoặc gọi luôn tùy ý, ở đây mình để gọi luôn)
    fetchTours();
  }, []);

  // =========================================================
  // 2. TRẠNG THÁI LOADING USER
  // =========================================================
  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  // =========================================================
  // 3. TRẠNG THÁI CHƯA ĐĂNG NHẬP (GUEST LANDING PAGE)
  // =========================================================
  if (!isAuthenticated) {
    return (
      <main className="relative w-full bg-white font-sans text-slate-600 selection:bg-orange-100 selection:text-orange-900">
        {/* --- HERO SECTION --- */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-blue-950 py-20 px-4 text-center">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-orange-500/20 blur-[100px]" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-blue-500/20 blur-[100px]" />
          <div className="absolute inset-0 bg-[url('/city-bg.svg')] opacity-5 bg-bottom bg-repeat-x pointer-events-none mix-blend-overlay"></div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="relative z-10 max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-orange-400 shadow-sm text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              <Globe2 size={14} /> Hộ chiếu du lịch số 4.0
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              Lưu giữ mọi dấu chân trên <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">
                Bản Đồ Việt Nam
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
              Đăng nhập để kích hoạt bản đồ cá nhân, theo dõi tiến độ chinh phục
              63 tỉnh thành và mở khóa những phần quà giá trị từ AHH Travel.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <button
                onClick={() => router.push("/auth/login")}
                className="group px-8 py-4 rounded-full bg-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-500/30 hover:bg-orange-500 hover:-translate-y-1 transition-all flex items-center gap-2"
              >
                <Lock size={18} />
                Đăng nhập ngay
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
              <Link
                href="/auth/register"
                className="px-8 py-4 rounded-full bg-white/10 text-white font-bold text-lg border border-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                Đăng ký tài khoản
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1, duration: 2, repeat: Infinity }}
            className="absolute bottom-10 text-slate-400"
          >
            <ChevronDown size={32} />
          </motion.div>
        </section>

        {/* --- Feature Section & Demo (Giữ ngắn gọn cho Guest) --- */}
        <section className="py-24 bg-slate-50 relative z-10">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">
              Tính năng nổi bật
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white rounded-2xl shadow-sm">
                <MapIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />{" "}
                <h3 className="font-bold">Check-in Tự Động</h3>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm">
                <Trophy className="w-12 h-12 text-orange-500 mx-auto mb-4" />{" "}
                <h3 className="font-bold">Thăng Hạng</h3>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm">
                <Gift className="w-12 h-12 text-emerald-500 mx-auto mb-4" />{" "}
                <h3 className="font-bold">Nhận Quà</h3>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // 4. TRẠNG THÁI ĐÃ ĐĂNG NHẬP (USER DASHBOARD)
  // =========================================================
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 p-4 pb-20 md:p-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-orange-200/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-12">
        {/* --- PHẦN 1: BẢN ĐỒ & CHECKIN --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MapBanner />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-[2.5rem] bg-white p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          <VietnamJourneyMap />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CheckinAccordion />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
          </motion.div>
        </div>

        {/* --- PHẦN 2: DANH SÁCH TOUR GỢI Ý (ĐÂY LÀ PHẦN BẠN MUỐN) --- */}
        <section className="pt-8 border-t border-slate-200">
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-blue-950 uppercase tracking-tight flex items-center gap-2">
                <Plane className="text-orange-500" />
                Tour Gợi Ý <span className="text-orange-600">Cho Bạn</span>
              </h2>
              <p className="mt-2 text-slate-500 font-medium">
                Những hành trình phù hợp để lấp đầy bản đồ của bạn
              </p>
            </div>

            <Link
              href="/tours"
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
            >
              Xem tất cả tour
            </Link>
          </div>

          {/* Grid Tour Logic */}
          {tourLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                  <div className="h-48 w-full animate-pulse rounded-xl bg-slate-100" />
                  <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {tours.map((t) => {
                const percent = computePercent(t);
                const slug = t.destinationSlug ?? slugify(t.title);
                const id = t._id ?? t.id;

                return (
                  <motion.div
                    key={id}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                  >
                    <CardHot
                      image={pickTourImage(t)}
                      title={t.title}
                      href={`/user/destination/${slug}/${id}`}
                      originalPrice={toNum(t.priceAdult)}
                      salePrice={toNum(t.salePrice)}
                      discountPercent={percent}
                      discountAmount={t.discountAmount}
                      time={t.time}
                      destination={
                        t.destination ?? titleFromSlug(t.destinationSlug)
                      }
                      seats={t.quantity ?? t.seats ?? 0}
                      schedule={
                        t.startText ??
                        (t.startDate
                          ? `Khởi hành: ${fmtDate(t.startDate)}`
                          : undefined)
                      }
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      </div>
    </main>
  );
}
