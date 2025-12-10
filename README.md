# 🏙️ AHH TRAVEL

# 🏙️ AHH TRAVEL – Ứng dụng du lịch tại Việt Nam

Website đặt tour và khám phá địa điểm du lịch của **AHH Travel**, xây dựng với **Next.js + TypeScript + Supabase + MongoDB + Node.js**.  
Hệ thống gồm **Frontend (Next.js)** và **Backend (API riêng)** có phân quyền **Admin / User** rõ ràng.

---

## 🚀 TỔNG QUAN

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + React Query + TypeScript  
- **Backend:** Node.js + Express + MongoDB + JWT Authentication  
- **Database:** MongoDB Atlas  
- **Deploy:** Netlify / Vercel (FE) + Render / Railway (BE)

Hệ thống bao gồm 2 phần giao diện chính:
1. **User Site:** Đặt tour, xem lịch sử đặt chỗ, quản lý tài khoản.
2. **Admin Dashboard:** Quản lý tour, leader, chi phí, người dùng, blog,...

---

## 📁 CẤU TRÚC DỰ ÁN

<details>
<summary>🧭 Sơ đồ thư mục</summary>

```bash
ahh-travel/
├── public/                     # Ảnh, icon, font công khai
│   ├── logo.png
│   └── hot1.jpg
│
├── src/
│   ├── app/                    # Routing App Router (Next.js 13+)
│   │   ├── layout.tsx          # Layout toàn cục (Header/Footer)
│   │   ├── page.tsx            # Trang chủ (Home)
│   │   ├── auth/               # Đăng nhập, đăng ký, quên mật khẩu
│   │   ├── user/               # Các trang người dùng (Đặt chỗ, Tài khoản,...)
│   │   └── admin/              # Trang quản trị hệ thống
│   │       ├── dashboard/      # Tổng quan admin
│   │       ├── tours/          # Quản lý tour
│   │       ├── leader/         # Quản lý trưởng đoàn
│   │       └── login/          # Trang đăng nhập admin
│   │
│   ├── components/             # UI Components tái sử dụng
│   │   ├── cards/
│   │   │   ├── CardHot.tsx
│   │   │   ├── CardTour.tsx
│   │   │   └── BookingCard.tsx
│   │   ├── layouts/
│   │   └── ui/                 # Nút, Input, Modal,...
│   │
│   ├── hooks/                  # React Hooks
│   │   ├── useUser.ts          # Lấy thông tin user
│   │   ├── useAuth.ts          # Đăng nhập/đăng ký
│   │   └── admin-hook/         # Hooks cho trang quản trị
│   │       ├── useAdmin.ts
│   │       └── useOngoingTours.ts
│   │
│   ├── lib/                    # Cấu hình / API / tiện ích
│   │   ├── axios.ts            # Axios client chung
│   │   ├── authApi.ts          # API người dùng
│   │   ├── admin/              # API riêng cho admin
│   │   │   ├── adminApi.ts     # Axios instance riêng Admin
│   │   │   └── index.ts        # Các hàm login, getTours,...
│   │   ├── utils/              # Hàm tiện ích (formatVND, slugify,...)
│   │   └── types.ts            # Định nghĩa kiểu dữ liệu
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   └── types/                  # Interface & type mở rộng
│
├── .env.local                  # Biến môi trường
├── next.config.ts              # Cấu hình Next.js
├── tailwind.config.ts          # Cấu hình Tailwind
├── package.json
└── tsconfig.json

---

## 🧱 QUẢN LÝ LAYOUT

Dự án sử dụng App Router của Next.js (v13+):

- `src/app/layout.tsx`: Layout toàn cục (áp dụng cho tất cả trang)
- Có thể mở rộng layout riêng cho:
  - `src/app/admin/layout.tsx`
  - `src/app/auth/layout.tsx`

👉 Điều này giúp:
- Tách biệt UI từng khu vực (auth/admin/user)
- Dễ dàng wrap middleware hoặc UI layout riêng biệt

---

## ✅ MỤC TIÊU CỦA CẤU TRÚC

- Tách biệt theo module (admin, auth, user) → Dễ mở rộng
- Reusable Components → Giảm lặp code
- Hooks, lib riêng → Dễ test và bảo trì
- TypeScript + types/ → Hạn chế lỗi runtime

---

## 📌 YÊU CẦU CHẠY DỰ ÁN

```bash
# Cài dependencies
npm install

# Tạo file môi trường
cp .env.example .env.local

# Chạy development
npm run dev
```
