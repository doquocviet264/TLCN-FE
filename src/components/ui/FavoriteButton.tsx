"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "#/stores/auth";
import { toggleFavorite, checkFavorite } from "@/lib/favorite/favoriteApi";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  tourId: string;
  initialIsFavorite?: boolean;
  className?: string;
  onToggleSuccess?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({
  tourId,
  initialIsFavorite = false,
  className = "",
  onToggleSuccess,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite || false);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Fetch favorite status from server
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user?.id || !tourId) return;
      try {
        const res = await checkFavorite(tourId);
        setIsFavorite(res.isFavorite);
      } catch (err) {
        console.error("Lỗi khi kiểm tra trạng thái yêu thích:", err);
      }
    };

    fetchStatus();
  }, [user?.id, tourId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu tour yêu thích");
      router.push("/auth/login");
      return;
    }

    const previousState = isFavorite;
    setIsFavorite(!previousState);
    setLoading(true);

    try {
      const res = await toggleFavorite(tourId);
      setIsFavorite(res.isFavorite); // Sync with server
      if (res.isFavorite) {
        toast.success("Đã thêm vào yêu thích");
      } else {
        toast.success("Đã bỏ yêu thích");
      }
      if (onToggleSuccess) {
        onToggleSuccess(res.isFavorite);
      }
    } catch (error) {
      setIsFavorite(previousState); // Revert to old state
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={loading}
      className={`relative flex items-center justify-center p-2 rounded-full backdrop-blur-md shadow-sm transition-colors ${
        isFavorite
          ? "bg-rose-50 border border-rose-200"
          : "bg-white/80 border border-slate-200 hover:bg-white"
      } ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Yêu thích tour"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorite ? "filled" : "outline"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite
                ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                : "text-slate-500"
            }`}
          />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
