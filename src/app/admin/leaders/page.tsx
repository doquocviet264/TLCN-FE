"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminLeaders } from "@/lib/admin/adminLeaderApi";
import LeadersTable from "./LeadersTable";
import AdminPagination from "@/components/admin/AdminPagination";

export default function AdminLeadersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminLeaders", page, searchTerm, statusFilter],
    queryFn: () =>
      getAdminLeaders({
        page,
        limit: 20,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined,
      }),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Quản Lý Lãnh Đạo Du Lịch
        </h1>
        <p className="text-slate-600">Quản lý thông tin các lãnh đạo tour du lịch</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Tìm kiếm
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <i className="ri-search-line text-lg"></i>
              </span>
              <input
                type="text"
                placeholder="Tên, email, username, điện thoại..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-slate-50 transition outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Trạng thái
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <i className="ri-user-star-line text-lg"></i>
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | "active" | "inactive");
                  setPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-slate-50 transition appearance-none outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Vô hiệu</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <i className="ri-arrow-down-s-line"></i>
              </span>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <i className="ri-search-line"></i>
              Tìm kiếm
            </button>
          </div>
        </div>

        {(searchTerm || statusFilter !== "all") && (
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPage(1);
              }}
              className="text-xs text-slate-400 hover:text-orange-600 transition flex items-center gap-1.5"
            >
              <i className="ri-refresh-line"></i> Làm mới bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-slate-600">Đang tải dữ liệu...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-medium">Lỗi khi tải dữ liệu lãnh đạo</p>
          <p className="text-red-600 text-sm mt-2">{(error as any).message}</p>
        </div>
      ) : !data ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Không có dữ liệu lãnh đạo</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <LeadersTable leaders={data.data} />
          </div>

          <AdminPagination 
            currentPage={page}
            totalPages={Math.ceil(data.total / data.limit)}
            onPageChange={setPage}
            totalItems={data.total}
            itemsLabel="lãnh đạo"
          />
        </>
      )}
    </div>
  );
}
