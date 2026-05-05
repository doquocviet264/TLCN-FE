"use client";

import React from "react";
import VoucherForm from "../VoucherForm";
import { useMutation } from "@tanstack/react-query";
import { createVoucher, VoucherData } from "@/lib/admin/adminVoucherApi";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function AdminCreateVoucherPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const mutation = useMutation({
    mutationFn: createVoucher,
    onSuccess: () => {
      showSuccess("Tạo voucher thành công!");
      router.push("/admin/vouchers");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Lỗi khi tạo voucher");
    }
  });

  const handleSubmit = (data: Partial<VoucherData>) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <VoucherForm
        title="Tạo Khuyến Mãi Mới"
        onSubmit={handleSubmit}
        isPending={mutation.isPending}
      />
    </div>
  );
}
