import { adminApi } from "./index";

export interface VoucherData {
  _id: string;
  code: string;
  name: string;
  description?: string;
  image?: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxDiscount?: number | null;
  minOrderValue: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number | null;
  usedCount: number;
  userUsageLimit: number;
  applicableTours?: Array<{ _id: string; title: string; code?: string }>;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface GetVouchersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
}

export interface VouchersResponse {
  total: number;
  page: number;
  limit: number;
  data: VoucherData[];
}

export const getAdminVouchers = async (
  params?: GetVouchersParams
): Promise<VouchersResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);

  const response = await adminApi.get(`/vouchers?${queryParams.toString()}`);
  return response.data;
};

export const getAdminVoucherById = async (id: string): Promise<VoucherData> => {
  const response = await adminApi.get(`/vouchers/${id}`);
  return response.data;
};

export const createVoucher = async (
  data: Partial<VoucherData>
): Promise<{ message: string; voucher: VoucherData }> => {
  const response = await adminApi.post("/vouchers", data);
  return response.data;
};

export const updateVoucher = async (
  id: string,
  data: Partial<VoucherData>
): Promise<{ message: string; voucher: VoucherData }> => {
  const response = await adminApi.put(`/vouchers/${id}`, data);
  return response.data;
};

export const deleteVoucher = async (id: string): Promise<{ message: string }> => {
  const response = await adminApi.delete(`/vouchers/${id}`);
  return response.data;
};
