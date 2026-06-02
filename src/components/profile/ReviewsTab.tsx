"use client";

import React, { useState, useEffect } from "react";
import { Star, Edit, Trash2, MessageSquare, Filter, ChevronDown, Calendar, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { getMyReviews, deleteReview } from "@/lib/reviews/reviewApi";
import ReviewModal from "@/components/ReviewModal";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating-high" | "rating-low">("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await getMyReviews();
      setReviews(res.data || []);
    } catch (error) {
      console.error("Lỗi tải đánh giá:", error);
      toast.error("Không tải được danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const sortedReviews = React.useMemo(() => {
    const list = [...reviews];
    switch (sortBy) {
      case "newest": return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "oldest": return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "rating-high": return list.sort((a, b) => b.rating - a.rating);
      case "rating-low": return list.sort((a, b) => a.rating - b.rating);
      default: return list;
    }
  }, [reviews, sortBy]);

  const sortLabels = {
    "newest": "Mới nhất",
    "oldest": "Cũ nhất",
    "rating-high": "Đánh giá cao",
    "rating-low": "Đánh giá thấp"
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await deleteReview(id);
      toast.success("Đã xóa đánh giá");
      fetchReviews();
    } catch (err) {
      toast.error("Lỗi khi xóa đánh giá");
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* --- Stats Strip (Thay thế cho Title) --- */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Star size={20} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Trung bình</p>
              <p className="text-lg font-black text-slate-700">{avgRating}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
              <MessageSquare size={20} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Đánh giá</p>
              <p className="text-lg font-black text-slate-700">{reviews.length}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors border border-slate-100"
          >
            <Filter size={16} />
            {sortLabels[sortBy]}
            <ChevronDown size={14} className={`transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
          </button>

          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {(Object.keys(sortLabels) as Array<keyof typeof sortLabels>).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortBy(key);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 ${sortBy === key ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-600"}`}
                  >
                    {sortLabels[key]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- Reviews List --- */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Đang truy xuất dữ liệu...</p>
          </div>
        ) : sortedReviews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={40} className="text-slate-200" />
            </div>
            <p className="text-slate-500 font-bold text-lg">Chưa có đánh giá nào</p>
            <p className="text-slate-400 text-sm">Hãy chia sẻ trải nghiệm của bạn sau mỗi chuyến đi nhé!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedReviews.map((review, idx) => (
              <motion.div 
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Tour Info & Image */}
                  <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden relative flex-shrink-0 shadow-inner bg-slate-100">
                    <img 
                      src={review.tourId?.cover || review.tourId?.images?.[0] || "/tour.jpg"} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                       <p className="text-[10px] text-white/80 font-bold flex items-center gap-1">
                         <MapPin size={10} /> {review.tourId?.destination || "Việt Nam"}
                       </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
                          {review.tourId?.title || "Tour đã xóa"}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={s <= review.rating ? "fill-orange-400 text-orange-400" : "text-slate-200"}
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-400 ml-2">
                            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingReview(review)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteReview(review._id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="relative mt-2">
                      <div className="absolute -left-2 top-0 text-slate-100">
                        <MessageSquare size={40} fill="currentColor" className="opacity-50" />
                      </div>
                      <p className="relative text-slate-600 italic leading-relaxed text-sm z-10 pl-2">
                        "{review.comment || "Không có bình luận"}"
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {editingReview && (
        <ReviewModal
          tour={{ id: editingReview.tourId?._id, title: editingReview.tourId?.title }}
          initialData={{ rating: editingReview.rating, comment: editingReview.comment }}
          onClose={() => setEditingReview(null)}
          onSuccess={() => {
            setEditingReview(null);
            fetchReviews();
          }}
        />
      )}
    </div>
  );
}
