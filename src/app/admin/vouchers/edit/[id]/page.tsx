"use client";

import React from "react";
import VoucherForm from "../../VoucherForm";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateVoucher, getAdminVoucherById, VoucherData } from "@/lib/admin/adminVoucherApi";
import { useToast } from "@/components/ui/Toast";
import { useRouter, useParams } from "next/navigation";

export default function AdminEditVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { showSuccess, showError } = useToast();

  const { data: voucher, isLoading, isError } = useQuery({
    queryKey: ["adminVoucher", id],
    queryFn: () => getAdminVoucherById(id),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<VoucherData>) => updateVoucher(id, data),
    onSuccess: () => {
      showSuccess("Cập nhật voucher thành công!");
      router.push("/admin/vouchers");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Lỗi khi cập nhật voucher");
    }
  });

  const handleSubmit = (data: Partial<VoucherData>) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 flex justify-center mt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (isError || !voucher) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 text-center text-red-500 mt-20">
        <i className="ri-error-warning-line text-4xl mb-2"></i>
        <p>Không tìm thấy thông tin voucher.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <VoucherForm
        title={`Chỉnh sửa Voucher: ${voucher.code}`}
        initialData={voucher}
        onSubmit={handleSubmit}
        isPending={mutation.isPending}
      />
    </div>
  );
}
