"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MessageSquare,
} from "lucide-react";

// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
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

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Giả lập gọi API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Form submitted:", formData);
    alert("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.");
    setIsSubmitting(false);
    setFormData({ name: "", phone: "", email: "", subject: "", message: "" });
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-600 selection:bg-orange-100 selection:text-orange-900">
      {/* ===== HERO / HEADER ===== */}
      <section className="relative bg-blue-950 py-20 lg:py-28 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="container mx-auto max-w-7xl px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="inline-block mb-4 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-400 backdrop-blur-sm">
              Liên hệ AHH Travel
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-6">
              Chúng tôi luôn sẵn sàng <br />
              <span className="text-orange-500">lắng nghe bạn</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              Bạn có thắc mắc về tour? Cần tư vấn lịch trình riêng? Đừng ngần
              ngại để lại lời nhắn, đội ngũ tư vấn viên của chúng tôi sẽ hỗ trợ
              ngay lập tức.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="relative -mt-16 pb-20 lg:pb-28 z-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* --- LEFT COLUMN: CONTACT INFO --- */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="lg:col-span-1 space-y-6"
            >
              {/* Info Cards */}
              {[
                {
                  icon: Phone,
                  title: "Hotline tư vấn",
                  text: "+84 (0) 123 456 789",
                  subtext: "Hỗ trợ 24/7",
                  action: "tel:+0001234588",
                  color: "bg-blue-50 text-blue-600",
                },
                {
                  icon: Mail,
                  title: "Email hỗ trợ",
                  text: "admin@ahhtravel.com",
                  subtext: "Phản hồi trong 2 giờ",
                  action: "mailto:admin@ahhtravel.com",
                  color: "bg-orange-50 text-orange-600",
                },
                {
                  icon: MapPin,
                  title: "Văn phòng chính",
                  text: "Số 1 Võ Văn Ngân, TP. HCM",
                  subtext: "Phường Thủ Đức",
                  color: "bg-emerald-50 text-emerald-600",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className="rounded-2xl bg-white p-6 shadow-md border border-slate-100 transition-all hover:shadow-xl hover:border-orange-200 group cursor-pointer"
                >
                  <a href={item.action} className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.color} transition-colors group-hover:bg-blue-950 group-hover:text-white`}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-950">
                        {item.title}
                      </h3>
                      <p className="font-medium text-slate-600">{item.text}</p>
                      {item.subtext && (
                        <p className="text-xs text-slate-400 mt-1">
                          {item.subtext}
                        </p>
                      )}
                    </div>
                  </a>
                </motion.div>
              ))}

              {/* Social Connect */}
              <motion.div
                variants={fadeInUp}
                className="rounded-2xl bg-blue-950 p-8 text-white text-center shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-orange-500/20 blur-xl" />
                <h3 className="text-lg font-bold mb-4 relative z-10">
                  Kết nối mạng xã hội
                </h3>
                <div className="flex justify-center gap-4 relative z-10">
                  {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-orange-500 transition-all"
                    >
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* --- RIGHT COLUMN: FORM --- */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="lg:col-span-2"
            >
              <div className="h-full rounded-3xl bg-white p-8 md:p-10 shadow-xl border border-slate-100">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-blue-950 flex items-center gap-2">
                    <MessageSquare className="text-orange-500" />
                    Gửi tin nhắn cho chúng tôi
                  </h2>
                  <p className="text-slate-500 mt-2">
                    Địa chỉ email của bạn sẽ không được công bố. Các trường bắt
                    buộc được đánh dấu <span className="text-red-500">*</span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="phone"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0912 345 678"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@ahhtravel.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Chủ đề cần hỗ trợ
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Ví dụ: Tư vấn tour Đà Nẵng 3N2Đ"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Nội dung tin nhắn <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Hãy cho chúng tôi biết chi tiết yêu cầu của bạn..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-8 py-4 font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-700 hover:shadow-orange-500/50 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      "Đang gửi..."
                    ) : (
                      <>
                        Gửi yêu cầu ngay{" "}
                        <Send
                          size={18}
                          className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                        />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MAP SECTION ===== */}
      <section className="pb-20 lg:pb-28">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-3xl shadow-xl border border-slate-200 relative h-[450px]"
          >
            {/* Overlay hint */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 hover:opacity-0 bg-black/5"></div>

            <iframe
              // Đã thay thế bằng link Embed Google Maps chuẩn cho ĐH SPKT TP.HCM (Số 1 Võ Văn Ngân)
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.485398642603!2d106.76935827581295!3d10.85063765782136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752763f23816ab%3A0x282f711441b6916f!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBTxrAgcGjhuqFtIEvhu7kgdGh14bqtdCBUaMOgbmggcGjhu5EgSOG7kyBDaMOtIE1pbmg!5e0!3m2!1svi!2s!4v1683794344498!5m2!1svi!2s"
              className="h-full w-full border-0 grayscale-[20%] transition-all duration-700 hover:grayscale-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
