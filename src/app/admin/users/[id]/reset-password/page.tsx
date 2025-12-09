"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { resetUserPassword } from "@/lib/admin/usersApi";
import { validatePassword } from "@/utils/validation";
import { Toast, useToast } from "@/components/ui/Toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string | string[]>>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string | string[]> = {};

    // Validate new password
    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      newErrors.newPassword = passwordErrors;
    }

    // Validate confirm password
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mutation
  const resetMutation = useMutation({
    mutationFn: (password: string) =>
      resetUserPassword(id, { newPassword: password }),
    onSuccess: () => {
      showSuccess("Đặt lại mật khẩu thành công!");
      setTimeout(() => {
        router.push("/admin/users");
      }, 2000);
    },
    onError: (error: any) => {
      showError(
        error?.response?.data?.message || "Không thể đặt lại mật khẩu"
      );
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
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

    resetMutation.mutate(formData.newPassword);
  };

  return (
    <>
      <Toast {...toast} onClose={hideToast} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Đặt Lại Mật Khẩu
            </h1>
            <p className="text-slate-600">
              Đặt mật khẩu mới cho người dùng. Mật khẩu phải đáp ứng các yêu cầu bảo mật.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-md p-6 md:p-8"
          >
            {/* New Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mật Khẩu Mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.newPassword ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Nhập mật khẩu mới"
              />
              {errors.newPassword && (
                <div className="mt-2">
                  {Array.isArray(errors.newPassword) ? (
                    <ul className="text-red-500 text-sm space-y-1">
                      {errors.newPassword.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-red-500 text-sm">{errors.newPassword}</p>
                  )}
                </div>
              )}
              
              {/* Password Requirements */}
              <div className="mt-2 text-xs text-slate-500">
                <p className="font-medium mb-1">Yêu cầu mật khẩu:</p>
                <ul className="space-y-1 ml-2">
                  <li>• Ít nhất 8 ký tự</li>
                  <li>• Có ít nhất 1 chữ thường (a-z)</li>
                  <li>• Có ít nhất 1 chữ hoa (A-Z)</li>
                  <li>• Có ít nhất 1 chữ số (0-9)</li>
                  <li>• Có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)</li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Xác Nhận Mật Khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.confirmPassword ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Xác nhận mật khẩu mới"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={resetMutation.isPending}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition font-medium"
              >
                {resetMutation.isPending ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
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
