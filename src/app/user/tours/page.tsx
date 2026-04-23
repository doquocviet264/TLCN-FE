"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Star,
  Users,
  ChevronDown,
  SlidersHorizontal,
  X,
  Compass,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { searchTours, type Tour } from "@/lib/tours/tour";

interface TourFilters {
  search: string;
  destination: string;
  minPrice: string;
  maxPrice: string;
  duration: string;
  rating: string;
  sortBy: string;
}

const PER_PAGE = 12;

function ToursPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<TourFilters>({
    search: searchParams?.get("search") || "",
    destination: searchParams?.get("destination") || "",
    minPrice: searchParams?.get("minPrice") || "",
    maxPrice: searchParams?.get("maxPrice") || "",
    duration: searchParams?.get("duration") || "",
    rating: searchParams?.get("rating") || "",
    sortBy: searchParams?.get("sortBy") || "newest",
  });

  const [page, setPage] = useState<number>(() => {
    const p = searchParams?.get("page");
    return p ? Math.max(parseInt(p, 10) || 1, 1) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const destinations = [
    "Hà Nội", "TP.HCM", "Đà Nẵng", "Hội An", "Huế",
    "Nha Trang", "Đà Lạt", "Phú Quốc", "Sapa", "Hạ Long",
  ];

  const durations = [
    { label: "1-2 ngày", value: "1-2" },
    { label: "3-4 ngày", value: "3-4" },
    { label: "5-7 ngày", value: "5-7" },
    { label: "Hơn 7 ngày", value: "7+" },
  ];

  const sortOptions = [
    { label: "Mới nhất", value: "newest" },
    { label: "Giá thấp → cao", value: "price_asc" },
    { label: "Giá cao → thấp", value: "price_desc" },
    { label: "Đánh giá cao", value: "rating" },
    { label: "Phổ biến", value: "popular" },
  ];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const updateURL = (newFilters: TourFilters, pageValue?: number) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const p = pageValue ?? page;
    if (p && p > 1) params.set("page", String(p));
    router.push(`/user/tours?${params.toString()}`, { scroll: false });
  };

  const handleFilterChange = (key: keyof TourFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1);
    updateURL(newFilters, 1);
  };

  const clearFilters = () => {
    const clearedFilters: TourFilters = {
      search: "", destination: "", minPrice: "", maxPrice: "",
      duration: "", rating: "", sortBy: "newest",
    };
    setFilters(clearedFilters);
    setPage(1);
    updateURL(clearedFilters, 1);
  };

  const fetchTours = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await searchTours(page, PER_PAGE, {
        search: filters.search || undefined,
        destination: filters.destination || undefined,
        minPrice: filters.minPrice ? parseInt(filters.minPrice, 10) : undefined,
        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice, 10) : undefined,
      });
      setTours(res.data || []);
      setTotal(res.total || 0);
      const limit = res.limit || PER_PAGE;
      setTotalPages(Math.max(1, Math.ceil((res.total || 0) / limit)));
    } catch {
      setError("Không thể tải dữ liệu tour");
      setTours([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const filteredTours = tours || [];
  const hasActiveFilters = filters.search || filters.destination || filters.minPrice || filters.maxPrice;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-16 lg:py-20">
        {/* Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Blobs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-orange-500/15 blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-orange-300 text-sm font-medium mb-4">
              <Compass className="w-4 h-4" />
              <span>Khám phá hàng trăm tour hấp dẫn</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tìm tour du lịch <span className="text-orange-400">hoàn hảo</span>
            </h1>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Hàng ngàn điểm đến tuyệt vời đang chờ bạn khám phá cùng AHH Travel
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tìm kiếm tour
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Nhập tên tour, địa điểm..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Điểm đến
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <select
                      value={filters.destination}
                      onChange={(e) => handleFilterChange("destination", e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Tất cả</option>
                      {destinations.map((dest) => (
                        <option key={dest} value={dest}>{dest}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Sắp xếp
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                showFilters
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc nâng cao
            </button>

            <div className="text-slate-600 text-sm">
              Hiển thị <span className="font-semibold text-slate-900">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)}</span> trong <span className="font-semibold text-orange-600">{total}</span> tour
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                <X className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
              </div>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="w-4 h-4 space-y-1">
                <div className="bg-current h-0.5 rounded" />
                <div className="bg-current h-0.5 rounded" />
                <div className="bg-current h-0.5 rounded" />
              </div>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Giá từ (VNĐ)</label>
                <input
                  type="number"
                  placeholder="Giá tối thiểu"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Giá đến (VNĐ)</label>
                <input
                  type="number"
                  placeholder="Giá tối đa"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Thời gian</label>
                <select
                  value={filters.duration}
                  onChange={(e) => handleFilterChange("duration", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">Tất cả</option>
                  {durations.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Đánh giá</label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange("rating", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">Tất cả</option>
                  <option value="4.5">4.5★ trở lên</option>
                  <option value="4.0">4.0★ trở lên</option>
                  <option value="3.5">3.5★ trở lên</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-52 bg-slate-200" />
                <div className="p-5">
                  <div className="h-5 bg-slate-200 rounded-lg mb-3 w-3/4" />
                  <div className="h-4 bg-slate-200 rounded-lg w-1/2 mb-4" />
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-slate-200 rounded-lg w-24" />
                    <div className="h-10 bg-slate-200 rounded-xl w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Có lỗi xảy ra</h3>
            <p className="text-slate-500 mb-6">Không thể tải dữ liệu tour. Vui lòng thử lại.</p>
            <button
              onClick={() => fetchTours()}
              className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25"
            >
              Thử lại
            </button>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy tour nào</h3>
            <p className="text-slate-500 mb-6">Hãy thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredTours.map((tour: any, index) => {
                const id = String(tour._id ?? tour.id ?? "");
                const slug = tour.destinationSlug ?? slugify(tour.title);
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  className={`group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <div className={`relative ${viewMode === "list" ? "w-72 flex-shrink-0" : ""}`}>
                    <Image
                      src={tour.cover || tour.images?.[0] || "/placeholder-tour.jpg"}
                      alt={tour.title}
                      width={400}
                      height={250}
                      className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        viewMode === "list" ? "h-full" : "h-52"
                      }`}
                    />
                    {tour.rating && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full shadow-md">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold text-slate-700">{tour.rating}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {tour.title}
                    </h3>

                    <div className="space-y-2 text-sm text-slate-500 mb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-400" />
                        <span>{tour.destination || "Điểm đến chưa xác định"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>{tour.nextDepartureDate ? new Date(tour.nextDepartureDate).toLocaleDateString("vi-VN") : (tour.time || "Sắp có lịch")}</span>
                      </div>
                      
                      {/* Thay thế 'Còn X chỗ' bằng 'Lịch khởi hành' */}
                      <div className="pt-2">
                        <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Lịch khởi hành dự kiến
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {tour.upcomingDepartures && tour.upcomingDepartures.length > 0 ? (
                            tour.upcomingDepartures.slice(0, 3).map((dep: any) => (
                              <span 
                                key={dep._id} 
                                className="px-2 py-1 bg-slate-100 rounded text-[11px] font-medium text-slate-600 border border-slate-200"
                              >
                                {new Date(dep.startDate).toLocaleDateString("vi-VN")}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa có lịch gần đây</span>
                          )}
                          {tour.upcomingDepartures?.length > 3 && (
                            <span className="text-[11px] text-slate-400 flex items-center">
                              +{tour.upcomingDepartures.length - 3} ngày khác
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-xl font-bold text-orange-600">
                          {formatPrice(Number(tour.priceAdult) || 0)}
                        </span>
                        <span className="text-sm text-slate-400 ml-1">/người</span>
                      </div>
                      <Link
                        href={`/user/destination/${slug}/${id}`}
                        className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md shadow-orange-500/25"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );})}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <div className="inline-flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = page === pageNum;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => {
                          setPage(pageNum);
                          updateURL(filters, pageNum);
                        }}
                        className={`min-w-[40px] h-10 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default function ToursPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500 mx-auto" />
            <p className="mt-4 text-slate-600">Đang tải...</p>
          </div>
        </div>
      }
    >
      <ToursPageContent />
    </Suspense>
  );
}
