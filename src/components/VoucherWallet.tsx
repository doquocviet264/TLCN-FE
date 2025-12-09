"use client";
import React, { useEffect, useState } from "react";
import { FaTicketAlt, FaCopy } from "react-icons/fa";
import { checkinApi } from "@/lib/checkin/checkinApi";

export default function VoucherWallet() {
  const [vouchers, setVouchers] = useState<any[]>([]);

  useEffect(() => {
    // Gọi API lấy danh sách voucher (Hàm getMyVouchers ở Bước 1)
    checkinApi.getMyVouchers().then((res: any) => {
      if (res) setVouchers(res);
    });
  }, []);

  if (vouchers.length === 0) return null; // Không có thì ẩn

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <FaTicketAlt className="text-amber-500" /> Kho Voucher Của Bạn
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vouchers.map((v, idx) => (
          <div
            key={idx}
            className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm relative group"
          >
            <div className="absolute top-0 right-0 p-1 bg-amber-100 text-[10px] text-amber-700 font-bold rounded-bl-lg">
              GIẢM 10%
            </div>
            <h3 className="font-bold text-slate-800">{v.provinceName}</h3>
            <div
              className="mt-3 bg-slate-50 border border-dashed border-slate-300 rounded p-2 flex justify-between items-center cursor-pointer hover:bg-white"
              onClick={() => navigator.clipboard.writeText(v.voucherCode)}
            >
              <code className="text-amber-600 font-bold">{v.voucherCode}</code>
              <FaCopy className="text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
