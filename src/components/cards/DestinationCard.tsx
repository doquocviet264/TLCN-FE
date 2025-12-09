"use client";

import Image from "next/image";
import Link from "next/link"; // 👈 Import Link
import React from "react";
import { Clock, Tag } from "lucide-react"; // Ví dụ icon nếu bạn dùng

export type DestinationCardProps = {
  image: string;
  title: string;
  duration: string;
  price: string;
  href?: string; // 👈 Thêm prop href (optional)
};

const DestinationCard: React.FC<DestinationCardProps> = ({
  image,
  title,
  duration,
  price,
  href = "#", // Default nếu không truyền
}) => {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl border border-slate-100">
      {/* Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-slate-800 group-hover:text-[var(--primary)] transition-colors">
          <Link href={href} title={title}>
            {title}
          </Link>
        </h3>

        {/* Info */}
        <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock size={16} />
            <span>{duration}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-medium text-slate-400">Giá chỉ từ</p>
            <p className="text-lg font-bold text-rose-600">{price}</p>
          </div>

          {/* 👇 Nút Đặt Tour chuyển hướng theo href */}
          <Link
            href={href}
            className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 shadow-sm"
          >
            Đặt Tour
          </Link>
        </div>
      </div>
    </article>
  );
};

export default DestinationCard;
