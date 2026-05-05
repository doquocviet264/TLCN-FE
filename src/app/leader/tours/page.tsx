"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Plane,
  Filter,
  Search,
} from "lucide-react";
import { leaderToursApi, LeaderTour } from "@/lib/leader/leaderApi";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Chờ xác nhận" },
  confirmed: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Đã xác nhận" },
  in_progress: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Đang diễn ra" },
  completed: { bg: "bg-slate-500/10", text: "text-slate-400", label: "Hoàn thành" },
  closed: { bg: "bg-red-500/10", text: "text-red-400", label: "Đã đóng" },
};

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "in_progress", label: "Đang diễn ra" },
  { value: "completed", label: "Hoàn thành" },
  { value: "closed", label: "Đã đóng" },
];

export default function LeaderToursPage() {
  const [tours, setTours] = useState<LeaderTour[]>([]);
  const [filteredTours, setFilteredTours] = useState<LeaderTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const data = await leaderToursApi.getMyTours(
          statusFilter ? { status: statusFilter } : undefined
        );
        setTours(data);
        setFilteredTours(data);
      } catch (err) {
        console.error("Error fetching tours:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, [statusFilter]);

  // Filter by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTours(tours);
      return;
    }

    const lowerSearch = searchTerm.toLowerCase();
    const filtered = tours.filter(
      (tour) =>
        tour.title.toLowerCase().includes(lowerSearch) ||
        tour.destination.toLowerCase().includes(lowerSearch)
    );
    setFilteredTours(filtered);
  }, [searchTerm, tours]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải danh sách tour...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-3xl p-8 relative overflow-hidden">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tour của tôi</h1>
          <p className="text-blue-100">
            Quản lý các tour được phân công cho bạn
          </p>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute -right-5 -bottom-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên tour, điểm đến..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-56">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tours List */}
      {filteredTours.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            Không tìm thấy tour
          </h3>
          <p className="text-slate-500">
            {searchTerm
              ? "Không có tour nào phù hợp với từ khóa tìm kiếm"
              : "Bạn chưa được phân công tour nào với trạng thái này"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTours.map((tour) => (
            <Link
              key={tour._id}
              href={`/leader/tours/${tour._id}`}
              className="block bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                      <Plane className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg group-hover:text-blue-400 transition-colors">
                        {tour.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {tour.destination}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {tour.bookedCount || 0}/{tour.quantity} khách
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      statusColors[tour.status]?.bg || "bg-slate-500/10"
                    } ${statusColors[tour.status]?.text || "text-slate-400"}`}
                  >
                    {statusColors[tour.status]?.label || tour.status}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
        <p className="text-sm text-slate-400 text-center">
          Hiển thị <span className="font-semibold text-white">{filteredTours.length}</span> trong tổng số{" "}
          <span className="font-semibold text-white">{tours.length}</span> tour
        </p>
      </div>
    </div>
  );
}
