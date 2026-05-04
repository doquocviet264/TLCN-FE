"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface DestinationData {
  name: string;
  bookings: number;
  revenue: number;
  guests: number;
}

interface TopPlaceChartProps {
  data: DestinationData[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const TopPlacesBarChart: React.FC<TopPlaceChartProps> = ({ data }) => {
  const labels = data.map((item) => item.name || "Khác");
  const dataValues = data.map((item) => item.bookings);

  const colors = [
    "rgba(249, 115, 22, 0.8)",  // orange
    "rgba(59, 130, 246, 0.8)",  // blue
    "rgba(16, 185, 129, 0.8)", // emerald
    "rgba(139, 92, 246, 0.8)", // purple
    "rgba(236, 72, 153, 0.8)", // pink
    "rgba(245, 158, 11, 0.8)", // amber
  ];

  const barData = {
    labels,
    datasets: [
      {
        label: "Lượt đặt",
        data: dataValues,
        backgroundColor: colors.slice(0, data.length),
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 32,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const item = data[index];
            return [
              `Lượt đặt: ${item.bookings}`,
              `Khách: ${item.guests}`,
              `Doanh thu: ${formatCurrency(item.revenue)}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          color: "#64748b",
          font: { size: 11 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: "#334155",
          font: { size: 12, weight: "500" },
        },
      },
    },
  };

  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-600 dark:bg-orange-900/50 dark:text-orange-100">
            📍
          </span>
          Top điểm đến phổ biến
        </h3>
        <p className="mt-8 text-center text-sm text-slate-500">
          Chưa có dữ liệu điểm đến
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-600 dark:bg-orange-900/50 dark:text-orange-100">
              📍
            </span>
            Top điểm đến phổ biến
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Tổng: <span className="font-semibold text-orange-600">{totalBookings}</span> lượt đặt
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Doanh thu</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="h-64">
        <Bar data={barData} options={options} />
      </div>

      {/* Legend with details */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        {data.slice(0, 4).map((item, index) => (
          <div
            key={item.name}
            className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colors[index] }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                {item.name}
              </p>
              <p className="text-[10px] text-slate-500">
                {item.bookings} đặt • {item.guests} khách
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopPlacesBarChart;
