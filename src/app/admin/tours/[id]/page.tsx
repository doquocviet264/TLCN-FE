"use client";

import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminLeaders } from "@/lib/admin/adminLeaderApi";
import {
  useOngoingTours,
  useSetLeader,
  useAddTimeline,
  useExpenses,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/app/admin/hooks/useAdmin";

// --- Sub-component: Phần Gán Leader ---
function LeaderAssignmentSection({
  currentLeaderId,
  onLeaderId,
  onSave,
  isSaving,
}: {
  currentLeaderId: string;
  onLeaderId: (id: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  // Fetch danh sách Leaders từ API
  const { data: leadersResponse, isLoading } = useQuery({
    queryKey: ["adminLeaders", "all"], // Key cache
    queryFn: async () => {
      // Lấy tất cả leader active để gán (limit lớn để lấy hết)
      const res = await getAdminLeaders({ limit: 100, status: "active" });
      return res.data || [];
    },
  });

  const leaders = leadersResponse || [];

  // Tìm tên leader hiện tại để hiển thị label
  const currentLeaderName = useMemo(() => {
    const leader = leaders.find((l: any) => String(l._id) === currentLeaderId);
    return leader?.fullName || null;
  }, [leaders, currentLeaderId]);

  if (isLoading) {
    return (
      <section className="rounded-2xl border bg-white p-5 shadow animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mb-4"></div>
        <div className="h-10 w-full bg-slate-100 rounded"></div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          👮 Phân công Leader
        </h2>
        {currentLeaderId ? (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            Đã có leader
          </span>
        ) : (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            Chưa gán
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Chọn hướng dẫn viên:
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all bg-slate-50"
            value={currentLeaderId}
            onChange={(e) => onLeaderId(e.target.value)}
            disabled={isSaving}
          >
            <option value="">-- Chọn Leader --</option>
            {leaders.map((leader: any) => (
              <option key={leader._id} value={leader._id}>
                {leader.fullName} ({leader.username}) - {leader.phoneNumber}
              </option>
            ))}
          </select>
        </div>

        <button
          className={`shrink-0 rounded-lg px-6 py-2.5 font-medium text-white transition-all ${
            isSaving
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-700 shadow-md hover:shadow-lg"
          }`}
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      {/* Hiển thị thông tin leader hiện tại nếu có */}
      {currentLeaderName && (
        <div className="mt-4 p-3 bg-sky-50 border border-sky-100 rounded-lg flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center text-sky-700 font-bold text-xs">
            {currentLeaderName.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-sky-900">
              Leader hiện tại: {currentLeaderName}
            </div>
            <div className="text-xs text-sky-700">ID: {currentLeaderId}</div>
          </div>
        </div>
      )}
    </section>
  );
}

// --- Main Page Component ---
export default function AdminTourDetail() {
  const { id } = useParams<{ id: string }>();
  const tourId = String(id);

  // 1. Lấy thông tin Tour
  const { data: ongoing, isLoading } = useOngoingTours();
  const tour = useMemo(
    () => ongoing?.find((t: any) => String(t._id) === tourId),
    [ongoing, tourId]
  );

  // 2. Hooks xử lý logic
  const setLeader = useSetLeader(tourId);
  const addTimeline = useAddTimeline(tourId);

  const { data: expenses } = useExpenses(tourId);
  const addExp = useAddExpense(tourId);
  const updExp = useUpdateExpense(tourId);
  const delExp = useDeleteExpense(tourId);

  // 3. State quản lý form
  const [leaderId, setLeaderId] = useState<string>("");
  const [tlType, setTlType] = useState<
    "departed" | "arrived" | "checkpoint" | "note" | "finished"
  >("checkpoint");
  const [tlNote, setTlNote] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expOccurredAt, setExpOccurredAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  // 4. Đồng bộ state leaderId khi load được tour
  useEffect(() => {
    if (tour?.leader?._id) {
      setLeaderId(tour.leader._id);
    } else {
      setLeaderId(""); // Reset nếu tour chưa có leader
    }
  }, [tour?.leader?._id]);

  if (isLoading)
    return (
      <div className="p-8 text-center text-slate-500">
        ⏳ Đang tải dữ liệu tour...
      </div>
    );
  if (!tour)
    return (
      <div className="p-8 text-center text-red-500">
        ❌ Không tìm thấy tour này.
      </div>
    );

  return (
    <div className="mx-auto w-[95%] max-w-6xl py-8 space-y-8 pb-20">
      {/* Header */}
      <header className="border-b pb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <span>Quản lý Tour</span> / <span>{tourId}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">{tour.title}</h1>
        <div className="flex gap-4 mt-2 text-sm text-slate-600">
          <p>
            📅 Khởi hành:{" "}
            <span className="font-medium text-slate-900">
              {tour.startDate
                ? new Date(tour.startDate).toLocaleString("vi-VN")
                : "—"}
            </span>
          </p>
          <p>
            🏁 Kết thúc:{" "}
            <span className="font-medium text-slate-900">
              {tour.endDate
                ? new Date(tour.endDate).toLocaleString("vi-VN")
                : "—"}
            </span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Leader & Timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* ⭐ PHẦN QUAN TRỌNG: GÁN LEADER ⭐ */}
          <LeaderAssignmentSection
            currentLeaderId={leaderId}
            onLeaderId={setLeaderId}
            onSave={() => setLeader.mutate(leaderId || null)}
            isSaving={setLeader.isPending}
          />

          {/* Timeline Section */}
          <section className="rounded-2xl border bg-white p-5 shadow">
            <h2 className="mb-4 text-lg font-bold text-slate-800 border-b pb-2">
              📍 Cập nhật Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <select
                  className="w-1/3 rounded-lg border px-3 py-2 bg-slate-50"
                  value={tlType}
                  onChange={(e) => setTlType(e.target.value as any)}
                >
                  <option value="departed">🚀 Xuất phát</option>
                  <option value="arrived">🏁 Đã đến nơi</option>
                  <option value="checkpoint">🚩 Checkpoint</option>
                  <option value="note">📝 Ghi chú</option>
                  <option value="finished">✅ Kết thúc tour</option>
                </select>
                <input
                  className="flex-1 rounded-lg border px-3 py-2"
                  placeholder="Ghi chú sự kiện (VD: Đã đến trạm dừng chân...)"
                  value={tlNote}
                  onChange={(e) => setTlNote(e.target.value)}
                />
              </div>
              <button
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-white font-medium transition-colors"
                onClick={() => {
                  addTimeline.mutate({
                    type: tlType,
                    note: tlNote || undefined,
                  });
                  setTlNote(""); // Clear input sau khi add
                }}
                disabled={addTimeline.isPending}
              >
                {addTimeline.isPending
                  ? "Đang ghi..."
                  : "Ghi sự kiện vào hệ thống"}
              </button>
            </div>
          </section>
        </div>

        {/* Cột phải: Chi phí (Expenses) */}
        <div className="lg:col-span-1">
          <section className="rounded-2xl border bg-white p-5 shadow h-full flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              💰 Quản lý Chi phí
              <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Tổng:{" "}
                {expenses
                  ?.reduce((sum, e) => sum + e.amount, 0)
                  .toLocaleString()}{" "}
                đ
              </span>
            </h2>

            {/* Form thêm chi phí */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 space-y-2">
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Tên khoản chi (VD: Vé cổng...)"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="w-1/2 rounded border px-3 py-2 text-sm"
                  type="number"
                  placeholder="Số tiền"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                />
                <input
                  className="w-1/2 rounded border px-3 py-2 text-sm"
                  type="datetime-local"
                  value={expOccurredAt}
                  onChange={(e) => setExpOccurredAt(e.target.value)}
                />
              </div>
              <button
                className="w-full rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-white text-sm font-medium transition-colors"
                onClick={() =>
                  addExp.mutate({
                    title: expTitle,
                    amount: Number(expAmount || 0),
                    occurredAt: new Date(expOccurredAt).toISOString(),
                  } as any)
                }
                disabled={addExp.isPending}
              >
                + Thêm khoản chi
              </button>
            </div>

            {/* List chi phí */}
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-1">
              <div className="space-y-2">
                {expenses?.map((e) => (
                  <div
                    key={e._id}
                    className="p-3 border rounded-lg hover:shadow-sm transition-shadow bg-white relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-slate-800">
                        {e.title}
                      </div>
                      <div className="font-bold text-emerald-600">
                        {e.amount.toLocaleString()} đ
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(e.occurredAt).toLocaleString("vi-VN")}
                    </div>

                    {/* Actions (chỉ hiện khi hover) */}
                    <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 bg-white/90 backdrop-blur">
                      <button
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Sửa"
                        onClick={() => {
                          const newTitle =
                            prompt("Sửa tên", e.title) ?? e.title;
                          const newAmount = Number(
                            prompt("Sửa số tiền", String(e.amount)) ?? e.amount
                          );
                          updExp.mutate({
                            id: e._id,
                            patch: { title: newTitle, amount: newAmount },
                          });
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                        onClick={() => {
                          if (confirm("Xóa khoản chi này?"))
                            delExp.mutate(e._id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {!expenses?.length && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Chưa có dữ liệu chi phí.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
