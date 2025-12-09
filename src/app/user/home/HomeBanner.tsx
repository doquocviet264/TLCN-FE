'use client';

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";
import Button from "@/components/ui/Button";
 // nếu bạn dùng shadcn/ui

const HomeBanner = () => {
  const slides = [
    {
      image: "/banner.jpg",
      title: "TOUR MIỀN TÂY 2 NGÀY 1 ĐÊM",
      desc: "Tiền Giang – Mỹ Tho – Bến Tre – Cần Thơ",
      price: "1.550.000 VNĐ",
      href: "/user/destination?destination=mien-tay",
    },
    {
      image: "/banner3.jpg",
      title: "Tour trọn gói hấp dẫn",
      desc: "Tận hưởng kỳ nghỉ theo cách của bạn",
      price: "Giá ưu đãi hấp dẫn",
      href: "/user/destination",
    },
    {
      image: "/banner4.jpg",
      title: "Đặt tour dễ dàng – Đi ngay hôm nay",
      desc: "Nhanh chóng, tiện lợi và an toàn",
      price: "Liên hệ để biết thêm",
      href: "/user/destination",
    },
  ];

  return (
    <section className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden">
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop
        className="w-full h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div
              className="w-full h-full bg-cover bg-center relative flex items-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* overlay gradient từ trái sang phải */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

              {/* Nội dung chữ (căn phải) */}
              <div className="relative z-10 text-white max-w-xl ml-auto mr-10 text-right">
                <h1 className="text-3xl md:text-5xl font-bold drop-shadow-md animate-fadeInUp">
                  {slide.title}
                </h1>
                <p className="mt-3 text-base md:text-lg text-white/90 animate-fadeInUp">
                  {slide.desc}
                </p>
                {slide.price && (
                  <p className="mt-2 text-xl md:text-2xl font-semibold text-yellow-300 animate-fadeInUp">
                    Giá: {slide.price}
                  </p>
                )}
                <a
                  href={slide.href}
                  className="mt-4 inline-block px-6 py-3 text-lg font-bold bg-white text-black hover:bg-yellow-300 animate-fadeInUp rounded-lg transition-colors"
                >
                  ĐẶT NGAY
                </a>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default HomeBanner;
