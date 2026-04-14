import { adminApi } from "./adminApi";

export type User = {
  _id: string;
  email: string;
  username: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  isActive?: string;
  status?: string;
  google_id?: string;
  createdDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GetUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type CreateUserBody = {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
};

export type UpdateUserBody = {
  email?: string;
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
};

export type ResetPasswordBody = {
  newPassword: string;
};

/** Lấy danh sách users */
export async function getAllUsers(params?: GetUsersParams) {
  const { data } = await adminApi.get<{
    total: number;
    page: number;
    limit: number;
    pages: number;
    data: User[];
  }>("/users", { params });
  return data;
}

/** Lấy chi tiết user */
export async function getUserById(id: string) {
  const { data } = await adminApi.get<User>(`/users/${id}`);
  return data;
}

/** Tạo user mới */
export async function createUser(body: CreateUserBody) {
  const { data } = await adminApi.post<{ message: string; user: User }>("/users", body);
  return data;
}

/** Cập nhật user */
export async function updateUser(id: string, body: UpdateUserBody) {
  const { data } = await adminApi.put<{ message: string; user: User }>(`/users/${id}`, body);
  return data;
}

/** Reset mật khẩu user */
export async function resetUserPassword(id: string, body: ResetPasswordBody) {
  const { data } = await adminApi.patch<{ message: string }>(`/users/${id}/reset-password`, body);
  return data;
}

/** Xóa user */
export async function deleteUser(id: string) {
  const { data } = await adminApi.delete<{ message: string }>(`/users/${id}`);
  return data;
}

/** Khóa/Mở khóa user */
export async function toggleUserStatus(id: string) {
  const { data } = await adminApi.patch<{ message: string; isActive: string }>(`/users/${id}/toggle-status`);
  return data;
}
