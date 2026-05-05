"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAdminVouchers } from "@/lib/admin/adminVoucherApi";
import VoucherTable from "./VoucherTable";

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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Mã voucher, tên chiến dịch..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang kích hoạt</option>
              <option value="inactive">Đã ngừng</option>
            </select>
          </div>
        </div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <i className="ri-arrow-left-s-line"></i>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    page === i + 1
                      ? "bg-orange-600 text-white"
                      : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <i className="ri-arrow-right-s-line"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
