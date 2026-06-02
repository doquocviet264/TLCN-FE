"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VoucherData } from "@/lib/admin/adminVoucherApi";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getAllToursAdmin } from "@/lib/admin/adminApi";

interface VoucherFormProps {
  initialData?: Partial<VoucherData>;
  onSubmit: (data: Partial<VoucherData>) => void;
  isPending: boolean;
  title: string;
}

export default function VoucherForm({ initialData, onSubmit, isPending, title }: VoucherFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<VoucherData>>({
    code: "",
    name: "",
    description: "",
    image: "",
    discountType: "percent",
    discountValue: 0,
    maxDiscount: undefined,
    minOrderValue: 0,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    usageLimit: undefined,
    userUsageLimit: 1,
    status: "active",
    applicableTours: [],
    ...initialData,
  });

  const { data: toursData } = useQuery({
    queryKey: ["adminToursAll"],
    queryFn: () => getAllToursAdmin({ limit: 100 }),
  });

  const allTours = toursData?.data || [];

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        validFrom: initialData.validFrom ? new Date(initialData.validFrom).toISOString().slice(0, 16) : prev.validFrom,
        validUntil: initialData.validUntil ? new Date(initialData.validUntil).toISOString().slice(0, 16) : prev.validUntil,
        applicableTours: initialData.applicableTours || [],
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    
    let parsedValue: any = value;
    if (type === "number") {
      parsedValue = value === "" ? undefined : Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleTourToggle = (tour: { _id: string; title: string }) => {
    setFormData(prev => {
      const current = prev.applicableTours || [];
      const exists = current.find(t => t._id === tour._id);
      if (exists) {
        return { ...prev, applicableTours: current.filter(t => t._id !== tour._id) };
      } else {
        return { ...prev, applicableTours: [...current, { _id: tour._id, title: tour.title }] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Chuyển mảng object applicableTours thành mảng ID để gửi lên BE nếu cần, 
    // hoặc BE có thể nhận object và lấy _id. voucher.controller.js lấy .toString() nên nhận cả 2 đều ok.
    onSubmit(formData);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 transition flex items-center"
        >
          <i className="ri-arrow-left-line mr-2"></i> Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Thông tin cơ bản */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mã Voucher (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 uppercase"
                  placeholder="VD: SUMMER2026"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Sử dụng chữ cái in hoa và số, không khoảng trắng.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên chiến dịch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="VD: Khuyến mãi chào hè"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL Hình ảnh (Cover Image)
                </label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image && (
                  <div className="mt-2 w-32 h-20 rounded-lg overflow-hidden border border-slate-200">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mô tả thêm
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Chi tiết về chương trình khuyến mãi..."
                />
              </div>
            </div>
          </section>

          {/* Thiết lập giảm giá */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Thiết lập mức giảm</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Loại giảm giá <span className="text-red-500">*</span>
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="percent">Giảm theo phần trăm (%)</option>
                  <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Giá trị giảm ({formData.discountType === "percent" ? "%" : "VNĐ"}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="discountValue"
                  min="0"
                  value={formData.discountValue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              {formData.discountType === "percent" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="maxDiscount"
                    min="0"
                    value={formData.maxDiscount || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Để trống nếu không giới hạn"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Giá trị đơn hàng tối thiểu (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="minOrderValue"
                  min="0"
                  value={formData.minOrderValue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
          </section>

          {/* Điều kiện sử dụng */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Điều kiện áp dụng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bắt đầu từ <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="validFrom"
                  value={formData.validFrom as string}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kết thúc vào <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="validUntil"
                  value={formData.validUntil as string}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tổng lượt sử dụng tối đa
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  min="1"
                  value={formData.usageLimit || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Để trống nếu không giới hạn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Giới hạn lượt dùng mỗi tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="userUsageLimit"
                  min="1"
                  value={formData.userUsageLimit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="active">Đang kích hoạt</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>
            </div>

            {/* Applicable Tours Selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Áp dụng cho các Tours cụ thể (Để trống nếu áp dụng cho tất cả)
              </label>
              <div className="border border-slate-200 rounded-lg p-4 max-h-60 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                {allTours.map((tour: any) => {
                  const isSelected = formData.applicableTours?.some(t => t._id === tour._id);
                  return (
                    <div 
                      key={tour._id}
                      onClick={() => handleTourToggle(tour)}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition ${
                        isSelected ? "bg-orange-50 border border-orange-200" : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? "bg-orange-600 border-orange-600" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <i className="ri-check-line text-white text-[10px]"></i>}
                      </div>
                      <span className="text-sm text-slate-700 line-clamp-1">{tour.title}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.applicableTours?.map(t => (
                  <span key={t._id} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                    {t.title}
                    <i 
                      className="ri-close-line cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTourToggle(t);
                      }}
                    ></i>
                  </span>
                ))}
              </div>
            </div>
          </section>

        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50 flex items-center"
          >
            {isPending && <i className="ri-loader-4-line animate-spin mr-2"></i>}
            Lưu Voucher
          </button>
        </div>
      </form>
    </div>
  );
}

