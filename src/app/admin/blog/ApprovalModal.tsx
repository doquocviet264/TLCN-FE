"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  blogTitle: string;
  isSubmitting: boolean;
};

export function ApprovalModal({
  isOpen,
  onClose,
  onApprove,
  onReject,
  blogTitle,
  isSubmitting,
}: Props) {
  const [mode, setMode] = useState<"actions" | "reject">("actions");
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition text-xl font-light leading-none"
          onClick={onClose}
          disabled={isSubmitting}
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-slate-900 mb-1">Duyệt bài viết</h3>
        <p className="text-sm text-slate-500 mb-6">
          <span className="font-semibold block truncate text-slate-700">
            {blogTitle}
          </span>
        </p>

        {mode === "actions" ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("reject")}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-200 transition"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-lg font-bold">
                ✗
              </div>
              <span className="font-bold">Từ chối</span>
            </button>
            <button
              onClick={onApprove}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-200 transition"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-lg font-bold">
                ✓
              </div>
              <span className="font-bold">Xuất bản</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lý do từ chối:
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-24 text-sm"
                placeholder="Bài viết vi phạm nội quy, chất lượng ảnh kém..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                onClick={() => setMode("actions")}
                disabled={isSubmitting}
              >
                Quay lại
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                onClick={() => onReject(reason)}
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? "Đang xử lý..." : "Xác nhận Từ chối"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
