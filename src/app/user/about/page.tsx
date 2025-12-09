"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import {
  Star,
  Globe,
  CreditCard,
  MapPin,
  ArrowRight,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Users,
  CheckCircle2,
  Award,
} from "lucide-react";

// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// --- Counter Component ---
function Counter({
  target,
  suffix = "",
  duration = 1500,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart

      setValue(Math.floor(ease * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

export default function AboutPage() {
  return (
    // Thay đổi màu bôi đen văn bản thành màu Cam
    <main className="min-h-screen bg-white font-sans text-slate-600 selection:bg-orange-100 selection:text-orange-900">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-slate-50 pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />

        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="max-w-2xl"
            >
              {/* Brand Badge - Đổi thành nền Cam nhạt, chữ Cam đậm */}
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 mb-6">
                <Globe className="h-3 w-3" />
                <span>Khám phá thế giới cùng AHH Travel</span>
              </div>

              {/* Heading - Đổi màu chữ chính thành Xanh Navy đậm (Blue-950) */}
              <h1 className="text-4xl font-extrabold tracking-tight text-blue-950 sm:text-5xl lg:text-6xl mb-6 leading-tight">
                Kiến tạo những <br className="hidden lg:block" />
                {/* Gradient Text - Từ Cam sang Xanh Navy */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-blue-600">
                  hành trình hạnh phúc
                </span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Tại <strong>AHH Travel</strong>, chúng tôi tin rằng mỗi chuyến
                đi là một câu chuyện. Chúng tôi mang đến trải nghiệm được cá
                nhân hóa, minh bạch chi phí và kết nối sâu sắc với văn hóa bản
                địa.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/user/destination"
                  // Button chính - Đổi thành màu Xanh Navy đậm (Blue-950) để đồng bộ chữ AHH
                  className="inline-flex items-center gap-2 rounded-full bg-blue-950 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-900 hover:shadow-lg active:scale-95"
                >
                  Đặt tour ngay <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#our-story"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-orange-300 hover:text-orange-600"
                >
                  Tìm hiểu thêm
                </Link>
              </div>
            </motion.div>

            {/* Hero Image Block */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative mx-auto w-full max-w-[500px] lg:max-w-none"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-slate-200 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/banner1.jpg"
                  alt="AHH Travel Hero"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>

              {/* Floating Badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-xl border border-slate-100 max-w-[200px]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-100 overflow-hidden relative"
                      >
                        <Image
                          src={`/clients/assets/images/features/feature-author${i}.jpg`}
                          fill
                          className="object-cover"
                          alt="User"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Khách hàng</span>
                    <span className="font-bold text-blue-950 text-sm">
                      12K+ Hài lòng
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section id="our-story" className="py-20 lg:py-28">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* --- SIDEBAR (Sticky) --- */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                {/* Stats Card - Đổi nền thành Xanh Navy đậm */}
                <div className="rounded-3xl bg-blue-950 p-8 text-white shadow-xl relative overflow-hidden group">
                  {/* Hiệu ứng glow đổi thành màu Cam */}
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-orange-500/20 blur-2xl group-hover:bg-orange-500/30 transition-all" />
                  <div className="relative z-10">
                    <p className="font-medium text-orange-400 mb-2">
                      Kinh nghiệm
                    </p>
                    <h3 className="text-5xl font-bold mb-4">
                      <Counter target={5} suffix="+" />
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-sm">
                      Năm cống hiến, <strong>AHH Travel</strong> tự hào mang đến
                      hàng ngàn hành trình an toàn và đầy cảm hứng cho du khách
                      Việt.
                    </p>
                  </div>
                </div>

                {/* Why Choose Us List */}
                <div className="hidden lg:block">
                  <h4 className="font-bold text-blue-950 mb-4">
                    Tại sao chọn AHH Travel?
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "Giá tốt nhất thị trường",
                      "Hỗ trợ 24/7",
                      "Hoàn tiền linh hoạt",
                      "Đối tác địa phương uy tín",
                    ].map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 text-sm text-slate-600"
                      >
                        {/* Check icon đổi thành màu Cam */}
                        <CheckCircle2 className="h-4 w-4 text-orange-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>

            {/* --- RIGHT CONTENT --- */}
            <div className="lg:col-span-8">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-blue-950 md:text-4xl mb-6">
                  Du lịch với sự tự tin <br />
                  {/* Chữ nhấn mạnh màu Cam */}
                  <span className="text-orange-600">
                    Chất lượng tạo nên AHH Travel
                  </span>
                </h2>
                <div className="prose prose-lg prose-slate text-slate-600">
                  <p>
                    Chúng tôi không chỉ bán tour, chúng tôi thiết kế những trải
                    nghiệm. Mỗi chuyến đi của <strong>AHH Travel</strong> được
                    xây dựng dựa trên sự thấu hiểu nhu cầu của khách hàng, từ
                    những kỳ nghỉ dưỡng thư thái đến những chuyến thám hiểm đầy
                    thách thức.
                  </p>
                </div>
              </motion.div>

              {/* Feature Cards Grid */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 mb-16"
              >
                {[
                  {
                    icon: Award,
                    color: "text-amber-500 bg-amber-50",
                    title: "Dịch vụ đạt chuẩn",
                    desc: "Cam kết chất lượng dịch vụ 5 sao với quy trình kiểm soát chặt chẽ từ AHH Travel.",
                  },
                  {
                    icon: Globe,
                    color: "text-sky-500 bg-sky-50",
                    title: "5000+ Điểm đến",
                    desc: "Mạng lưới kết nối rộng khắp, đưa bạn đến mọi ngóc ngách của Việt Nam.",
                  },
                  {
                    icon: CreditCard,
                    color: "text-rose-500 bg-rose-50",
                    title: "Thanh toán an toàn",
                    desc: "Đa dạng cổng thanh toán: Visa, Master, QR Code, Ví điện tử.",
                  },
                  {
                    icon: Users,
                    color: "text-purple-500 bg-purple-50",
                    title: "Cộng đồng lớn mạnh",
                    desc: "Tham gia cùng hàng nghìn thành viên đam mê xê dịch của đại gia đình AHH.",
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={fadeInUp}
                    // Hover border đổi thành màu Cam
                    className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:border-orange-200 hover:shadow-lg transition-all"
                  >
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                    {/* Hover text đổi thành màu Cam */}
                    <h3 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Large Image with Stats Overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-3xl h-[400px] mb-16 group"
              >
                <Image
                  src="/tour.jpg"
                  alt="AHH Travel Activities"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-10">
                  <div className="grid grid-cols-2 gap-8 border-t border-white/20 pt-8">
                    <div>
                      <div className="text-3xl font-bold text-white mb-1">
                        <Counter target={100} suffix="+" />
                      </div>
                      <div className="text-sm text-slate-300 font-medium uppercase tracking-wider">
                        Tours Mỗi Tháng
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white mb-1">
                        <Counter target={8500} suffix="+" />
                      </div>
                      <div className="text-sm text-slate-300 font-medium uppercase tracking-wider">
                        Khách Hàng
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Team Section */}
              <div className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-blue-950">
                      Đội ngũ lãnh đạo
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Những người dẫn đường tận tâm tại AHH Travel
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    {
                      name: "NONG QUOC HUNG",
                      role: "Founder & CEO",
                      img: "/qhung.jpg",
                      fb: "https://facebook.com/whuq394",
                    },
                    {
                      name: "BAO NGAN",
                      role: "Co-Founder & COO",
                      img: "/clients/assets/images/team/guide-ngan.jpg",
                      fb: "#",
                    },
                  ].map((member, idx) => (
                    <motion.div
                      key={idx}
                      variants={fadeInUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all"
                    >
                      <div className="relative h-72 w-full overflow-hidden">
                        <Image
                          src={member.img}
                          alt={member.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

                        {/* Social Icons Float Up */}
                        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <div className="flex justify-center gap-4 text-white">
                            <a
                              href={member.fb}
                              className="hover:text-orange-400 transition-colors"
                            >
                              <Facebook size={20} />
                            </a>
                            <a
                              href="#"
                              className="hover:text-orange-400 transition-colors"
                            >
                              <Twitter size={20} />
                            </a>
                            <a
                              href="#"
                              className="hover:text-orange-400 transition-colors"
                            >
                              <Instagram size={20} />
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 text-white transition-all duration-300 group-hover:-translate-y-8">
                        <h4 className="text-lg font-bold">{member.name}</h4>
                        <p className="text-sm text-slate-300">{member.role}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
