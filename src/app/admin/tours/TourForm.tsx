"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCreateTour, useUpdateTour, useTourDetail } from "../hooks/useAdmin";
import { getAdminLeaders } from "@/lib/admin/adminLeaderApi";
import { Toast, useToast } from "@/components/ui/Toast";
import { type TourInput } from "@/lib/admin/adminApi";

type TourFormProps = {
  tourId?: string;
  mode: "create" | "edit";
};

// Types for itinerary
type ItinerarySegment = {
  timeOfDay: "morning" | "afternoon" | "evening";
  title: string;
  items: Array<string | { text: string; imageUrl?: string }>;
};

type ItineraryDay = {
  day: number;
  title: string;
  summary: string;
  segments: ItinerarySegment[];
  photos: string[];
};

// TourFormInput: bao gồm cả các field legacy (time, startDate...) để form vẫn hoạt động
// Lưu ý: sau khi submit, các field này sẽ được bỏ qua bởới backend (trường hợp Tour Template)
type TourFormInput = {
  title?: string;
  time?: string;                 // legacy
  description?: string;
  quantity?: number;             // legacy
  priceAdult?: number;
  priceChild?: number;
  destination?: string;
  startDate?: string | Date;     // legacy (giờ nằm ở Departure)
  endDate?: string | Date;       // legacy
  min_guests?: number;           // legacy
  current_guests?: number;       // legacy
  status?: string;               // legacy
  images?: string[];
  includes?: string[];
  excludes?: string[];
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

  // Track files to be uploaded on submit
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    if (mode === "edit" && existingTour) {
      const t = existingTour as any; // cast to any for legacy fields
      setFormData({
        title:           t.title || "",
        time:            t.time  || "",
        description:     t.description || "",
        quantity:        t.quantity || 30,
        priceAdult:      t.priceAdult  || 0,
        priceChild:      t.priceChild  || 0,
        destination:     t.destination || "",
        startDate:       t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : "",
        endDate:         t.endDate   ? new Date(t.endDate).toISOString().slice(0, 10)   : "",
        min_guests:      t.min_guests     || 10,
        current_guests:  t.current_guests || 0,
        status:          t.status         || "pending",
        images:          t.images  || [],
        includes:        t.includes || [],
        excludes:        t.excludes || [],
        itinerary:       t.itinerary || [],
      });
    }
  }, [mode, existingTour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.destination || !formData.time) {
      showError("Vui lòng nhập tiêu đề, điểm đến và thời gian hành trình!");
      return;
    }
    if ((formData.priceAdult ?? 0) <= 0) {
      showError("Vui lòng nhập giá người lớn hợp lệ!");
      return;
    }
    if ((formData.priceChild ?? 0) < 0) {
      showError("Giá trẻ em không được âm!");
      return;
    }

    try {
      const isCreate = mode === "create";
      
      // Build FormData for integrated upload
      const form = new FormData();
      form.append("data", JSON.stringify(formData));
      
      // Append files
      Object.entries(pendingFiles).forEach(([key, file]) => {
        form.append(key, file);
      });

      if (isCreate) {
        await createTour.mutateAsync(form as any);
        showSuccess("Tạo tour thành công!");
        setTimeout(() => router.push("/admin/tours"), 1500);
      } else {
        await updateTour.mutateAsync(form as any);
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
    // Clear pending file if URL is manually changed
    const key = `main_image_${index}`;
    if (pendingFiles[key]) {
      const newFiles = { ...pendingFiles };
      delete newFiles[key];
      setPendingFiles(newFiles);
    }
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const handleSelectMainImage = (index: number, file: File) => {
    const key = `main_image_${index}`;
    setPendingFiles(prev => ({ ...prev, [key]: file }));
    
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    const newImages = [...(formData.images || [])];
    newImages[index] = previewUrl;
    setFormData(prev => ({ ...prev, images: newImages }));
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
    
    // Also remove from pending files and shift others
    const newFiles: Record<string, File> = {};
    Object.entries(pendingFiles).forEach(([key, file]) => {
      if (key.startsWith("main_image_")) {
        const kIdx = parseInt(key.split("_")[2]);
        if (kIdx < index) newFiles[key] = file;
        if (kIdx > index) newFiles[`main_image_${kIdx - 1}`] = file;
      } else {
        newFiles[key] = file;
      }
    });
    setPendingFiles(newFiles);
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
    const itinerary = JSON.parse(JSON.stringify(formData.itinerary || []));
    itinerary[dayIndex].segments[segmentIndex].items.push({ text: "", imageUrl: "" });
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const removeSegmentItem = (
    dayIndex: number,
    segmentIndex: number,
    itemIndex: number
  ) => {
    const itinerary = JSON.parse(JSON.stringify(formData.itinerary || []));
    itinerary[dayIndex].segments[segmentIndex].items.splice(itemIndex, 1);
    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const updateSegmentItem = (
    dayIndex: number,
    segmentIndex: number,
    itemIndex: number,
    field: "text" | "imageUrl",
    value: string
  ) => {
    const itinerary = JSON.parse(JSON.stringify(formData.itinerary || []));
    const currentItem = itinerary[dayIndex].segments[segmentIndex].items[itemIndex];

    if (typeof currentItem === "string") {
      itinerary[dayIndex].segments[segmentIndex].items[itemIndex] = {
        text: field === "text" ? value : currentItem,
        imageUrl: field === "imageUrl" ? value : "",
      };
    } else {
      itinerary[dayIndex].segments[segmentIndex].items[itemIndex][field] = value;
    }

    setFormData((prev) => ({ ...prev, itinerary }));
  };

  const handleSelectSegmentItemImage = (
    dayIndex: number,
    segmentIndex: number,
    itemIndex: number,
    file: File
  ) => {
    const key = `item_image_${dayIndex}_${segmentIndex}_${itemIndex}`;
    setPendingFiles(prev => ({ ...prev, [key]: file }));
    
    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    updateSegmentItem(dayIndex, segmentIndex, itemIndex, "imageUrl", previewUrl);
  };

  const timeOfDayLabels: Record<string, string> = {
    morning: "Buổi sáng",
    afternoon: "Buổi chiều",
    evening: "Buổi tối",
  };

  // ========== INCLUDES/EXCLUDES HANDLERS ==========
  const addArrayItem = (field: "includes" | "excludes") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ""],
    }));
  };

  const removeArrayItem = (field: "includes" | "excludes", index: number) => {
    const newArr = [...(formData[field] || [])];
    newArr.splice(index, 1);
    setFormData((prev) => ({ ...prev, [field]: newArr }));
  };

  const updateArrayItem = (field: "includes" | "excludes", index: number, value: string) => {
    const newArr = [...(formData[field] || [])];
    newArr[index] = value;
    setFormData((prev) => ({ ...prev, [field]: newArr }));
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
                Thời gian hành trình
              </label>
              <select
                name="time"
                value={formData.time || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="">-- Chọn --</option>
                <option value="1 ngày">1 ngày</option>
                <option value="2 ngày 1 đêm">2 ngày 1 đêm</option>
                <option value="3 ngày 2 đêm">3 ngày 2 đêm</option>
                <option value="4 ngày 3 đêm">4 ngày 3 đêm</option>
                <option value="5 ngày 4 đêm">5 ngày 4 đêm</option>
              </select>
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

          {/* Pricing & Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Số lượng khách (Max)
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Includes / Excludes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Bao gồm (Includes)
              </label>
              <div className="space-y-2">
                {(formData.includes || []).map((inc, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      value={inc}
                      onChange={(e) => updateArrayItem('includes', i, e.target.value)}
                    />
                    <button type="button" onClick={() => removeArrayItem('includes', i)} className="text-red-500 font-bold hover:text-red-600">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('includes')} className="text-sm text-sky-600 font-medium hover:underline">+ Thêm dòng</button>
              </div>
            </div>
            <div>
              <label className="mb-2 block font-semibold text-slate-900">
                Không bao gồm (Excludes)
              </label>
              <div className="space-y-2">
                {(formData.excludes || []).map((exc, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      value={exc}
                      onChange={(e) => updateArrayItem('excludes', i, e.target.value)}
                    />
                    <button type="button" onClick={() => removeArrayItem('excludes', i)} className="text-red-500 font-bold hover:text-red-600">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('excludes')} className="text-sm text-sky-600 font-medium hover:underline">+ Thêm dòng</button>
              </div>
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

                        {(day.segments || []).length === 0 ? (
                          <p className="text-sm text-slate-400 italic">
                            Chưa có hoạt động. Nhấn "Thêm buổi" để thêm.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {(day.segments || []).map((segment, segIdx) => (
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
                                <div className="ml-4 space-y-3">
                                  {segment.items.map((item, itemIdx) => {
                                    const text = typeof item === 'string' ? item : (item.text || "");
                                    const imageUrl = typeof item === 'string' ? "" : (item.imageUrl || "");
                                    return (
                                      <div key={itemIdx} className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                          <input
                                            type="text"
                                            value={text}
                                            onChange={(e) => updateSegmentItem(dayIdx, segIdx, itemIdx, 'text', e.target.value)}
                                            className="flex-1 px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                                            placeholder="Chi tiết hoạt động..."
                                          />
                                          <label className="cursor-pointer p-1 text-slate-500 hover:text-sky-600 transition" title="Tải ảnh lên">
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              className="hidden" 
                                              onChange={(e) => {
                                                if(e.target.files && e.target.files[0]) {
                                                  handleSelectSegmentItemImage(dayIdx, segIdx, itemIdx, e.target.files[0]);
                                                }
                                              }} 
                                            />
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                          </label>
                                          <button
                                            type="button"
                                            onClick={() => removeSegmentItem(dayIdx, segIdx, itemIdx)}
                                          className="p-1 text-slate-400 hover:text-red-500 transition"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                        {imageUrl && (
                                          <div className="ml-4 relative w-32 h-20 rounded overflow-hidden border border-slate-200">
                                            <img src={imageUrl} alt="item image" className="object-cover w-full h-full" />
                                            <button 
                                              type="button" 
                                              onClick={() => updateSegmentItem(dayIdx, segIdx, itemIdx, 'imageUrl', "")}
                                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                            >
                                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <button
                                    type="button"
                                    onClick={() => addSegmentItem(dayIdx, segIdx)}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-2"
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
              Hình ảnh (URLs hoặc Tải lên)
            </label>
            <div className="space-y-4">
              {(formData.images || []).map((img, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={img}
                      onChange={(e) => handleImageChange(idx, e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                    <label className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm flex items-center gap-2 border border-slate-300">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if(e.target.files && e.target.files[0]) {
                            handleSelectMainImage(idx, e.target.files[0]);
                          }
                        }} 
                      />
                      📷 Tải ảnh
                    </label>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-200"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {img && (
                    <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                      <img src={img} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImage}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-orange-400 hover:text-orange-500 transition flex items-center justify-center gap-2 font-medium"
              >
                + Thêm hình ảnh mới
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
