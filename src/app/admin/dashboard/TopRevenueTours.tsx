"use client";
import React from "react";
import Link from "next/link";

interface TopRevenueTour {
  _id: string;
  title: string;
  destination: string;
  totalRevenue: number;
  bookingCount: number;
  totalGuests: number;
}

interface TopRevenueToursProps {
  data: TopRevenueTour[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const TopRevenueTours: React.FC<TopRevenueToursProps> = ({ data }) => {
  const maxRevenue = Math.max(...data.map((t) => t.totalRevenue), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-600 dark:bg-orange-900/40 dark:text-orange-200">
            $
          </span>
          Tours doanh thu cao nhất
        </h3>
        <Link
          href="/admin/tours"
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          Xem tất cả →
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Chưa có dữ liệu doanh thu tour.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((tour, index) => {
            const percentage = (tour.totalRevenue / maxRevenue) * 100;
            return (
              <div
                key={tour._id || index}
                className="relative overflow-hidden rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
              >
                {/* Progress bar background */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-orange-100 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10"
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-xs font-bold text-white shadow-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {tour.title}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {tour.destination} • {tour.bookingCount} booking • {tour.totalGuests} khách
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(tour.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tổng top 5:</span>
            <span className="font-bold text-orange-600">
              {formatCurrency(data.reduce((sum, t) => sum + t.totalRevenue, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopRevenueTours;
