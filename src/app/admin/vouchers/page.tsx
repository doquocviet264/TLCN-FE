"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAdminVouchers } from "@/lib/admin/adminVoucherApi";
import VoucherTable from "./VoucherTable";
import AdminPagination from "@/components/admin/AdminPagination";

export default function AdminVouchersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");

  // Use a debounced value or just rely on enter key if needed. We'll use simple search term state here.
  // For production, consider using a useDebounce hook.

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["adminVouchers", page, searchTerm, statusFilter],
    queryFn: () =>
      getAdminVouchers({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter === "" ? undefined : statusFilter,
      }),
  });

  const vouchers = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / (data?.limit || 10));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Quản Lý Khuyến Mãi (Vouchers)
          </h1>
          <p className="text-slate-600">
            Quản lý các mã giảm giá, chiến dịch khuyến mãi cho khách hàng
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/vouchers/create")}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
        >
          <i className="ri-add-line"></i>
          Tạo Voucher Mới
        </button>
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
                placeholder="Mã voucher, tên chiến dịch..."
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
                <i className="ri-coupon-line text-lg"></i>
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-slate-50 transition appearance-none outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang kích hoạt</option>
                <option value="inactive">Đã ngừng</option>
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

        {(searchTerm || statusFilter) && (
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setPage(1);
              }}
              className="text-xs text-slate-400 hover:text-orange-600 transition flex items-center gap-1.5"
            >
              <i className="ri-refresh-line"></i> Làm mới bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-red-500">
          <i className="ri-error-warning-line text-4xl mb-2"></i>
          <p>Có lỗi xảy ra: {(error as any).message}</p>
        </div>
      ) : (
        <>
          <VoucherTable vouchers={vouchers} />

          <AdminPagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={data?.total}
            itemsLabel="vouchers"
          />
        </>
      )}
    </div>
  );
}
