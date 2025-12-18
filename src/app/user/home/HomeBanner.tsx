"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { ArrowRight, Sparkles } from "lucide-react";

const HomeBanner = () => {
  const slides = [
    {
      image: "/banner.jpg",
      title: "TOUR MIỀN TÂY 2 NGÀY 1 ĐÊM",
      desc: "Tiền Giang – Mỹ Tho – Bến Tre – Cần Thơ",
      href: "/user/destination?destination=mien-tay",
    },
    {
      image: "/banner3.jpg",
      title: "Tour trọn gói hấp dẫn",
      desc: "Tận hưởng kỳ nghỉ theo cách của bạn",
      href: "/user/destination",
    },
    {
      image: "/banner4.jpg",
      title: "Đặt tour dễ dàng – Đi ngay hôm nay",
      desc: "Nhanh chóng, tiện lợi và an toàn",
      href: "/user/destination",
    },
  ];

  return (
    <>
      {/* CSS custom cho animation & pagination của Swiper */}
      <style jsx global>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatBanner {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-slideUp {
          animation: slideUpFade 0.6s ease-out forwards;
        }

        .animate-float {
          animation: floatBanner 3s ease-in-out infinite;
        }

        .swiper-pagination-bullets {
          bottom: 24px !important;
        }

        .swiper-pagination-bullet {
          background-color: rgba(255, 255, 255, 0.5) !important;
          opacity: 1 !important;
        }

        .swiper-pagination-bullet-active {
          background-color: rgba(255, 255, 255, 1) !important;
          width: 28px !important;
          border-radius: 12px !important;
        }
      `}</style>

      <section className="relative w-full h-[500px] sm:h-[600px] lg:h-[700px] rounded-3xl overflow-hidden shadow-2xl">
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true, dynamicBullets: false }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          className="w-full h-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div
                className="w-full h-full bg-cover bg-center relative flex items-center justify-start"
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                {/* Overlay nhẹ, không tô xanh ảnh nữa */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

                {/* Floating shapes giữ cho vui, màu rất nhẹ */}
                <div className="absolute top-10 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float" />
                <div
                  className="absolute bottom-20 left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-float"
                  style={{ animationDelay: "1s" }}
                />

                {/* Content */}
                <div className="relative z-10 ml-6 sm:ml-12 lg:ml-16 max-w-2xl">
                  {/* Badge */}
                  <div
                    className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium border border-white/30 animate-slideUp"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <Sparkles size={16} />
                    Ưu đãi hôm nay
                  </div>

                  {/* Title */}
                  <h1
                    className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white drop-shadow-lg animate-slideUp"
                    style={{ animationDelay: "0.2s" }}
                  >
                    {slide.title}
                  </h1>

                  {/* Description */}
                  <p
                    className="mt-4 text-base sm:text-lg lg:text-xl text-white/95 drop-shadow-md max-w-xl animate-slideUp"
                    style={{ animationDelay: "0.3s" }}
                  >
                    {slide.desc}
                  </p>

                  {/* CTA Button – vẫn cam cho đúng brand */}
                  <a
                    href={slide.href}
                    className="mt-8 inline-flex items-center gap-2 px-8 py-4 text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 drop-shadow-lg animate-slideUp group"
                    style={{ animationDelay: "0.4s" }}
                  >
                    Khám phá ngay
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </a>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    </>
  );
};

export default HomeBanner;
