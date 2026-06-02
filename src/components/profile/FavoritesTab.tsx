"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plane, Clock3, Search, LayoutGrid, List as ListIcon, Star } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { getMyFavorites, toggleFavorite, type FavoriteItem } from "@/lib/favorite/favoriteApi";

const vnd = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 0,
      }).format(n) + "đ"
    : "—";

export default function FavoritesTab() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await getMyFavorites();
      setFavorites(res.data || []);
    } catch (error) {
      console.error("Lỗi tải tour yêu thích:", error);
      toast.error("Không tải được danh sách tour yêu thích");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (e: React.MouseEvent, tourId: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setFavorites((prev) => prev.filter((item) => item.tourId?._id !== tourId));
      const res = await toggleFavorite(tourId);
      if (res.isFavorite) {
        fetchFavorites();
      }
    } catch (error) {
      toast.error("Lỗi khi bỏ yêu thích");
      fetchFavorites();
    }
  };

  const filteredFavorites = useMemo(() => {
    if (!searchTerm.trim()) return favorites;
    const s = searchTerm.toLowerCase();
    return favorites.filter(f => 
      f.tourId?.title?.toLowerCase().includes(s) || 
      f.tourId?.destination?.toLowerCase().includes(s)
    );
  }, [favorites, searchTerm]);

  return (
    <div className="space-y-6">
      {/* --- Toolbar (Subtle Title Replacement) --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm trong danh sách yêu thích..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl">
             <button 
               onClick={() => setViewMode("grid")}
               className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
             >
               <LayoutGrid size={18} />
             </button>
             <button 
               onClick={() => setViewMode("list")}
               className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
             >
               <ListIcon size={18} />
             </button>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold">
            <Heart size={14} fill="currentColor" />
            {favorites.length} Tours
          </div>
        </div>
      </div>

      {/* --- Grid / List View --- */}
      {loading ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-100">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Đang chuẩn bị hành trình...</p>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <Heart size={40} className="text-slate-200" />
           </div>
           <p className="text-slate-800 font-bold text-lg">Hành trình yêu thích trống</p>
           <p className="text-slate-400 text-sm mb-6">Bạn chưa lưu lại chuyến đi nào.</p>
           <Link href="/user/tour-list" className="px-6 py-2.5 bg-blue-950 text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20">
             Khám phá tour mới
           </Link>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          <AnimatePresence>
            {filteredFavorites.map((item, idx) => {
              const tour = item.tourId;
              if (!tour) return null;

              return (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 ${viewMode === "list" ? "flex" : "flex flex-col"}`}
                >
                  {/* Thumbnail */}
                  <Link 
                    href={`/user/destination/tour/${tour._id}`} 
                    className={`block relative overflow-hidden ${viewMode === "list" ? "w-48 h-auto flex-shrink-0" : "aspect-[4/3]"}`}
                  >
                    <Image
                      src={tour.images?.[0] || "/tour.jpg"}
                      alt={tour.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Floating Badge */}
                    {tour.rating && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-orange-500 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <Star size={10} fill="currentColor" /> {tour.rating.toFixed(1)}
                      </div>
                    )}

                    <button
                      onClick={(e) => handleRemoveFavorite(e, tour._id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full text-rose-500 shadow-sm hover:bg-white transition-all transform active:scale-90"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </Link>

                  {/* Details */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-3 mb-3">
                       {tour.destination && (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                           <Plane size={12} className="text-blue-400" />
                           {tour.destination}
                         </span>
                       )}
                       {tour.time && (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                           <Clock3 size={12} className="text-blue-400" />
                           {tour.time}
                         </span>
                       )}
                    </div>

                    <Link href={`/user/destination/tour/${tour._id}`} className="block mb-4">
                      <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        {tour.title}
                      </h3>
                    </Link>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Giá từ</span>
                          <span className="text-lg font-black text-orange-600 leading-none">
                            {vnd(tour.priceAdult)}
                          </span>
                       </div>
                       <Link 
                         href={`/user/destination/tour/${tour._id}`}
                         className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors"
                       >
                         Khám phá
                       </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
