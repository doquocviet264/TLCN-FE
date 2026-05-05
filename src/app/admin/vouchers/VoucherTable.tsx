"use client";

import React, { useState } from "react";
import { VoucherData, deleteVoucher, updateVoucher } from "@/lib/admin/adminVoucherApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface VoucherTableProps {
  vouchers: VoucherData[];
}

export default function VoucherTable({ vouchers }: VoucherTableProps) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
    type: "danger" as "danger" | "warning" | "info"
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
      showSuccess("Xóa voucher thành công");
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Lỗi khi xóa voucher");
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) => 
      updateVoucher(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
      showSuccess("Cập nhật trạng thái thành công");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Lỗi khi cập nhật");
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getStatusBadge = (voucher: VoucherData) => {
    const now = new Date();
    const validUntil = new Date(voucher.validUntil);
    const validFrom = new Date(voucher.validFrom);
    
    if (voucher.status === "inactive") {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Ngừng HĐ</span>;
    }
    
    if (now > validUntil) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Hết hạn</span>;
    }
    
    if (now < validFrom) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Sắp diễn ra</span>;
    }
    
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Hết lượt</span>;
    }

    return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Đang chạy</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
              <th className="px-6 py-4">Mã / Tên</th>
              <th className="px-6 py-4">Mức giảm</th>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4 text-center">Đã dùng</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Không tìm thấy voucher nào.
                </td>
              </tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {voucher.image ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                          <img src={voucher.image} alt={voucher.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                          <i className="ri-coupon-3-line text-xl"></i>
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 tracking-wide">{voucher.code}</div>
                        <div className="text-sm text-slate-500 truncate max-w-[200px]">{voucher.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">
                      {voucher.discountType === "percent" 
                        ? `${voucher.discountValue}%` 
                        : formatCurrency(voucher.discountValue)}
                    </div>
                    {voucher.discountType === "percent" && voucher.maxDiscount && (
                      <div className="text-xs text-slate-500">
                        Tối đa {formatCurrency(voucher.maxDiscount)}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-0.5">
                      Đơn tối thiểu: {formatCurrency(voucher.minOrderValue)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      Từ: {format(new Date(voucher.validFrom), "dd/MM/yyyy HH:mm")}
                    </div>
                    <div className="text-sm text-slate-700">
                      Đến: {format(new Date(voucher.validUntil), "dd/MM/yyyy HH:mm")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-slate-800">
                      {voucher.usedCount} <span className="text-slate-400 font-normal">/ {voucher.usageLimit ? voucher.usageLimit : "∞"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(voucher)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ 
                          id: voucher._id, 
                          status: voucher.status === "active" ? "inactive" : "active" 
                        })}
                        className={`p-2 rounded-lg transition-colors ${
                          voucher.status === "active" 
                            ? "text-orange-600 hover:bg-orange-50 bg-white" 
                            : "text-emerald-600 hover:bg-emerald-50 bg-white border border-slate-200"
                        }`}
                        title={voucher.status === "active" ? "Tạm ngưng" : "Kích hoạt lại"}
                      >
                        <i className={voucher.status === "active" ? "ri-pause-circle-line" : "ri-play-circle-line"}></i>
                      </button>
                      <Link
                        href={`/admin/vouchers/edit/${voucher._id}`}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <i className="ri-edit-line"></i>
                      </Link>
                      <button
                        onClick={() => setConfirmDialog({
                          isOpen: true,
                          title: "Xóa Voucher",
                          message: `Bạn có chắc chắn muốn xóa voucher ${voucher.code}? Hành động này không thể hoàn tác.`,
                          action: () => deleteMutation.mutate(voucher._id),
                          type: "danger"
                        })}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        type={confirmDialog.type}
      />
    </div>
  );
}
