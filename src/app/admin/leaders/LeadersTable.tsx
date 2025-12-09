"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LeaderData,
  updateAdminLeader,
  deleteAdminLeader,
} from "@/lib/admin/adminLeaderApi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import LeaderForm from "./LeaderForm";

interface LeadersTableProps {
  leaders: LeaderData[];
}

export default function LeadersTable({ leaders }: LeadersTableProps) {
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  const [editingLeader, setEditingLeader] = useState<LeaderData | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    type?: "danger" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
    type: "warning",
  });

  // Update leader mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateAdminLeader(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLeaders"] });
      setEditingLeader(null);
      setIsFormOpen(false);
      showSuccess("Cập nhật lãnh đạo thành công!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Không thể cập nhật lãnh đạo";
      showError(message);
    },
  });

  // Delete leader mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminLeader(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLeaders"] });
      showSuccess("Xóa lãnh đạo thành công!");
      setConfirmDialog((d) => ({ ...d, isOpen: false }));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Không thể xóa lãnh đạo";
      showError(message);
      setConfirmDialog((d) => ({ ...d, isOpen: false }));
    },
  });

  const handleSelectLeader = (id: string) => {
    setSelectedLeaders((prev) =>
      prev.includes(id)
        ? prev.filter((leaderId) => leaderId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeaders.length === leaders.length) {
      setSelectedLeaders([]);
    } else {
      setSelectedLeaders(leaders.map((l) => l._id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getStatusBadgeColor = (status: string) => {
    return status === "active"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-red-100 text-red-800";
  };

  const getStatusText = (status: string) => {
    return status === "active" ? "Hoạt động" : "Vô hiệu";
  };

  return (
    <>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    leaders.length > 0 &&
                    selectedLeaders.length === leaders.length
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Họ tên
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Tài khoản
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Email
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Điện thoại
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Địa chỉ
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((leader, index) => (
              <tr
                key={leader._id}
                className={`border-b border-slate-200 hover:bg-slate-50 transition ${
                  index % 2 === 0 ? "bg-white" : "bg-slate-50"
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedLeaders.includes(leader._id)}
                    onChange={() => handleSelectLeader(leader._id)}
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {leader.fullName}
                </td>
                <td className="px-4 py-3 text-slate-700">{leader.username}</td>
                <td className="px-4 py-3 text-slate-600">
                  <a
                    href={`mailto:${leader.email}`}
                    className="text-emerald-600 hover:underline"
                  >
                    {leader.email}
                  </a>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {leader.phoneNumber || "-"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {leader.address ? (
                    <span
                      title={leader.address}
                      className="truncate block max-w-xs"
                    >
                      {leader.address}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      leader.status
                    )}`}
                  >
                    {getStatusText(leader.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {formatDate(leader.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      title="Sửa"
                      onClick={() => {
                        setEditingLeader(leader);
                        setIsFormOpen(true);
                      }}
                      disabled={updateMutation.isPending}
                      className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                    >
                      <i className="ri-pencil-line text-lg"></i>
                    </button>
                    <button
                      title="Xóa"
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          title: "Xóa lãnh đạo",
                          message: `Bạn có chắc chắn muốn xóa "${leader.fullName}"? Hành động này không thể hoàn tác.`,
                          action: () => deleteMutation.mutate(leader._id),
                          type: "danger",
                        })
                      }
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <i className="ri-delete-bin-6-line text-lg"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leader Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-100 border-b border-slate-200 p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingLeader
                  ? "Cập nhật thông tin lãnh đạo"
                  : "Tạo lãnh đạo mới"}
              </h2>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingLeader(null);
                }}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <LeaderForm
              leader={editingLeader}
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingLeader(null);
              }}
              onSubmit={(data) => {
                if (editingLeader) {
                  updateMutation.mutate({ id: editingLeader._id, data });
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={() => {
          confirmDialog.action();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type={confirmDialog.type}
      />
    </>
  );
}
