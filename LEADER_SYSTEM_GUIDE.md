# 📋 Hướng Dẫn Hệ Thống Quản Lý Leader (Lãnh Đạo Tour)

## 🎯 Tổng Quan

Hệ thống Leader giúp admin quản lý các lãnh đạo tour (tour guides/leaders) và phân công họ cho các chuyến tour khác nhau. Mỗi tour có thể gán một leader để điều hành chuyến đi.

---

## 📊 Cấu Trúc Dữ Liệu

### 1. **Leader Model** (Lãnh Đạo)

```typescript
type LeaderData = {
  _id: string; // ID duy nhất
  fullName: string; // Họ tên
  username: string; // Tên tài khoản
  email: string; // Email
  phoneNumber: string; // Số điện thoại
  address: string; // Địa chỉ
  status: "active" | "inactive"; // Trạng thái hoạt động
  createdAt: string; // Ngày tạo
  updatedAt: string; // Ngày cập nhật
};
```

### 2. **Tour - Leader Relationship**

```typescript
type Tour = {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;

  // ⭐ Quan hệ với Leader
  leader?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  } | null;
};
```

---

## 🏗️ Cấu Trúc Code

### Folder Structure

```
src/app/admin/leaders/
  ├── page.tsx              # Trang danh sách Leaders (Quản Lý Lãnh Đạo)
  ├── LeadersTable.tsx      # Component bảng danh sách + form modal
  └── LeaderForm.tsx        # Form thêm/sửa leader

src/lib/admin/
  ├── adminLeaderApi.ts     # API calls cho Leader (CRUD)
  └── adminApi.ts           # API call setTourLeader (phân công)
```

---

## 🔄 Quy Trình Hoạt Động

### **Phần 1: Quản Lý Lãnh Đạo** (page: `/admin/leaders`)

#### 1.1 **Xem Danh Sách Leader**

```tsx
// page.tsx
const { data, isLoading } = useQuery({
  queryKey: ["adminLeaders", page, searchTerm, statusFilter],
  queryFn: () =>
    getAdminLeaders({
      page,
      limit: 20,
      status,
      search,
    }),
});
```

- Tải danh sách tất cả leaders
- Có thể search theo tên, email, username, điện thoại
- Filter theo trạng thái: Active / Inactive

#### 1.2 **Thêm Leader Mới**

```tsx
// LeadersTable.tsx - Click "Thêm leader" button
1. Modal form mở
2. User nhập thông tin:
   - Họ tên
   - Username
   - Email
   - Số điện thoại
   - Địa chỉ
   - Trạng thái (active/inactive)
   - Mật khẩu (nếu tạo mới)
3. Click "Lưu" → gọi API tạo leader
```

**API Endpoint:**

```
POST /api/admin/leaders
Body: {
  fullName, username, email, phoneNumber, address, status, password
}
```

#### 1.3 **Sửa Leader**

```tsx
// LeadersTable.tsx - Click edit icon
1. Modal form mở (prefilled dữ liệu cũ)
2. User chỉnh sửa trường cần thay đổi
3. Click "Cập nhật" → gọi API update
```

**API Endpoint:**

```
PUT /api/admin/leaders/{leaderId}
Body: { fullName, username, email, phoneNumber, address, status, password? }
```

#### 1.4 **Xóa Leader**

```tsx
// LeadersTable.tsx - Click delete icon
1. Confirm dialog hiện
2. Click "Xóa" → gọi API xóa
```

**API Endpoint:**

```
DELETE /api/admin/leaders/{leaderId}
```

---

### **Phần 2: Phân Công Leader cho Tour** (page: `/admin/tours/{tourId}`)

#### 2.1 **Xem Tour hiện tại**

```tsx
// [id]/page.tsx
const { data: ongoing } = useOngoingTours();
const tour = ongoing?.find(t => t._id === tourId);

// Tour object chứa:
{
  _id: "tour123",
  title: "Du lịch Nha Trang",
  startDate: "2025-12-15T08:00:00Z",
  leader: {
    _id: "leader456",
    fullName: "Nguyễn Văn A"
  }
}
```

#### 2.2 **Gán Leader cho Tour**

```tsx
// [id]/page.tsx - Phần "Leader"
<section>
  <h2>Leader</h2>

  {/* Input nhập Leader ID */}
  <input
    placeholder="Nhập leaderId"
    value={leaderId}
    onChange={(e) => setLeaderId(e.target.value)}
  />

  {/* Button lưu */}
  <button onClick={() => setLeader.mutate(leaderId || null)}>Lưu leader</button>
</section>
```

**Chi tiết hoạt động:**

1. Admin mở trang chi tiết tour (ongoing tour)
2. Admin nhập ID của leader muốn gán
3. Click "Lưu leader"
4. Gọi API: `PATCH /api/admin/tours/{tourId}/leader`
5. Backend cập nhật trường `leader` của tour
6. UI cập nhật để hiển thị leader mới

**API Endpoint:**

```
PATCH /api/admin/tours/{tourId}/leader
Body: { leaderId: "leader456" } hoặc { leaderId: null } (bỏ gán)
```

---

## 📱 UI Components

### **LeadersTable.tsx**

| Cột        | Mô tả                   | Hành động                  |
| ---------- | ----------------------- | -------------------------- |
| Họ tên     | Hiển thị fullName       | -                          |
| Email      | Hiển thị email          | -                          |
| Username   | Hiển thị username       | -                          |
| Số ĐT      | Hiển thị phoneNumber    | -                          |
| Địa chỉ    | Hiển thị address        | -                          |
| Trạng thái | Badge (Active/Inactive) | Click để filter            |
| Hành động  | -                       | Edit / Delete / Create New |

### **LeaderForm.tsx** (Modal)

- Dùng cho cả Create và Update
- Form validation (required fields, email format)
- Prefill dữ liệu khi edit
- Close button (X) hoặc submit để đóng

---

## 🔌 API Reference

### **1. Get All Leaders**

```
GET /api/admin/leaders?page=1&limit=20&status=active&search=nguyen
Response: {
  data: LeaderData[],
  total: number,
  totalPages: number,
  page: number
}
```

### **2. Create Leader**

```
POST /api/admin/leaders
Body: {
  fullName: "Nguyễn Văn A",
  username: "nguyenvana",
  email: "a@example.com",
  phoneNumber: "0901234567",
  address: "123 Nguyễn Huệ",
  status: "active",
  password: "password123"
}
Response: { message, leader: LeaderData }
```

### **3. Update Leader**

```
PUT /api/admin/leaders/{leaderId}
Body: {
  fullName, username, email, phoneNumber, address, status
  // password optional (nếu muốn đổi mật khẩu)
}
Response: { message, leader: LeaderData }
```

### **4. Delete Leader**

```
DELETE /api/admin/leaders/{leaderId}
Response: { message }
```

### **5. Set Tour Leader** ⭐

```
PATCH /api/admin/tours/{tourId}/leader
Body: { leaderId: "leader456" } or { leaderId: null }
Response: { message, tour: Tour }
```

---

## 🎯 Use Cases (Trường Hợp Sử Dụng)

### **Scenario 1: Thêm Leader Mới**

```
1. Admin vào /admin/leaders
2. Click "Thêm leader"
3. Nhập: Nguyễn Văn A, nguyenvana, a@email.com, 0901234567, ...
4. Click "Lưu"
5. Leader được tạo, hiển thị trong table
```

### **Scenario 2: Sửa Thông Tin Leader**

```
1. Admin vào /admin/leaders
2. Tìm leader "Nguyễn Văn A" trong danh sách
3. Click icon edit (pencil)
4. Modal mở, chỉnh sửa số điện thoại: 0901234567 → 0987654321
5. Click "Cập nhật"
6. Dữ liệu được cập nhật
```

### **Scenario 3: Xóa Leader**

```
1. Admin vào /admin/leaders
2. Click icon delete (trash) trên leader cần xóa
3. Confirm dialog: "Bạn chắc chắn muốn xóa?"
4. Click "Xóa"
5. Leader bị xóa khỏi database
```

### **Scenario 4: Phân Công Tour cho Leader** ⭐

```
1. Admin vào /admin/dashboard
2. Xem danh sách tours đang chạy
3. Click vào tour "Du lịch Nha Trang"
4. Trang chi tiết mở, cuộn xuống phần "Leader"
5. Input: nhập ID leader = "lead456"
6. Click "Lưu leader"
7. Tour được gán cho leader, hiển thị "Nguyễn Văn A"
8. Leader có thể xem tour được gán trên app của họ
```

### **Scenario 5: Bỏ Gán Leader (Unassign)**

```
1. Trang chi tiết tour
2. Phần Leader: xóa ID leader (để trống)
3. Click "Lưu leader" (với leaderId = null)
4. Tour không còn leader, hiển thị "Chưa gán leader"
```

---

## 🛠️ Code Explanation

### **Hook: useSetLeader**

```typescript
// src/app/admin/hooks/useAdmin.ts
export function useSetLeader(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaderId: string | null) => setTourLeader(tourId, leaderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.ongoing() }),
    // Sau khi set leader thành công, reload danh sách tours
  });
}

// Sử dụng trong component:
const setLeader = useSetLeader(tourId);
setLeader.mutate("lead456");
```

### **API: setTourLeader**

```typescript
// src/lib/admin/adminApi.ts
export async function setTourLeader(tourId: string, leaderId: string | null) {
  const { data } = await adminApi.patch(`/admin/tours/${tourId}/leader`, {
    leaderId,
  });
  return data;
}
```

---

## 🎨 UI/UX Flow

```
Admin Dashboard
    ↓
Navigation: "Quản Lý Lãnh Đạo"
    ↓
/admin/leaders (Danh Sách Leaders)
    ├── Search & Filter
    ├── Table với leaders
    │   ├── [Edit] → Modal Form (Update)
    │   └── [Delete] → Confirm → Delete
    └── [+ Thêm leader] → Modal Form (Create)

---

/admin/tours/{tourId} (Chi Tiết Tour - Phân Công)
    ├── Tour Info
    ├── [Leader Section]
    │   ├── Input leaderId
    │   └── [Lưu leader] → API PATCH → Reload
    ├── [Timeline Section]
    ├── [Expenses Section]
    └── [Participants Section]
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **leaderId là String**: Khi gán leader, nhập đúng `_id` của leader (24 ký tự hex)
2. **Chỉ ongoing tours**: Chỉ tour đang chạy mới có thể phân công leader
3. **1 tour - 1 leader**: Mỗi tour chỉ có 1 leader tại một thời điểm
4. **Unassign**: Gán leaderId = null để bỏ leader
5. **Xóa Leader**: Nếu xóa leader đang được gán tour, tour sẽ mất leader

---

## 📝 Tóm Tắt

| Thành phần                 | Mục đích                           | Vị trí                            |
| -------------------------- | ---------------------------------- | --------------------------------- |
| **Leaders Page**           | Quản lý (CRUD) danh sách leaders   | `/admin/leaders`                  |
| **LeadersTable**           | Hiển thị bảng, form modal thêm/sửa | `/admin/leaders/LeadersTable.tsx` |
| **LeaderForm**             | Form input dữ liệu leader          | `/admin/leaders/LeaderForm.tsx`   |
| **Tour Detail**            | Phân công leader cho tour          | `/admin/tours/[id]/page.tsx`      |
| **adminLeaderApi**         | CRUD leaders                       | `/lib/admin/adminLeaderApi.ts`    |
| **adminApi.setTourLeader** | Gán leader cho tour                | `/lib/admin/adminApi.ts`          |

---

Hy vọng hướng dẫn này giúp bạn hiểu rõ hệ thống Leader! 🚀
