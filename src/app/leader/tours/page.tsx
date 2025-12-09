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
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Chờ xác nhận" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-700", label: "Đã xác nhận" },
  in_progress: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Đang diễn ra" },
  completed: { bg: "bg-slate-100", text: "text-slate-700", label: "Hoàn thành" },
  closed: { bg: "bg-red-100", text: "text-red-700", label: "Đã đóng" },
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải danh sách tour...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          Tour của tôi
        </h1>
        <p className="text-slate-600">
          Quản lý các tour được phân công cho bạn
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên tour, điểm đến..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-56">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all appearance-none bg-white"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
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
        <div className="bg-white rounded-xl p-12 text-center border border-slate-100">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
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
              className="block bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                      <Plane className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">
                        {tour.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-500">
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
                      statusColors[tour.status]?.bg || "bg-slate-100"
                    } ${statusColors[tour.status]?.text || "text-slate-700"}`}
                  >
                    {statusColors[tour.status]?.label || tour.status}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-sm text-slate-600 text-center">
          Hiển thị <span className="font-semibold text-slate-800">{filteredTours.length}</span> trong tổng số{" "}
          <span className="font-semibold text-slate-800">{tours.length}</span> tour
        </p>
      </div>
    </div>
  );
}
