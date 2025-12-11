// components/SearchBox.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaMapMarkerAlt,
  FaPaperPlane,
  FaCalendarAlt,
  FaUser,
  FaSearch,
} from "react-icons/fa";

const slugify = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const SearchBox = () => {
  const router = useRouter();

  const [where, setWhere] = useState(""); // người dùng gõ "Thanh Hoá"
  const [fromPlace, setFromPlace] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    const qs = new URLSearchParams();

    // gửi cả q (giữ nguyên người dùng gõ) và destination (slug)
    if (where.trim()) {
      qs.set("q", where.trim()); // ví dụ "Thanh Hoá"
      qs.set("destination", slugify(where)); // => "thanh-hoa"
    }
    if (fromPlace.trim()) {
      qs.set("fromPlace", fromPlace.trim()); // Nơi khởi hành
    }
    if (date) qs.set("from", date);
    if (guests > 1) qs.set("guests", String(guests)); // Số khách

    router.push(`/user/destination?${qs.toString()}`);
  };

  return (
    <div className="pointer-events-none relative z-20 -mt-14 flex justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="pointer-events-auto w-full max-w-5xl h-16 bg-white/90 backdrop-blur rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] ring-1 ring-black/5 flex items-center px-2"
      >
        <Field
          icon={<FaMapMarkerAlt />}
          placeholder="Bạn muốn đến đâu?"
          value={where}
          onChange={(e) => setWhere(e.target.value)}
        />
        <Divider />
        <Field
          icon={<FaPaperPlane />}
          placeholder="Nơi khởi hành"
          value={fromPlace}
          onChange={(e) => setFromPlace(e.target.value)}
        />
        <Divider />
        <Field
          type="date"
          icon={<FaCalendarAlt />}
          placeholder="Ngày đi"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Divider />
        <Field
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value || 1))}
          icon={<FaUser />}
          placeholder="Số khách"
        />
        <button
          type="submit"
          className="ml-2 h-12 px-5 rounded-full bg-neutral-900 text-white text-sm font-semibold flex items-center gap-2 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.5)] hover:bg-black/90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition"
        >
          <FaSearch className="-ml-1" />
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
  const onFocus = () => {
    if (rest.type === "date" && inputRef.current)
      inputRef.current.type = "date";
  };
  const onBlur = () => {
    if (rest.type === "date" && inputRef.current && !inputRef.current.value)
      inputRef.current.type = "text";
  };
  return (
    <div className="group flex-1 min-w-[140px] flex items-center gap-2 px-4 h-12 rounded-full hover:bg-black/[0.04] focus-within:bg-black/[0.04] transition">
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
  <div className="hidden md:block h-8 w-px bg-neutral-200" />
);

export default SearchBox;
