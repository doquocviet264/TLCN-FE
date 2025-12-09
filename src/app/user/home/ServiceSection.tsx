'use client';

import React from 'react';
import Image from 'next/image';

const services = [
  { title: 'Dự báo thời tiết', description: 'Cập nhật thông tin thời tiết điểm đến giúp bạn chuẩn bị hành lý phù hợp.', icon: '/weather.svg' },
  { title: 'Hướng dẫn viên chuyên nghiệp', description: 'Đội ngũ hướng dẫn viên giàu kinh nghiệm, am hiểu văn hóa địa phương.', icon: '/guide.svg' },
  { title: 'Cộng đồng du lịch', description: 'Kết nối với cộng đồng du lịch, chia sẻ kinh nghiệm và hình ảnh đẹp.', icon: '/social.svg' },
];

const ServiceSection = () => {
  return (
    <section className="relative bg-transparent py-14 sm:py-20 px-4">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          
          <div className="w-full lg:w-[320px] flex-shrink-0 text-center lg:text-left">
            <p className="text-[var(--error)] font-medium font-inter text-lg sm:text-xl mb-2">
              What we serve
            </p>
            <h2 className="font-bold font-inter text-[22px] sm:text-[28px] leading-snug text-[var(--black-1)]">
              Chúng tôi cung cấp <br /> dịch vụ tốt nhất
            </h2>
          </div>

          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-6 lg:mt-0">
              {services.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-white w-full rounded-xl px-4 sm:px-5 py-5 sm:py-6 text-left
                             border-r-2 border-b-2 border-[var(--secondary)]
                             transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 mb-4 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(208,228,255,0.9) 40%, transparent 80%)',
                      mixBlendMode: 'multiply',
                    }}
                  >
                    <Image src={service.icon} alt={service.title} width={22} height={22} className="sm:w-[24px] sm:h-[24px]" />
                  </div>

                  <h3 className="text-sm sm:text-base font-medium text-[var(--black-1)] mb-1">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--gray-3)] leading-relaxed">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ServiceSection;
