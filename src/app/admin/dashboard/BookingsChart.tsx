"use client";
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyBookingData {
  month: string;
  monthIndex: number;
  count: number;
  guests: number;
}

interface BookingsChartProps {
  data: MonthlyBookingData[];
}

const BookingsChart: React.FC<BookingsChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Số booking",
        data: data.map((item) => item.count),
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgb(99, 102, 241)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y",
      },
      {
        label: "Số khách",
        data: data.map((item) => item.guests),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgb(16, 185, 129)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          padding: 20,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
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
        type: "linear" as const,
        display: true,
        position: "left" as const,
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 11,
          },
          stepSize: 1,
        },
        title: {
          display: true,
          text: "Booking",
          color: "#6366f1",
          font: { size: 10, weight: "500" as const },
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: "Khách",
          color: "#10b981",
          font: { size: 10, weight: "500" as const },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  const totalBookings = data.reduce((sum, item) => sum + item.count, 0);
  const totalGuests = data.reduce((sum, item) => sum + item.guests, 0);
  const avgGuestsPerBooking = totalBookings > 0 ? (totalGuests / totalBookings).toFixed(1) : "0";

  // Find current month stats
  const currentMonth = new Date().getMonth();
  const currentMonthData = data[currentMonth];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-100">
              B
            </span>
            Booking theo tháng
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            TB: <span className="font-semibold text-emerald-600">{avgGuestsPerBooking}</span> khách/booking
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-500">Tháng này</p>
            <p className="text-lg font-bold text-indigo-600">{currentMonthData?.count || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Khách</p>
            <p className="text-lg font-bold text-emerald-600">{currentMonthData?.guests || 0}</p>
          </div>
        </div>
      </div>

      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="text-center">
          <p className="text-xs text-slate-500">Tổng booking</p>
          <p className="text-sm font-semibold text-indigo-600">{totalBookings}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Tổng khách</p>
          <p className="text-sm font-semibold text-emerald-600">{totalGuests}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">TB/booking</p>
          <p className="text-sm font-semibold text-purple-600">{avgGuestsPerBooking}</p>
        </div>
      </div>
    </div>
  );
};

export default BookingsChart;
