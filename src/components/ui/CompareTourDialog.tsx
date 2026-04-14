"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

type CompareTourDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  baseTour: any; // TourDetail
  allTours: any[]; // danh sách tours để ng dùng có thể chọn đem ra so sánh
};

// Utils
const toNum = (v?: number | string) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d]/g, ""));
    return Number.isNaN(n) ? undefined : n;
  }
};

const vnd = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      })
        .format(n)
        .replace(/\s?₫$/, "VNĐ")
    : "—";

const getImage = (t: any) =>
  t?.images?.[0] || t?.image || t?.cover || "/hot1.jpg";

export default function CompareTourDialog({
  isOpen,
  onClose,
  baseTour,
  allTours,
}: CompareTourDialogProps) {
  const [targetTourId, setTargetTourId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Tìm targetTour từ ID
  const targetTour = useMemo(() => {
    if (!targetTourId) return null;
    return allTours.find((t) => String(t._id || t.id) === targetTourId) || null;
  }, [allTours, targetTourId]);

  // Bộ lọc tours hợp lệ để chọn (trừ baseTour) & có chứa từ khoá tìm kiếm
  const availableTours = useMemo(() => {
    return allTours.filter((t) => {
      const isNotBase = String(t._id || t.id) !== String(baseTour?._id || baseTour?.tourId);
      const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return isNotBase && matchesSearch;
    });
  }, [allTours, baseTour, searchTerm]);

  // Handle render tiêu chí
  const renderRow = (
    label: string,
    val1: React.ReactNode,
    val2: React.ReactNode,
    highlight?: boolean
  ) => (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
      <td className="px-6 py-5 text-sm font-semibold text-slate-600 align-middle whitespace-nowrap bg-slate-50/50 group-hover:bg-slate-100/50 w-1/4">
        {label}
      </td>
      <td
        className={`px-6 py-5 text-[15px] border-l border-r border-slate-100 w-[37.5%] align-middle ${
          highlight ? "font-bold text-slate-900" : "text-slate-700"
        }`}
      >
        {val1}
      </td>
      <td
        className={`px-6 py-5 text-[15px] w-[37.5%] align-middle ${
          highlight ? "font-bold text-slate-900" : "text-slate-700"
        }`}
      >
        {val2}
      </td>
    </tr>
  );

  const starRating = (rating?: number, count?: number) => {
    if (!rating) return <span className="text-slate-400 italic">Chưa có đánh giá</span>;
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center text-amber-400">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="ml-1 font-bold text-slate-700">{Number(rating).toFixed(1)}</span>
        </div>
        {count !== undefined && <span className="text-xs text-slate-500">({count})</span>}
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-blue-900 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 px-6 py-5 sm:px-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300 shadow-inner">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-extrabold text-white">
                        So Sánh Tour
                      </Dialog.Title>
                      <p className="text-xs text-slate-400 mt-0.5">Tìm kiếm hành trình tốt nhất cho bạn</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* Body Selector */}
                <div className="shrink-0 flex items-center border-b border-slate-200 bg-slate-50 px-6 py-4 shadow-sm sm:px-8 relative z-10">
                  <div className="w-1/4 pr-6">
                     <span className="text-sm font-semibold text-slate-600 block">Lựa chọn tour để đối chiếu</span>
                     <p className="text-xs text-slate-400 mt-1">Thông số sẽ được cập nhật khi bạn chọn</p>
                  </div>
                  <div className="w-[37.5%] px-6 border-l border-slate-200">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-1.5">
                       Tour Đang Xem
                    </span>
                    <div className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug h-10">
                       {baseTour?.title || "N/A"}
                    </div>
                  </div>
                  <div className="w-[37.5%] pl-6 border-l border-slate-200">
                    <div className="flex flex-col">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1.5 focus-within:text-blue-700">
                         Chọn Tour Đối Chiếu Để Xem
                      </span>
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Tìm nhanh tên tour..."
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <select
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-0 transition-all hover:border-slate-300"
                        value={targetTourId}
                        onChange={(e) => setTargetTourId(e.target.value)}
                      >
                        <option value="">-- Click để chọn tour khác --</option>
                        {availableTours.map((t) => (
                          <option key={t._id || t.id} value={t._id || t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      {availableTours.length === 0 && (
                        <p className="mt-1.5 text-xs text-rose-500">
                          Không tìm thấy tour phù hợp với "{searchTerm}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comparison Content */}
                <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-8">
                  {!targetTour ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-20 text-slate-400 h-full">
                      <div className="relative">
                         <div className="absolute -inset-4 rounded-full bg-slate-50 animate-pulse"></div>
                         <svg className="relative h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                         </svg>
                      </div>
                      <p className="text-lg font-medium text-slate-500">Chưa có dữ liệu so sánh</p>
                      <p className="text-sm">Vui lòng chọn một tour ở trên để xem bảng đối chiếu chi tiết.</p>
                      
                      <button 
                        onClick={() => document.querySelector('select')?.focus()}
                        className="mt-4 px-6 py-2 rounded-full border-2 border-slate-200 text-slate-600 font-semibold hover:border-orange-400 hover:text-orange-500 transition-colors"
                      >
                         Chọn Tour Ngay
                      </button>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <tbody>
                        {/* Hình ảnh */}
                        <tr>
                          <td className="px-4 py-4 w-1/4"></td>
                          <td className="px-4 py-4 w-[37.5%] border-l border-r border-slate-100">
                             <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-sm group">
                                <Image src={getImage(baseTour)} alt="tour 1" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                {baseTour?.discountPercent ? (
                                   <div className="absolute top-3 right-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                                      -{baseTour.discountPercent}%
                                   </div>
                                ) : null}
                             </div>
                          </td>
                          <td className="px-4 py-4 w-[37.5%]">
                             <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-sm group">
                                <Image src={getImage(targetTour)} alt="tour 2" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                {targetTour?.discountPercent ? (
                                   <div className="absolute top-3 right-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                                      -{targetTour.discountPercent}%
                                   </div>
                                ) : null}
                             </div>
                          </td>
                        </tr>

                        {renderRow("Điểm đến", baseTour?.destination || "N/A", targetTour?.destination || "N/A", true)}
                        
                        {renderRow("Đánh giá trung bình", 
                          starRating(baseTour?.rating, baseTour?.reviewsCount), 
                          starRating(targetTour?.rating, targetTour?.reviewsCount)
                        )}
                        
                        {renderRow("Thời gian tour", 
                          <span className="flex items-center gap-2 font-medium">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {baseTour?.time || "N/A"}
                          </span>, 
                          <span className="flex items-center gap-2 font-medium">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {targetTour?.time || "N/A"}
                          </span>
                        )}

                        {renderRow("Ngày khởi hành dự kiến", 
                          baseTour?.startDate ? new Date(baseTour.startDate).toLocaleDateString("vi-VN") : "Hàng ngày", 
                          targetTour?.startDate ? new Date(targetTour.startDate).toLocaleDateString("vi-VN") : "Hàng ngày"
                        )}

                        {/* GIÁ */}
                        {renderRow("Giá người lớn", 
                          <span className="text-xl text-orange-600 font-black">{vnd(toNum(baseTour?.priceAdult))}</span>, 
                          <span className="text-xl text-orange-600 font-black">{vnd(toNum(targetTour?.priceAdult))}</span>
                        )}
                        
                        {renderRow("Giá trẻ em", 
                          <span className="font-semibold text-slate-600">{vnd(toNum(baseTour?.priceChild))}</span>, 
                          <span className="font-semibold text-slate-600">{vnd(toNum(targetTour?.priceChild))}</span>
                        )}
                        
                        {renderRow("Ưu đãi giảm giá", 
                          Number(baseTour?.discountAmount) > 0 ? <span className="text-emerald-600 font-semibold">Giảm {vnd(baseTour.discountAmount)}</span> : "Không áp dụng", 
                          Number(targetTour?.discountAmount) > 0 ? <span className="text-emerald-600 font-semibold">Giảm {vnd(targetTour.discountAmount)}</span> : "Không áp dụng"
                        )}

                        {renderRow("Số lượng ghế", 
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-sm font-medium">
                             <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                             {baseTour?.quantity ?? baseTour?.seats ?? "??? Tổ chức"}
                          </span>, 
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-sm font-medium">
                             <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                             {targetTour?.quantity ?? targetTour?.seats ?? "??? Tổ chức"}
                          </span>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="shrink-0 flex items-center bg-slate-50 px-6 py-4 border-t border-slate-200 mt-auto">
                   <div className="w-1/4 text-xs italic text-slate-500 pr-6">
                      * Nhấn "Xem Chi Tiết" để đọc toàn bộ thông tin lộ trình và chính sách tour.
                   </div>
                   <div className="w-[37.5%] px-4 border-l border-slate-200">
                     <Link 
                        href={`/user/destination/${baseTour?.destinationSlug || "x"}/${baseTour?._id || baseTour?.tourId}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-300"
                        onClick={onClose}
                      >
                         Bỏ Qua, Đặt Tour Này
                      </Link>
                   </div>
                   <div className="w-[37.5%] pl-4">
                      {targetTour ? (
                        <Link 
                           href={`/user/destination/${targetTour?.destinationSlug || "x"}/${targetTour?._id || targetTour?.id}`}
                           className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 shadow-lg shadow-orange-500/30"
                           onClick={onClose}
                         >
                            Xem Chi Tiết Tour Đối Chiếu
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                         </Link>
                      ) : (
                         <div className="w-full text-center py-3 text-sm font-medium text-slate-400 border-2 border-dashed border-slate-300 rounded-xl bg-slate-100/50">
                            (Chưa có tour so sánh)
                         </div>
                      )}
                   </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
