"use client";

import React from "react";
import { FaChevronDown, FaClock } from "react-icons/fa";

export type TourFilterValue = {
  to?: string;
  date?: string; // yyyy-mm-dd
  time?: string; // e.g. "3 ngày 2 đêm"
  keyword?: string;
  budget: [number, number]; // VND
};

type Props = {
  value: TourFilterValue;
  onChange: (v: TourFilterValue) => void;
  onSubmit: () => void;
  toOptions: string[]; // danh sách điểm đến
  timeOptions: string[]; // danh sách thời gian (time)
};

const currency = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace(/\s?₫$/, " đ");

export default function TourFilter({
  value,
  onChange,
  onSubmit,
  toOptions,
  timeOptions,
}: Props) {
  const set = (patch: Partial<TourFilterValue>) =>
    onChange({ ...value, ...patch });

  // slider kép: 2 input range phối hợp
  const min = 0;
  const max = 100_000_000;
  const step = 500_000;

  const [minVal, maxVal] = value.budget;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-black/5">
      {/* TO */}
      <label className="mb-2 flex items-center gap-2 text-[13px] font-bold text-blue-700 uppercase tracking-wide">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          className="rotate-180 text-blue-600"
        >
          <path
            fill="currentColor"
            d="m21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8L2 13v2l8-2.5V19l-2 1.5V22l3-1l3 1v-1.5L11 19v-5.5z"
          />
        </svg>
        Điểm đến
      </label>
      <div className="relative mb-4">
        <select
          value={value.to ?? ""}
          onChange={(e) => set({ to: e.target.value || undefined })}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
        >
          <option value="">Tất cả địa điểm</option>
          {toOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
      </div>

      {/* DATE */}
      <label className="mb-2 flex items-center gap-2 text-[13px] font-bold text-blue-700 uppercase tracking-wide">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          className="text-blue-600"
        >
          <path
            fill="currentColor"
            d="M7 2v2H5a2 2 0 0 0-2 2v1h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zM3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9zm2 2h4v4H5zm6 0h4v4h-4zm6 0h2v2h-2zm0 4h2v2h-2zM5 17h4v3H5zm6 0h4v3h-4z"
          />
        </svg>
        Ngày khởi hành
      </label>
      <input
        type="date"
        value={value.date ?? ""}
        onChange={(e) => set({ date: e.target.value || undefined })}
        className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
      />

      {/* TIME (Specific Duration) */}
      <label className="mb-2 flex items-center gap-2 text-[13px] font-bold text-blue-700 uppercase tracking-wide">
        <FaClock className="text-blue-600" />
        Thời gian
      </label>
      <div className="relative mb-4">
        <select
          value={value.time ?? ""}
          onChange={(e) => set({ time: e.target.value || undefined })}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
        >
          <option value="">Tất cả thời gian</option>
          {timeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
      </div>

      <label className="mb-2 flex items-center gap-2 text-[13px] font-bold text-blue-700 uppercase tracking-wide">
        <FaSearch className="text-blue-600 opacity-0" /> {/* Placeholder spacing */}
        Tìm kiếm từ khóa
      </label>
      <input
        value={value.keyword ?? ""}
        onChange={(e) => set({ keyword: e.target.value || undefined })}
        placeholder="Nhập tên tour, mô tả..."
        className="mb-5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
      />

      {/* BUDGET */}
      <div className="mb-2 text-[13px] font-bold text-blue-700 uppercase tracking-wide">
        Ngân sách dự kiến
      </div>
      <div className="mb-3 flex flex-col gap-1 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Tối thiểu:</span>
          <b className="text-slate-900">{currency(minVal)}</b>
        </div>
        <div className="flex justify-between">
          <span>Tối đa:</span>
          <b className="text-slate-900">{currency(maxVal)}</b>
        </div>
      </div>

      {/* Slider */}
      <div className="relative mt-4 mb-8 px-2">
        <style jsx>{`
          .range-input {
            pointer-events: none;
            position: absolute;
            height: 6px;
            width: 100%;
            appearance: none;
            background: none;
            left: 0;
          }
          .range-input::-webkit-slider-thumb {
            pointer-events: auto;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            border: 2px solid #f97316;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .range-input::-moz-range-thumb {
            pointer-events: auto;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            border: 2px solid #f97316;
            cursor: pointer;
          }
        `}</style>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), maxVal - step);
            set({ budget: [v, maxVal] });
          }}
          className="range-input z-30"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), minVal + step);
            set({ budget: [minVal, v] });
          }}
          className="range-input z-20"
        />
        <div className="h-1.5 w-full rounded-full bg-slate-100" />
        <div
          className="absolute top-0 h-1.5 rounded-full bg-orange-500"
          style={{
            left: `${((minVal - min) / (max - min)) * 100}%`,
            width: `${((maxVal - minVal) / (max - min)) * 100}%`,
          }}
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="mt-2 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
      >
        Tìm kiếm tour
      </button>
    </aside>
  );
}

import { FaSearch } from "react-icons/fa";
