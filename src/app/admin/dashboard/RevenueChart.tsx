"use client";
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlyRevenueData {
  month: string;
  monthIndex: number;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  data: MonthlyRevenueData[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Doanh thu",
        data: data.map((item) => item.revenue),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 20,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Doanh thu: ${formatCurrency(context.raw)}`;
          },
        },
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 11,
          },
          callback: (value: any) => {
            if (value >= 1000000000) {
              return (value / 1000000000).toFixed(1) + " tỷ";
            }
            if (value >= 1000000) {
              return (value / 1000000).toFixed(0) + " tr";
            }
            return value.toLocaleString();
          },
        },
      },
    },
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);
  const currentMonth = new Date().getMonth();
  const currentMonthRevenue = data[currentMonth]?.revenue || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-100">
              $
            </span>
            Doanh thu theo tháng
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Tổng năm: <span className="font-semibold text-blue-600">{formatCurrency(totalRevenue)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Tháng này</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(currentMonthRevenue)}</p>
        </div>
      </div>

      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="text-center">
          <p className="text-xs text-slate-500">Tổng doanh thu</p>
          <p className="text-sm font-semibold text-blue-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Tổng booking</p>
          <p className="text-sm font-semibold text-emerald-600">{totalBookings}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">TB/booking</p>
          <p className="text-sm font-semibold text-purple-600">
            {totalBookings > 0 ? formatCurrency(totalRevenue / totalBookings) : "0"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
