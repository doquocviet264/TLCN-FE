// components/SearchBox.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSearch,
  FaMoneyBillWave,
} from "react-icons/fa";
import { getTours } from "@/lib/tours/tour";

const budgetOptions = [
  { label: "Dưới 2 triệu", min: 0, max: 2000000 },
  { label: "Từ 2-5 triệu", min: 2000000, max: 5000000 },
  { label: "Từ 5-10 triệu", min: 5000000, max: 10000000 },
  { label: "Trên 10 triệu", min: 10000000, max: 1000000000 },
];

const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

interface DestSuggestion {
  id: string;
  name: string;
  image: string;
  address: string;
}

const SearchBox = () => {
  const router = useRouter();

  const [where, setWhere] = useState("");
  const [date, setDate] = useState("");
  const [budgetIdx, setBudgetIdx] = useState<number | null>(null);

  const [destinations, setDestinations] = useState<DestSuggestion[]>([]);
  const [filteredDests, setFilteredDests] = useState<DestSuggestion[]>([]);
  const [showDests, setShowDests] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const destRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getTours(1, 100, {});
        const tours = res.data || [];
        
        const destMap = new Map<string, DestSuggestion>();
        tours.forEach((t: any) => {
          if (t.destination && !destMap.has(t.destination)) {
            destMap.set(t.destination, {
              id: t._id,
              name: t.destination,
              image: t.images?.[0] || "/placeholder-dest.jpg",
              address: "Việt Nam"
            });
          }
        });
        
        setDestinations(Array.from(destMap.values()));
      } catch (err) {
        console.error("Failed to fetch tours for destinations:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const searchStr = normalize(where);
    if (searchStr === "") {
      setFilteredDests([]);
      return;
    }
    const filtered = destinations.filter((d) =>
      normalize(d.name).includes(searchStr)
    );
    setFilteredDests(filtered.slice(0, 5));
  }, [where, destinations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDests(false);
      }
      if (
        budgetRef.current &&
        !budgetRef.current.contains(event.target as Node)
      ) {
        setShowBudget(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    const currentInput = where.trim();

    if (currentInput) {
      // Check if input matches a known destination (case-insensitive & accent-insensitive)
      const matchedDest = destinations.find(
        (d) => normalize(d.name) === normalize(currentInput)
      );

      if (matchedDest || isSelected) {
        // If matched or explicitly selected, use 'destination' param
        qs.set("destination", matchedDest?.name || currentInput);
      } else {
        // Otherwise use general keyword search 'q'
        qs.set("q", currentInput);
      }
    }

    if (date) qs.set("from", date);
    if (budgetIdx !== null) {
      const b = budgetOptions[budgetIdx];
      qs.set("budgetMin", String(b.min));
      qs.set("budgetMax", String(b.max));
    }

    router.push(`/user/destination?${qs.toString()}`);
  };

  return (
    <div className="pointer-events-none relative z-30 -mt-14 flex justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="pointer-events-auto w-full max-w-5xl h-16 bg-white/95 backdrop-blur-md rounded-full shadow-[0_15px_50px_-15px_rgba(0,0,0,0.3)] ring-1 ring-black/5 flex items-center px-2 border border-white/20"
      >
        {/* Destination Field */}
        <div className="relative flex-[1.5]" ref={destRef}>
          <Field
            icon={<FaMapMarkerAlt className="text-orange-500" />}
            placeholder="Bạn muốn đến đâu?"
            value={where}
            onChange={(e) => {
              setWhere(e.target.value);
              setShowDests(true);
              setIsSelected(false);
            }}
            onFocus={() => setShowDests(true)}
            autoComplete="off"
          />
          {showDests && filteredDests.length > 0 && (
            <div className="absolute top-[calc(100%+12px)] left-0 w-80 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Điểm đến gợi ý
                </span>
              </div>
              <ul className="py-2 max-h-[350px] overflow-y-auto">
                {filteredDests.map((dest) => (
                  <li
                    key={dest.id}
                    onClick={() => {
                      setWhere(dest.name);
                      setShowDests(false);
                      setIsSelected(true);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm border border-white">
                      <img
                        src={dest.image}
                        alt={dest.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-dest.jpg";
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">
                        {dest.name}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate max-w-[180px]">
                        {dest.address}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Divider />

        {/* Date Field */}
        <div className="flex-1">
          <Field
            type="date"
            icon={<FaCalendarAlt className="text-orange-500" />}
            placeholder="Ngày đi"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <Divider />

        {/* Budget Field */}
        <div className="relative flex-1" ref={budgetRef}>
          <div
            onClick={() => setShowBudget(!showBudget)}
            className="group flex items-center gap-2 px-4 h-12 rounded-full hover:bg-black/[0.04] cursor-pointer transition"
          >
            <span className="text-orange-500">
              <FaMoneyBillWave />
            </span>
            <div className="flex flex-col justify-center">
              <span
                className={`text-[0.95rem] ${
                  budgetIdx === null ? "text-neutral-400" : "text-neutral-800"
                }`}
              >
                {budgetIdx === null ? "Ngân sách" : budgetOptions[budgetIdx].label}
              </span>
            </div>
          </div>
          {showBudget && (
            <div className="absolute top-[calc(100%+12px)] left-0 w-60 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Chọn mức giá
                </span>
              </div>
              <ul className="py-2">
                {budgetOptions.map((opt, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setBudgetIdx(idx);
                      setShowBudget(false);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                      budgetIdx === idx
                        ? "bg-orange-500 text-white font-semibold"
                        : "text-gray-700 hover:bg-orange-50"
                    }`}
                  >
                    {opt.label}
                  </li>
                ))}
                {budgetIdx !== null && (
                  <li
                    onClick={() => {
                      setBudgetIdx(null);
                      setShowBudget(false);
                    }}
                    className="px-4 py-2 text-xs text-orange-600 font-medium hover:underline cursor-pointer mt-1 text-center"
                  >
                    Xoá lọc
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="ml-2 h-12 px-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold flex items-center gap-2 shadow-[0_6px_20px_-4px_rgba(249,115,22,0.5)] hover:shadow-[0_8px_25px_-4px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none transition-all duration-200"
        >
          <FaSearch className="text-white" />
          Tìm kiếm
        </button>
      </form>
    </div>
  );
};

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  placeholder?: string;
};

const Field = ({ icon, placeholder, className, ...rest }: FieldProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (rest.type === "date" && inputRef.current)
      inputRef.current.type = "date";
    rest.onFocus?.(e);
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (rest.type === "date" && inputRef.current && !inputRef.current.value)
      inputRef.current.type = "text";
    rest.onBlur?.(e);
  };
  return (
    <div className="group flex-1 flex items-center gap-2 px-4 h-12 rounded-full hover:bg-black/[0.04] focus-within:bg-black/[0.04] transition">
      <span className="text-neutral-500">{icon}</span>
      <input
        ref={inputRef}
        aria-label={placeholder}
        placeholder={placeholder}
        {...rest}
        type={rest.type === "date" ? "text" : rest.type}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`w-full bg-transparent text-[0.95rem] text-neutral-800 placeholder:text-neutral-400 focus:outline-none ${
          className || ""
        }`}
      />
    </div>
  );
};

const Divider = () => (
  <div className="hidden md:block h-8 w-px bg-neutral-200 mx-1" />
);

export default SearchBox;
