"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCreateTour, useUpdateTour, useTourDetail } from "../hooks/useAdmin";
import { getAdminLeaders } from "@/lib/admin/adminLeaderApi";
import { Toast, useToast } from "@/components/ui/Toast";
import type { TourInput } from "@/lib/admin/adminApi";

type TourFormProps = {
  tourId?: string;
  mode: "create" | "edit";
};

// 👇 1. Tạo kiểu dữ liệu mới mở rộng từ TourInput để thêm leaderId
type TourFormInput = TourInput & {
  leaderId?: string;
};

export default function TourForm({ tourId, mode }: TourFormProps) {
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const createTour = useCreateTour();
  const updateTour = useUpdateTour(tourId || "");
  const { data: existingTour } = useTourDetail(tourId || "");

  // Fetch list of active leaders
  const { data: leadersResponse, isLoading: isLoadingLeaders } = useQuery({
    queryKey: ["adminLeaders", "active"],
    queryFn: async () => {
      const res = await getAdminLeaders({ limit: 100, status: "active" });
      return res.data || [];
    },
  });
  const leaders = leadersResponse || [];

  // 👇 2. Sử dụng TourFormInput cho state
  const [formData, setFormData] = useState<Partial<TourFormInput>>({
    title: "",
    time: "",
    description: "",
    quantity: 30,
    priceAdult: 0,
    priceChild: 0,
    destination: "",
    startDate: "",
    endDate: "",
    min_guests: 10,
    current_guests: 0,
    status: "pending",
    images: [],
    leaderId: "",
  });

  // Load existing data when editing
  useEffect(() => {
    if (mode === "edit" && existingTour) {
      setFormData({
        title: existingTour.title || "",
        time: existingTour.time || "",
        description: existingTour.description || "",
        quantity: existingTour.quantity || 30,
        priceAdult: existingTour.priceAdult || 0,
        priceChild: existingTour.priceChild || 0,
        destination: existingTour.destination || "",
        startDate: existingTour.startDate
          ? new Date(existingTour.startDate).toISOString().slice(0, 10)
          : "",
        endDate: existingTour.endDate
          ? new Date(existingTour.endDate).toISOString().slice(0, 10)
          : "",
        min_guests: existingTour.min_guests || 10,
        current_guests: existingTour.current_guests || 0,
        status: existingTour.status as any,
        images: existingTour.images || [],
        // @ts-expect-error - Bỏ qua lỗi check type ở đây nếu API trả về leader object
        leaderId: existingTour.leader?._id || "",
      });
    }
  }, [mode, existingTour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.destination) {
      showError("Vui lòng nhập tiêu đề và điểm đến!");
      return;
    }

    try {
      const submitData = { ...formData };

      if (submitData.leaderId === "") {
        delete submitData.leaderId;
      }

      if (mode === "create") {
        // 👇 3. Ép kiểu về any hoặc TourInput để tránh lỗi TS khi gọi hàm mutate
        await createTour.mutateAsync(submitData as any);
        showSuccess("Tạo tour thành công!");
        setTimeout(() => router.push("/admin/tours"), 1500);
      } else {
        await updateTour.mutateAsync(submitData as any);
        showSuccess("Cập nhật tour thành công!");
        setTimeout(() => router.push("/admin/tours"), 1500);
      }
    } catch (error: any) {
      showError(
        error.response?.data?.message ||
          error.message ||
          "Không thể xử lý yêu cầu"
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...(formData.images || [])];
    newImages[index] = value;
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const addImage = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ""],
    }));
  };

  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const isLoading = createTour.isPending || updateTour.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {mode === "create" ? "Tạo Tour Mới" : "Chỉnh Sửa Tour"}
          </h1>
          <p className="text-slate-600">
            {mode === "create"
              ? "Thêm một tour du lịch mới"
              : "Cập nhật thông tin tour"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6"
        >
          {/* Title */}
          <div>
            <label className="mb-2 block font-semibold text-slate-900">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Du lịch Hạ Long 3N2Đ"
              required
            />
          </div>

          {/* Time & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Thời gian
              </label>
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="3 ngày 2 đêm"
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Điểm đến <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Quảng Ninh"
                required
              />
            </div>
          </div>

          {/* --- Leader Selection Section --- */}
          <div>
            <label className="mb-2 block font-semibold text-slate-900">
              Hướng dẫn viên (Leader)
            </label>
            <div className="relative">
              <select
                name="leaderId"
                value={formData.leaderId || ""}
                onChange={handleChange}
                disabled={isLoadingLeaders}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">-- Chưa gán leader --</option>
                {leaders.map((leader: any) => (
                  <option key={leader._id} value={leader._id}>
                    {leader.fullName} ({leader.username})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {isLoadingLeaders && (
              <p className="text-sm text-gray-500 mt-1">
                Đang tải danh sách leader...
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block font-semibold text-slate-900">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Mô tả chi tiết về tour..."
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Giá người lớn (đ)
              </label>
              <input
                type="number"
                name="priceAdult"
                value={formData.priceAdult}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Giá trẻ em (đ)
              </label>
              <input
                type="number"
                name="priceChild"
                value={formData.priceChild}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Ngày khởi hành
              </label>
              <input
                type="date"
                name="startDate"
                value={typeof formData.startDate === 'string' ? formData.startDate : ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Ngày kết thúc
              </label>
              <input
                type="date"
                name="endDate"
                value={typeof formData.endDate === 'string' ? formData.endDate : ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Guests & Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Số lượng
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Tối thiểu
              </label>
              <input
                type="number"
                name="min_guests"
                value={formData.min_guests}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Hiện tại
              </label>
              <input
                type="number"
                name="current_guests"
                value={formData.current_guests}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="pending">Chờ duyệt</option>
                <option value="confirmed">Đã duyệt</option>
                <option value="in_progress">Đang diễn ra</option>
                <option value="completed">Hoàn thành</option>
                <option value="closed">Đóng</option>
              </select>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="mb-2 block font-semibold text-slate-900">
              Hình ảnh (URLs)
            </label>
            <div className="space-y-2">
              {(formData.images || []).map((img, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={img}
                    onChange={(e) => handleImageChange(idx, e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                + Thêm ảnh
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-semibold"
            >
              {isLoading
                ? "Đang xử lý..."
                : mode === "create"
                ? "Tạo Tour"
                : "Cập Nhật"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-semibold"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  );
}
