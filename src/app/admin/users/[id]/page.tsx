"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  updateUser,
  getUserById,
  type UpdateUserBody,
} from "@/lib/admin/usersApi";
import { validateEmail, validateRequired } from "@/utils/validation";
import { Toast, useToast } from "@/components/ui/Toast";

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    (async () => {
      try {
        const user = await getUserById(id);
        setFormData((prev) => ({
          ...prev,
          fullName: user.fullName || "",
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber || "",
          address: user.address || "",
        }));
      } catch {
        showError("Lỗi tải dữ liệu người dùng");
        router.push("/admin/users");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, router]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserBody) => updateUser(id, data),
    onSuccess: () => {
      showSuccess("Cập nhật người dùng thành công!");
      setTimeout(() => {
        router.push("/admin/users");
      }, 2000);
    },
    onError: (error: any) => {
      showError(
        error.response?.data?.message || "Không thể cập nhật người dùng"
      );
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const fullNameError = validateRequired(formData.fullName, "Họ tên");
    if (fullNameError) newErrors.fullName = fullNameError;

    const usernameError = validateRequired(formData.username, "Tài khoản");
    if (usernameError) newErrors.username = usernameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const updateData: UpdateUserBody = {
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
    };
    updateMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <>
      <Toast {...toast} onClose={hideToast} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Cập nhật Thông Tin Người Dùng
          </h1>
          <p className="text-slate-600">
            Chỉnh sửa thông tin của: <span className="font-semibold">{formData.fullName}</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6 md:p-8"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Họ tên *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.fullName ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Nhập họ tên"
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tài khoản *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.username ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Nhập tài khoản"
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.email ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Nhập email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Điện thoại
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Địa chỉ
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition font-medium"
            >
              {updateMutation.isPending ? "Đang xử lý..." : "Cập nhật"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
