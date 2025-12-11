"use client";

import useUser from "@/hooks/useUser";
import Link from "next/link";
import { Pen, Sparkles, Award } from "lucide-react";
import { motion } from "framer-motion";

interface CreateBlogCTAProps {
  completedToursCount?: number;
}

const CreateBlogCTA = ({ completedToursCount = 0 }: CreateBlogCTAProps) => {
  const { user } = useUser();

  if (!user || completedToursCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 p-6 shadow-xl"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Pen className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
              Chia sẻ trải nghiệm
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            Kể câu chuyện hành trình của bạn!
          </h3>
          <p className="text-sm text-blue-200">
            Bạn đã hoàn thành{" "}
            <span className="font-bold text-orange-400">{completedToursCount} tour</span>.
            Viết blog để chia sẻ những khoảnh khắc đáng nhớ với cộng đồng du lịch.
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-xs text-blue-100">
              <Award className="h-3 w-3 text-orange-400" />
              Nhận điểm thưởng
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-xs text-blue-100">
              <Sparkles className="h-3 w-3 text-orange-400" />
              Được feature
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/user/post-blog"
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-bold text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105"
        >
          <Pen size={18} />
          Viết bài ngay
        </Link>
      </div>
    </motion.div>
  );
};

export default CreateBlogCTA;
