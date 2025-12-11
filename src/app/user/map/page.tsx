"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Star,
  Compass,
  Mountain,
  Users,
  Target,
  Clock,
} from "lucide-react";

// --- Components ---
import VietnamJourneyMap from "@/components/VietnamJourneyMap";
import JourneyStats from "./JourneyStats";
import Achievements from "./Achievements";
import JourneyTimeline from "./JourneyTimeline";
import CheckinAccordion from "./CheckinAccordion";
import useUser from "#/src/hooks/useUser";

// --- Tour Components ---
import CardHot from "@/components/cards/CardHot";
import { getTours } from "@/lib/tours/tour";

// =========================================================
// HELPER FUNCTIONS
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

// Feature cards for guest page
const FEATURES = [
  {
    icon: MapIcon,
    title: "Bản đồ tương tác",
    description: "Theo dõi hành trình chinh phục 63 tỉnh thành Việt Nam",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Trophy,
    title: "Hệ thống thành tựu",
    description: "Mở khóa huy hiệu và danh hiệu độc đáo",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
  },
  {
    icon: Gift,
    title: "Nhận voucher",
    description: "Tích điểm và đổi ưu đãi giảm giá tour",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
  },
  {
    icon: Users,
    title: "Bảng xếp hạng",
    description: "Cạnh tranh với cộng đồng phượt thủ",
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50",
  },
];

export default function UserHomeMapPage() {
  const { isAuthenticated, loading: userLoading } = useUser();
  const router = useRouter();

  // --- State cho Tour ---
  const [tours, setTours] = useState<any[]>([]);
  const [tourLoading, setTourLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"map" | "timeline" | "achievements">("map");

  // --- Fetch Tours ---
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setTourLoading(true);
        const res = await getTours(1, 4, {});
        setTours(res.data || []);
      } catch (error) {
        console.error("Lỗi tải tour:", error);
      } finally {
        setTourLoading(false);
      }
    };
    fetchTours();
  }, []);

  // =========================================================
  // LOADING STATE
  // =========================================================
  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-slate-200 animate-pulse" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-t-emerald-500 animate-spin" />
        </div>
        <p className="mt-6 text-slate-600 font-medium animate-pulse">
          Đang tải hành trình của bạn...
        </p>
      </div>
    );
  }

  // =========================================================
  // GUEST LANDING PAGE
  // =========================================================
  if (!isAuthenticated) {
    return (
      <main className="relative w-full bg-white font-sans text-slate-600 selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
        {/* --- HERO SECTION --- */}
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 px-4 text-center">
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-[150px]" />
          </div>

          {/* Floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="relative z-10 max-w-5xl mx-auto space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-orange-400 shadow-xl backdrop-blur-xl"
            >
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-wider">
                Hộ chiếu du lịch số 4.0
              </span>
            </motion.div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.1]">
              Chinh phục
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 animate-gradient">
                63 Tỉnh Thành
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Ghi dấu mọi bước chân, mở khóa thành tựu và nhận những phần quà
              giá trị trên hành trình khám phá Việt Nam cùng AHH Travel.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/auth/login")}
                className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-lg shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all flex items-center gap-3"
              >
                <Lock size={20} />
                Đăng nhập để bắt đầu
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </motion.button>
              <Link
                href="/auth/register"
                className="px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-lg border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                Tạo tài khoản mới
              </Link>
            </div>

            {/* Stats preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-8 pt-8"
            >
              {[
                { value: "10K+", label: "Phượt thủ" },
                { value: "500K+", label: "Địa điểm" },
                { value: "50K+", label: "Voucher" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
            className="absolute bottom-10 text-slate-400"
          >
            <ChevronDown size={36} />
          </motion.div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section className="py-24 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                Tính năng <span className="text-emerald-600">nổi bật</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Trải nghiệm cách mới để ghi lại và chia sẻ hành trình du lịch của bạn
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`${feature.bgColor} rounded-3xl p-6 border border-slate-200/50 hover:shadow-xl transition-all cursor-pointer group`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- PREVIEW MAP SECTION --- */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
                  Bản đồ
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                    hành trình cá nhân
                  </span>
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  Mỗi địa điểm bạn ghé thăm sẽ được tô sáng trên bản đồ. Theo dõi
                  tiến độ chinh phục 63 tỉnh thành và nhận thưởng tương xứng.
                </p>

                <div className="space-y-4">
                  {[
                    "Tự động check-in khi đặt tour",
                    "Đánh dấu thủ công nơi đã đến",
                    "Nhận voucher cho mỗi tỉnh mới",
                    "Chia sẻ hành trình với bạn bè",
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Star size={14} className="text-emerald-600" />
                      </div>
                      <span className="text-slate-700">{item}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/auth/register")}
                  className="mt-8 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
                >
                  Bắt đầu hành trình ngay
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-3xl shadow-2xl p-6 border border-slate-200">
                  <Image
                    src="/vietnam-map-preview.png"
                    alt="Vietnam Map Preview"
                    width={500}
                    height={600}
                    className="rounded-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent rounded-3xl" />
                  <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Tiến độ mẫu</p>
                        <p className="text-2xl font-black text-slate-800">
                          25/63 tỉnh
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Danh hiệu</p>
                        <p className="text-lg font-bold text-amber-600">
                          🧭 Thám hiểm gia
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Sẵn sàng chinh phục Việt Nam?
              </h2>
              <p className="text-xl text-emerald-100 mb-8">
                Tham gia cùng hàng ngàn phượt thủ và bắt đầu hành trình của bạn
                ngay hôm nay.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/auth/register")}
                className="px-10 py-5 rounded-2xl bg-white text-emerald-700 font-bold text-xl shadow-2xl hover:shadow-white/20 transition-all"
              >
                Đăng ký miễn phí
              </motion.button>
            </motion.div>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // AUTHENTICATED USER DASHBOARD
  // =========================================================
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-amber-100/30 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">
            Hành trình của bạn
          </h1>
          <p className="text-slate-600 text-lg">
            Khám phá và ghi dấu mọi điểm đến trên bản đồ Việt Nam
          </p>
        </motion.div>

        {/* Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <JourneyStats />
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-2 bg-white rounded-2xl p-2 shadow-sm border border-slate-200 w-fit mx-auto">
          {[
            { key: "map", label: "Bản đồ", icon: MapIcon },
            { key: "timeline", label: "Dòng thời gian", icon: Clock },
            { key: "achievements", label: "Thành tựu", icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[2rem] bg-white p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              <VietnamJourneyMap />
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <JourneyTimeline />
            </motion.div>
          )}

          {activeTab === "achievements" && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Achievements />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkin History */}
        {activeTab === "map" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CheckinAccordion />
          </motion.div>
        )}

        {/* Tour Suggestions */}
        <section className="pt-8 border-t border-slate-200">
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">
                  <Plane size={20} />
                </div>
                Tour gợi ý cho bạn
              </h2>
              <p className="mt-2 text-slate-500">
                Những hành trình phù hợp để lấp đầy bản đồ của bạn
              </p>
            </div>

            <Link
              href="/user/destination"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
            >
              Xem tất cả tour
              <ArrowRight size={16} />
            </Link>
          </div>

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
                  <motion.div key={id} variants={itemVariants} whileHover={{ y: -5 }}>
                    <CardHot
                      image={pickTourImage(t)}
                      title={t.title}
                      href={`/user/destination/${slug}/${id}`}
                      originalPrice={toNum(t.priceAdult)}
                      salePrice={toNum(t.salePrice)}
                      discountPercent={percent}
                      discountAmount={t.discountAmount}
                      time={t.time}
                      destination={t.destination ?? titleFromSlug(t.destinationSlug)}
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
