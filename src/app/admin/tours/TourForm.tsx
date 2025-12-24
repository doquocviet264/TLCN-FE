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

// Types for itinerary
type ItinerarySegment = {
  timeOfDay: "morning" | "afternoon" | "evening";
  title: string;
  items: string[];
};

type ItineraryDay = {
  day: number;
  title: string;
  summary: string;
  segments: ItinerarySegment[];
  photos: string[];
};

// 👇 1. Tạo kiểu dữ liệu mới mở rộng từ TourInput để thêm leaderId
type TourFormInput = TourInput & {
  leaderId?: string;
  itinerary?: ItineraryDay[];
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
    itinerary: [],
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
        itinerary: existingTour.itinerary || [],
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

  // ========== ITINERARY HANDLERS ==========
  const addDay = () => {
    const itinerary = formData.itinerary || [];
    const newDay: ItineraryDay = {
      day: itinerary.length + 1,
      title: `Ngày ${itinerary.length + 1}`,
      summary: "",
      segments: [],
      photos: [],
    };
    setFormData((prev) => ({
      ...prev,
      itinerary: [...(prev.itinerary || []), newDay],
    }));
  };

  const removeDay = (dayIndex: number) => {
    const itinerary = [...(formData.itinerary || [])];
    itinerary.splice(dayIndex, 1);
    // Re-number days
    itinerary.forEach((d, i) => {
      d.day = i + 1;
    });
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const updateDay = (
    dayIndex: number,
    field: keyof ItineraryDay,
    value: any
  ) => {
    const itinerary = [...(formData.itinerary || [])];
    itinerary[dayIndex] = { ...itinerary[dayIndex], [field]: value };
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const addSegment = (dayIndex: number) => {
    const itinerary = [...(formData.itinerary || [])];
    const newSegment: ItinerarySegment = {
      timeOfDay: "morning",
      title: "",
      items: [],
    };
    itinerary[dayIndex].segments.push(newSegment);
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const removeSegment = (dayIndex: number, segmentIndex: number) => {
    const itinerary = [...(formData.itinerary || [])];
    itinerary[dayIndex].segments.splice(segmentIndex, 1);
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const updateSegment = (
    dayIndex: number,
    segmentIndex: number,
    field: keyof ItinerarySegment,
    value: any
  ) => {
    const itinerary = [...(formData.itinerary || [])];
    itinerary[dayIndex].segments[segmentIndex] = {
      ...itinerary[dayIndex].segments[segmentIndex],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const addSegmentItem = (dayIndex: number, segmentIndex: number) => {
    const itinerary = [...(formData.itinerary || [])];
    itinerary[dayIndex].segments[segmentIndex].items.push("");
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const removeSegmentItem = (
    dayIndex: number,
    segmentIndex: number,
    itemIndex: number
  ) => {
    const itinerary = [...(formData.itinerary || [])];
    itinerary[dayIndex].segments[segmentIndex].items.splice(itemIndex, 1);
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const updateSegmentItem = (
    dayIndex: number,
    segmentIndex: number,
    itemIndex: number,
    value: string
  ) => {
    const itinerary = [...(formData.itinerary || [])];
    itinerary[dayIndex].segments[segmentIndex].items[itemIndex] = value;
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const timeOfDayLabels: Record<string, string> = {
    morning: "Buổi sáng",
    afternoon: "Buổi chiều",
    evening: "Buổi tối",
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="pending">Chờ duyệt</option>
                <option value="confirmed">Đã duyệt</option>
                <option value="in_progress">Đang diễn ra</option>
                <option value="completed">Hoàn thành</option>
                <option value="closed">Đóng</option>
              </select>
            </div>
          </div>

          {/* ============ ITINERARY SECTION ============ */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block font-semibold text-slate-900 text-lg">
                  Lịch trình chi tiết
                </label>
                <p className="text-sm text-slate-500">
                  Thêm lịch trình cho từng ngày của tour
                </p>
              </div>
              <button
                type="button"
                onClick={addDay}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Thêm ngày
              </button>
            </div>

            {(formData.itinerary || []).length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <svg
                  className="w-12 h-12 mx-auto text-slate-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-slate-500">
                  Chưa có lịch trình. Nhấn "Thêm ngày" để bắt đầu.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(formData.itinerary || []).map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden"
                  >
                    {/* Day Header */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm">
                            {day.day}
                          </span>
                          <input
                            type="text"
                            value={day.title}
                            onChange={(e) =>
                              updateDay(dayIdx, "title", e.target.value)
                            }
                            className="font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 text-lg"
                            placeholder={`Ngày ${day.day}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDay(dayIdx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Xóa ngày này"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Day Content */}
                    <div className="p-4 space-y-4">
                      {/* Summary */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Tóm tắt ngày
                        </label>
                        <textarea
                          value={day.summary || ""}
                          onChange={(e) =>
                            updateDay(dayIdx, "summary", e.target.value)
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          placeholder="Mô tả ngắn gọn về ngày này..."
                        />
                      </div>

                      {/* Segments */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Các hoạt động trong ngày
                          </label>
                          <button
                            type="button"
                            onClick={() => addSegment(dayIdx)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                          >
                            + Thêm buổi
                          </button>
                        </div>

                        {day.segments.length === 0 ? (
                          <p className="text-sm text-slate-400 italic">
                            Chưa có hoạt động. Nhấn "Thêm buổi" để thêm.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {day.segments.map((segment, segIdx) => (
                              <div
                                key={segIdx}
                                className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                              >
                                <div className="flex items-start gap-3 mb-2">
                                  <select
                                    value={segment.timeOfDay}
                                    onChange={(e) =>
                                      updateSegment(
                                        dayIdx,
                                        segIdx,
                                        "timeOfDay",
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                                  >
                                    <option value="morning">Buổi sáng</option>
                                    <option value="afternoon">Buổi chiều</option>
                                    <option value="evening">Buổi tối</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={segment.title}
                                    onChange={(e) =>
                                      updateSegment(
                                        dayIdx,
                                        segIdx,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    placeholder="Tiêu đề hoạt động (VD: Tham quan Vịnh Hạ Long)"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeSegment(dayIdx, segIdx)}
                                    className="p-1.5 text-red-500 hover:bg-red-100 rounded transition"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>

                                {/* Segment Items */}
                                <div className="ml-4 space-y-2">
                                  {segment.items.map((item, itemIdx) => (
                                    <div
                                      key={itemIdx}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) =>
                                          updateSegmentItem(
                                            dayIdx,
                                            segIdx,
                                            itemIdx,
                                            e.target.value
                                          )
                                        }
                                        className="flex-1 px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                                        placeholder="Chi tiết hoạt động..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeSegmentItem(dayIdx, segIdx, itemIdx)
                                        }
                                        className="p-1 text-slate-400 hover:text-red-500 transition"
                                      >
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => addSegmentItem(dayIdx, segIdx)}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                    Thêm chi tiết
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 font-semibold"
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
