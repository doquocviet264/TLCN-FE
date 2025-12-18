"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, deleteUser } from "@/lib/admin/usersApi";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({ isOpen: false, userId: "", userName: "" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminUsers", page, searchTerm],
    queryFn: () =>
      getAllUsers({
        page,
        limit: 20,
        search: searchTerm || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showSuccess("Xóa người dùng thành công!");
      setConfirmDelete({ isOpen: false, userId: "", userName: "" });
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Không thể xóa người dùng");
      setConfirmDelete({ isOpen: false, userId: "", userName: "" });
    },
  });

  const handleDelete = (id: string, fullName: string) => {
    setConfirmDelete({
      isOpen: true,
      userId: id,
      userName: fullName || "người dùng này",
    });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.userId) {
      deleteMutation.mutate(confirmDelete.userId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Quản Lý Người Dùng
        </h1>
        <p className="text-slate-600">Quản lý thông tin và quyền hạn của người dùng</p>
      </div>

      {/* Create Button */}
      <div className="mb-6">
        <Link
          href="/admin/users/create"
          className="inline-block rounded-lg bg-orange-500 px-6 py-3 text-white font-semibold hover:bg-orange-600 transition"
        >
          + Thêm User Mới
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, username, số điện thoại..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-medium">Lỗi khi tải dữ liệu người dùng</p>
          <p className="text-red-600 text-sm mt-2">{(error as any).message}</p>
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Không tìm thấy người dùng nào</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Họ tên
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Username
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
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((user, index) => (
                    <tr
                      key={user._id}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={user.avatarUrl || user.avatar || "https://i.pinimg.com/1200x/e1/1e/07/e11e07774f7fc24da8e03e769a0f0573.jpg"}
                            alt="avatar"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="font-medium text-slate-900">{user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <a
                          href={`mailto:${user.email}`}
                          className="text-orange-600 hover:underline"
                        >
                          {user.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-700">@{user.username}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {user.phoneNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {user.address || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.isActive === "y"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive === "y" ? "Hoạt động" : "Bị khoá"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {formatDate(user.createdDate || user.createdAt || "")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <Link
                            href={`/admin/users/${user._id}`}
                            title="Chỉnh sửa"
                            className="p-2 text-orange-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <i className="ri-pencil-line text-lg"></i>
                          </Link>
                          <Link
                            href={`/admin/users/${user._id}/reset-password`}
                            title="Đặt lại mật khẩu"
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          >
                            <i className="ri-key-line text-lg"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(user._id, user.fullName)}
                            disabled={deleteMutation.isPending}
                            title="Xóa"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
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
          </div>

          {/* Footer Info & Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-lg shadow-md p-4">
            <p className="text-slate-600 mb-4 md:mb-0">
              Tổng cộng: <span className="font-bold text-slate-900">{data.total}</span> người
              dùng | Trang{" "}
              <span className="font-bold text-orange-600">{page}</span> of{" "}
              <span className="font-bold">{data.pages}</span>
            </p>

            {/* Pagination Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Trước
              </button>

              {/* Page Numbers */}
              {[...Array(data.pages || 1)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-2 rounded-lg transition ${
                    page === i + 1
                      ? "bg-orange-500 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(data.pages || 1, p + 1))}
                disabled={page === data.pages}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Sau →
              </button>
            </div>
          </div>
        </>
      )}
      
      <Toast {...toast} onClose={hideToast} />
      
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa ${confirmDelete.userName} không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false, userId: "", userName: "" })}
      />
    </div>
  );
}
