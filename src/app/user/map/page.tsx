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
  ArrowRight,
  MapPin,
  Sparkles,
  Star,
  Users,
  Clock,
  Ticket,
} from "lucide-react";

import VietnamJourneyMap from "@/components/VietnamJourneyMap";
import JourneyStats from "./JourneyStats";
import Achievements from "./Achievements";
import JourneyTimeline from "./JourneyTimeline";
import CheckinAccordion from "./CheckinAccordion";
import useUser from "#/src/hooks/useUser";

import CardHot from "@/components/cards/CardHot";
import { getTours } from "@/lib/tours/tour";

/* ================= Helpers ================= */
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

/* ================= Animations ================= */
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
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ================= Static content ================= */
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

  const [tours, setTours] = useState<any[]>([]);
  const [tourLoading, setTourLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "map" | "timeline" | "achievements"
  >("map");

  /* ================= Fetch tours ================= */
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

  /* ================= Loading user ================= */
  if (userLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="relative">
          <div className="h-20 w-20 animate-pulse rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-t-orange-500 border-slate-200" />
        </div>
        <p className="mt-6 animate-pulse font-medium text-slate-600">
          Đang tải hành trình của bạn...
        </p>
      </div>
    );
  }

  /* ================= Guest landing ================= */
  if (!isAuthenticated) {
    return (
      <main className="relative w-full overflow-hidden bg-white font-sans text-slate-600 selection:bg-orange-100 selection:text-orange-900">
        {/* HERO */}
        <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 px-4 pb-20 pt-24 text-center text-white">
          {/* pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          {/* blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-orange-500/25 blur-[90px]" />
            <div className="absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-[100px]" />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="relative z-10 mx-auto max-w-5xl space-y-8"
          >
            {/* badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-orange-300 shadow-xl backdrop-blur-xl"
            >
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-[0.18em]">
                Hộ chiếu du lịch số 4.0
              </span>
            </motion.div>

            {/* title */}
            <h1 className="text-4xl font-black leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl">
              Chinh phục
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                63 tỉnh thành
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
              Ghi dấu mọi bước chân, mở khóa thành tựu và nhận những phần quà
              giá trị trên hành trình khám phá Việt Nam cùng AHH Travel.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push("/auth/login")}
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50"
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
                className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-8 py-3.5 text-base font-bold text-white backdrop-blur-sm hover:bg-white/15 hover:border-white/40 transition-colors"
              >
                Tạo tài khoản mới
              </Link>
            </div>

            {/* stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-8 pt-4 text-sm text-blue-100"
            >
              {[
                { value: "10K+", label: "Phượt thủ" },
                { value: "500K+", label: "Địa điểm" },
                { value: "50K+", label: "Voucher" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="mt-1 text-xs">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
            className="absolute bottom-6 text-blue-100/80"
          >
            <ChevronDown size={30} />
          </motion.div>
        </section>

        {/* FEATURES */}
        <section className="relative bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="mb-3 text-3xl font-black text-slate-900 md:text-4xl">
                Tính năng{" "}
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  nổi bật
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
                Trải nghiệm cách mới để ghi lại và chia sẻ hành trình du lịch
                của bạn.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                  className={`${f.bgColor} group rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl transition-all cursor-default`}
                >
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <f.icon size={26} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-600">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PREVIEW MAP */}
        <section className="relative overflow-hidden bg-white py-20">
          <div className="pointer-events-none absolute inset-0 opacity-5 [background-image:radial-gradient(#64748b_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-5 text-3xl font-black text-slate-900 md:text-4xl">
                Bản đồ{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  hành trình cá nhân
                </span>
              </h2>
              <p className="mb-6 text-sm text-slate-600 sm:text-base">
                Mỗi địa điểm bạn ghé thăm sẽ được tô sáng trên bản đồ. Theo dõi
                tiến độ chinh phục 63 tỉnh thành và nhận thưởng tương xứng.
              </p>

              <div className="space-y-3 text-sm text-slate-700">
                {[
                  "Tự động check-in khi đặt tour trên hệ thống",
                  "Đánh dấu thủ công những nơi đã từng đến",
                  "Nhận voucher khi mở khóa tỉnh/thành mới",
                  "Chia sẻ hành trình với bạn bè trong một cú bấm",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                      <Star size={14} className="text-emerald-600" />
                    </div>
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/auth/register")}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800"
              >
                Bắt đầu hành trình ngay
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-2xl" />
              <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
                <Image
                  src="/vietnam-map-preview.png"
                  alt="Vietnam Map Preview"
                  width={500}
                  height={600}
                  className="rounded-2xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-white via-transparent to-transparent" />
                <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Tiến độ mẫu</p>
                      <p className="text-2xl font-black text-slate-900">
                        25/63 tỉnh
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Danh hiệu</p>
                      <p className="text-base font-bold text-amber-600">
                        🧭 Thám hiểm gia
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA cuối */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-4 text-3xl font-black md:text-4xl">
                Sẵn sàng chinh phục Việt Nam?
              </h2>
              <p className="mb-8 text-base text-blue-100 md:text-lg">
                Tham gia cùng hàng ngàn phượt thủ và bắt đầu hành trình của bạn
                ngay hôm nay.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push("/auth/register")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-9 py-4 text-base font-bold text-blue-900 shadow-2xl hover:bg-slate-100"
              >
                Đăng ký miễn phí
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          </div>
        </section>
      </main>
    );
  }

  /* ================= Authenticated dashboard ================= */
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* background blobs (nhẹ, không quá xanh) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[20%] h-[40%] w-[45%] rounded-full bg-blue-100/60 blur-[120px]" />
        <div className="absolute right-[-10%] top-[10%] h-[38%] w-[40%] rounded-full bg-amber-100/50 blur-[110px]" />
        <div className="absolute bottom-[5%] left-[15%] h-[30%] w-[30%] rounded-full bg-emerald-100/40 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-8">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-center"
        >
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Hành trình của bạn
          </p>
          <h1 className="text-3xl font-black text-slate-900 md:text-4xl">
            Bản đồ du lịch cá nhân
          </h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Khám phá và ghi dấu mọi điểm đến trên bản đồ Việt Nam.
          </p>
        </motion.div>

        {/* stats */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <JourneyStats />
        </motion.div>

        {/* tabs */}
        <div className="mx-auto flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {[
            { key: "map", label: "Bản đồ", icon: MapIcon },
            { key: "timeline", label: "Dòng thời gian", icon: Clock },
            { key: "achievements", label: "Thành tựu", icon: Trophy },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <tab.icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/60"
            >
              <VietnamJourneyMap />
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <JourneyTimeline />
            </motion.div>
          )}

          {activeTab === "achievements" && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <Achievements />
            </motion.div>
          )}
        </AnimatePresence>

        {/* checkin list */}
        {activeTab === "map" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CheckinAccordion />
          </motion.div>
        )}

        {/* suggested tours */}
        <section className="border-t border-slate-200 pt-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                  <Plane size={20} />
                </div>
                Tour gợi ý cho bạn
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Những hành trình phù hợp để lấp đầy bản đồ của bạn.
              </p>
            </div>

            <Link
              href="/user/destination"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-orange-500 hover:text-orange-600"
            >
              Xem tất cả tour
              <ArrowRight size={16} />
            </Link>
          </div>

          {tourLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                  <div className="h-44 w-full animate-pulse rounded-xl bg-slate-100" />
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
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {tours.map((t) => {
                const percent = computePercent(t);
                const slug = t.destinationSlug ?? slugify(t.title);
                const id = t._id ?? t.id;

                return (
                  <motion.div
                    key={id}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
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
