"use client";
import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface BookingStatusStats {
  confirmed: { count: number; revenue: number };
  pending: { count: number; revenue: number };
  cancelled: { count: number; revenue: number };
}

interface BookingStatusChartProps {
  data: BookingStatusStats;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const BookingStatusChart: React.FC<BookingStatusChartProps> = ({ data }) => {
  const chartData = {
    labels: ["Đã xác nhận", "Chờ xác nhận", "Đã hủy"],
    datasets: [
      {
        data: [data.confirmed.count, data.pending.count, data.cancelled.count],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)",
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  const total = data.confirmed.count + data.pending.count + data.cancelled.count;
  const confirmedPercent = total > 0 ? ((data.confirmed.count / total) * 100).toFixed(1) : "0";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-xs font-bold text-purple-700 dark:bg-purple-900/50 dark:text-purple-100">
          P
        </span>
        Thống kê trạng thái booking
      </h3>

      <div className="flex items-center gap-6">
        <div className="relative h-36 w-36 flex-shrink-0">
          <Doughnut data={chartData} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">{total}</span>
            <span className="text-xs text-slate-500">Tổng</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Đã xác nhận</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900 dark:text-slate-50">{data.confirmed.count}</span>
              <span className="ml-2 text-xs text-slate-500">({confirmedPercent}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Chờ xác nhận</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900 dark:text-slate-50">{data.pending.count}</span>
              <span className="ml-2 text-xs text-slate-500">
                ({total > 0 ? ((data.pending.count / total) * 100).toFixed(1) : "0"}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Đã hủy</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900 dark:text-slate-50">{data.cancelled.count}</span>
              <span className="ml-2 text-xs text-slate-500">
                ({total > 0 ? ((data.cancelled.count / total) * 100).toFixed(1) : "0"}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Doanh thu đã xác nhận:</span>
          <span className="font-bold text-emerald-600">{formatCurrency(data.confirmed.revenue)}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingStatusChart;
