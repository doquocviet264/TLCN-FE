"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Ticket,
  X,
  Percent,
  Banknote,
  ChevronRight,
  Check,
} from "lucide-react";

import { useGetTourById } from "#/hooks/tours-hook/useTourDetail";
import {
  createBooking,
  initBookingPayment,
  initSepayPayment,
} from "@/lib/checkout/checkoutApi";
import type { CreateBookingBody } from "@/lib/checkout/checkoutApi";

import { authApi } from "@/lib/auth/authApi";
import { useAuthStore } from "#/stores/auth";
import { getUserToken } from "@/lib/auth/tokenManager";
import { voucherApi, type Voucher } from "@/lib/voucher/voucherApi";

/* ========== Helpers ========== */
const toNum = (v?: number | string) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d]/g, ""));
    return Number.isNaN(n) ? undefined : n;
  }
};

const vnd = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      })
        .format(n)
        .replace(/\s?₫$/, " VNĐ")
    : "—";

const dmy = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhoneVN = (s: string) =>
  /^(\+?84|0)(\d{9,10})$/.test(s.replace(/\s+/g, ""));

/* ===========================================================
 * TYPES
 * ===========================================================
 */
type PaymentMethod = CreateBookingBody["paymentMethod"] | "sepay-payment";
type PaymentType = "office" | "full";

/* ===========================================================
 * Loading Fallback
 * ===========================================================
 */
function CheckoutLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        <p className="mt-4 text-slate-600">Đang tải trang thanh toán…</p>
      </div>
    </div>
  );
}

/* ===========================================================
 * PAGE WRAPPER (with Suspense for useSearchParams)
 * ===========================================================
 */
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}

/* ===========================================================
 * CHECKOUT CONTENT
 * ===========================================================
 */
function CheckoutContent() {
  const search = useSearchParams();
  const router = useRouter();

  const { token, user } = useAuthStore();
  const accessToken = token?.accessToken || getUserToken();

  const id = (search.get("id") ?? "").toString();
  const initAdults = Math.max(1, Number(search.get("adults") ?? 1));
  const initChildren = Math.max(0, Number(search.get("children") ?? 0));

  const { data: tour, isLoading, isError } = useGetTourById(id);

  /* ---------- Form state ---------- */
  const [formData, setFormData] = React.useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });
  const [adults, setAdults] = React.useState(initAdults);
  const [children, setChildren] = React.useState(initChildren);

  const [paymentType, setPaymentType] = React.useState<PaymentType>("office");
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("office-payment");

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof typeof formData | "submit", string>>
  >({});
  const [submitting, setSubmitting] = React.useState(false);
  const [isReadOnly, setIsReadOnly] = React.useState(false);

  /* ---------- Voucher state ---------- */
  const [voucherCode, setVoucherCode] = React.useState("");
  const [voucher, setVoucher] = React.useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [voucherError, setVoucherError] = React.useState<string | null>(null);
  const [loadingVoucher, setLoadingVoucher] = React.useState(false);
  const [showVoucherModal, setShowVoucherModal] = React.useState(false);

  // Danh sách voucher của user
  const [myVouchers, setMyVouchers] = React.useState<Voucher[]>([]);
  const [loadingMyVouchers, setLoadingMyVouchers] = React.useState(true);

  /* ---------- Prefill user profile ---------- */
  React.useEffect(() => {
    const loadUserProfile = async () => {
      if (!accessToken) return;
      if (user) {
        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          address: "",
        });
        setIsReadOnly(true);
        return;
      }
      try {
        const profile = await authApi.getProfile(accessToken);
        if (profile) {
          setFormData({
            fullName: profile.fullName || "",
            email: profile.email || "",
            phone: profile.phone || "",
            address: "",
          });
          setIsReadOnly(true);
        }
      } catch (err) {
        console.error(err);
        setIsReadOnly(false);
      }
    };
    loadUserProfile();
  }, [accessToken, user]);

  /* ---------- Load voucher của user ---------- */
  React.useEffect(() => {
    const loadVouchers = async () => {
      try {
        setLoadingMyVouchers(true);
        const vs = await voucherApi.getMyVouchers("active");
        setMyVouchers(vs.filter((v) => v.status === "active"));
      } catch (err: any) {
        console.error(err);
        setMyVouchers([]);
      } finally {
        setLoadingMyVouchers(false);
      }
    };
    loadVouchers();
  }, []);

  /* ---------- Giá / tổng tiền ---------- */
  const priceAdult = toNum(tour?.priceAdult) ?? 0;
  const priceChild = toNum(tour?.priceChild) ?? 0;
  const coverImg =
    tour?.images?.[0] || tour?.image || tour?.cover || "/hot1.jpg";

  const listed = adults * priceAdult + children * priceChild;
  const totalDisplay = Math.max(0, listed - discountAmount);

  /* ---------- Validation ---------- */
  const validateField = (name: keyof typeof formData, value: string) => {
    if (name !== "address" && !value.trim()) return "Vui lòng không để trống.";
    if (name === "email" && !isEmail(value)) return "Email không hợp lệ.";
    if (name === "phone" && !isPhoneVN(value))
      return "Số điện thoại không hợp lệ.";
    return undefined;
  };

  /* ---------- Voucher logic ---------- */
  const doApplyVoucher = async (code: string) => {
    if (!code.trim()) {
      setVoucherError("Vui lòng nhập mã voucher");
      return;
    }
    setLoadingVoucher(true);
    setVoucherError(null);

    try {
      const res = await voucherApi.validateVoucher(code.trim(), listed || 0);

      if (!res.valid) {
        setVoucher(null);
        setDiscountAmount(0);
        setVoucherError(res.message || "Voucher không hợp lệ.");
        return;
      }

      setVoucher(res.voucher || null);
      setDiscountAmount(res.discountAmount || 0);
      setVoucherError(null);
      setShowVoucherModal(false);
    } catch (err: any) {
      console.error(err);
      setVoucherError(
        err?.response?.data?.message || "Không thể kiểm tra voucher."
      );
    } finally {
      setLoadingVoucher(false);
    }
  };

  const handleSelectVoucher = async (v: Voucher) => {
    setVoucherCode(v.code);
    await doApplyVoucher(v.code);
  };

  /* ---------- Handlers ---------- */
  const handleInputChange = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, submit: undefined }));
    }
  };

  /* ---------- Submit Logic ---------- */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const newErrors: typeof errors = {};
    let hasError = false;
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((k) => {
      if (k === "address") return;
      const msg = validateField(k, formData[k]);
      if (msg) {
        newErrors[k] = msg;
        hasError = true;
      }
    });
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const total = Number(totalDisplay) || 0;

    const payload: CreateBookingBody = {
      tourId: String(tour?._id ?? id),
      contact: {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim() || undefined,
      },
      guests: { adults: Number(adults) || 1, children: Number(children) || 0 },
      pricing: {
        priceAdult: Number(priceAdult) || 0,
        priceChild: Number(priceChild) || 0,
        total,
      },
      paymentMethod,
      couponCode: voucher?.code || null,
      paymentType: paymentType as CreateBookingBody["paymentType"],
    };

    try {
      setSubmitting(true);
      const res = await createBooking(payload);

      if (!res?.code) {
        throw new Error("Không tạo được đơn hàng (thiếu mã code).");
      }

      // Thanh toán VNPay
      if (paymentMethod === "vnpay-payment") {
        const payData = await initBookingPayment(res.code, total);
        const redirectUrl =
          payData?.payUrl || payData?.deeplink || payData?.payment?.redirectUrl;

        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
      }

      // Thanh toán SePay
      if (paymentMethod === "sepay-payment") {
        const payData = await initSepayPayment(res.code, total);
        const redirectUrl =
          payData?.payUrl || payData?.deeplink || payData?.payment?.redirectUrl;

        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
      }

      // Office hoặc fallback: chuyển sang trang success
      const sp = new URLSearchParams();
      sp.append("bookingId", res.code);
      sp.append("email", payload.contact.email);
      sp.append("paymentMethod", String(paymentMethod));
      router.replace(`/user/checkout/success?${sp.toString()}`);
    } catch (err: any) {
      console.error(err);
      setErrors({
        submit:
          err?.response?.data?.message || err?.message || "Đặt chỗ thất bại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Loading / Error ---------- */
  // ... các đoạn logic phía trên giữ nguyên

  if (isError || !tour)
    return (
      <div className="p-10 text-center text-slate-700">
        Không tìm thấy tour.
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ===== HERO / HEADER ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 pb-20 pt-10 text-white">
        {/* pattern chấm */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            {/* breadcrumb */}
            <nav className="mb-3 flex items-center gap-2 text-xs font-medium text-blue-200/90">
              <Link href="/" className="hover:text-amber-300">
                Trang chủ
              </Link>
              <span className="h-1 w-1 rounded-full bg-blue-300" />
              <span className="text-blue-100">Đặt tour</span>
            </nav>

            {/* badge bước */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Bước 2 · Xác nhận & thanh toán
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-snug sm:text-3xl lg:text-4xl">
              Xác nhận đặt chỗ
            </h1>
            <p className="mt-2 max-w-lg text-sm text-blue-100/90">
              Kiểm tra thông tin liên lạc, số lượng khách và phương thức thanh
              toán trước khi hoàn tất đơn đặt tour.
            </p>
          </div>

          {/* tóm tắt tour nhỏ trên hero (mobile thì ẩn bớt) */}
          <div className="hidden min-w-[260px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs sm:block">
            <p className="mb-1 line-clamp-1 font-semibold text-white">
              {tour.title}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-blue-100">
              {tour.destination && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {tour.destination}
                </span>
              )}
              {tour.time && (
                <span className="inline-flex items-center gap-1">
                  <User size={14} /> {tour.time}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="relative z-10 mx-auto max-w-[1200px] px-4 pb-10 -mt-4 lg:-mt-6">
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-8 lg:grid-cols-12"
        >
          {/* LEFT COLUMN: INFO */}
          <div className="space-y-6 lg:col-span-8">
            {/* 1. Contact Info */}
            <Card
              title="Thông tin liên lạc"
              icon={<User size={18} className="text-orange-500" />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  name="fullName"
                  label="Họ và tên *"
                  value={formData.fullName}
                  onChange={(e: any) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  icon={<User size={16} />}
                  required
                  error={errors.fullName}
                />
                <Input
                  name="email"
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e: any) =>
                    handleInputChange("email", e.target.value)
                  }
                  icon={<Mail size={16} />}
                  required
                  error={errors.email}
                />
                <Input
                  name="phone"
                  label="Số điện thoại *"
                  value={formData.phone}
                  onChange={(e: any) =>
                    handleInputChange("phone", e.target.value)
                  }
                  icon={<Phone size={16} />}
                  required
                  error={errors.phone}
                />
                <Input
                  name="address"
                  label="Địa chỉ"
                  value={formData.address}
                  onChange={(e: any) =>
                    handleInputChange("address", e.target.value)
                  }
                  icon={<MapPin size={16} />}
                  error={errors.address}
                />
              </div>
            </Card>

            {/* 2. Guests */}
            <Card title="Số lượng hành khách" icon={<UsersIcon />}>
              <div className="grid gap-6 md:grid-cols-2">
                <QuantitySelector
                  label="Người lớn"
                  value={adults}
                  onChange={setAdults}
                  min={1}
                  price={priceAdult}
                />
                <QuantitySelector
                  label="Trẻ em"
                  value={children}
                  onChange={setChildren}
                  min={0}
                  price={priceChild}
                />
              </div>
            </Card>

            {/* 3. Payment Method */}
            <Card
              title="Phương thức thanh toán"
              icon={<Banknote size={18} className="text-emerald-600" />}
            >
              <PaymentMethods
                value={paymentMethod}
                onChange={setPaymentMethod}
                typeValue={paymentType}
                onTypeChange={setPaymentType}
              />
            </Card>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="space-y-6 lg:col-span-4">
            {/* Tour Summary Card */}
            <div className="sticky top-6 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-200/70 backdrop-blur">
              {/* Header Image */}
              <div className="relative h-40 w-full">
                <Image
                  src={coverImg}
                  alt={tour.title ?? "Tour"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-4 right-3">
                  <p className="mb-1 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    Xác nhận đặt tour
                  </p>
                  <h3 className="line-clamp-2 text-lg font-bold text-white">
                    {tour.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-blue-100">
                    <MapPin size={12} /> {tour.destination}
                  </p>
                </div>
              </div>

              {/* Pricing Details */}
              <div className="space-y-4 p-5">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Người lớn ({adults}x)</span>
                    <span>{vnd(adults * priceAdult)}</span>
                  </div>
                  {children > 0 && (
                    <div className="flex justify-between">
                      <span>Trẻ em ({children}x)</span>
                      <span>{vnd(children * priceChild)}</span>
                    </div>
                  )}
                  <div className="my-2 flex justify-between border-t border-dashed border-slate-200 pt-2 font-medium text-slate-900">
                    <span>Tạm tính</span>
                    <span>{vnd(listed)}</span>
                  </div>

                  {/* Discount Row */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                      <span>Voucher giảm giá</span>
                      <span>- {vnd(discountAmount)}</span>
                    </div>
                  )}
                </div>

                {/* VOUCHER BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-3 text-left text-sm transition hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-2">
                    <Ticket size={18} className="text-emerald-600" />
                    <span className="font-medium text-slate-700">
                      {voucher ? (
                        <span className="font-bold text-emerald-700">
                          {voucher.code}
                        </span>
                      ) : (
                        "Mã giảm giá"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-emerald-600 group-hover:underline">
                    {voucher ? "Đổi" : "Chọn hoặc nhập mã"}{" "}
                    <ChevronRight size={14} />
                  </div>
                </button>

                {/* Total */}
                <div className="flex items-end justify-between border-t border-slate-200 pt-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Tổng cộng
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Giá đã bao gồm thuế & phí cơ bản
                    </p>
                  </div>
                  <span className="text-2xl font-extrabold text-slate-900">
                    {vnd(totalDisplay)}
                  </span>
                </div>

                <Button
                  type="submit"
                  full
                  disabled={submitting}
                  className="h-12 text-base"
                >
                  {submitting ? "Đang xử lý..." : "Thanh toán ngay"}
                </Button>

                {errors.submit && (
                  <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-red-600">
                    <AlertCircle size={14} /> {errors.submit}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* VOUCHER MODAL */}
      <AnimatePresence>
        {showVoucherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">
                  Chọn Voucher Travela
                </h3>
                <button
                  onClick={() => setShowVoucherModal(false)}
                  className="p-1 hover:bg-slate-200 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-slate-50 border-b">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã voucher"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={voucherCode}
                    onChange={(e) =>
                      setVoucherCode(e.target.value.toUpperCase())
                    }
                  />
                  <button
                    type="button"
                    onClick={() => doApplyVoucher(voucherCode)}
                    disabled={!voucherCode || loadingVoucher}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loadingVoucher ? "Đang kiểm tra..." : "Áp dụng"}
                  </button>
                </div>
                {voucherError && (
                  <p className="text-xs text-red-500 mt-2 ml-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {voucherError}
                  </p>
                )}
              </div>

              <div className="p-4 max-h-[300px] overflow-y-auto space-y-3">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Mã giảm giá của tôi
                </p>

                {loadingMyVouchers ? (
                  <p className="text-center text-sm text-slate-400 py-4">
                    Đang tải...
                  </p>
                ) : myVouchers.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-4">
                    Bạn chưa có voucher nào
                  </p>
                ) : (
                  myVouchers.map((v) => (
                    <button
                      type="button"
                      key={v._id}
                      onClick={() => handleSelectVoucher(v)}
                      className={`relative flex items-center p-3 rounded-lg border cursor-pointer transition-all w-full text-left ${
                        voucher?.code === v.code
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-emerald-300 bg-white"
                      }`}
                    >
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mr-3 shrink-0">
                        {v.type === "percent" ? (
                          <Percent size={20} />
                        ) : (
                          <Banknote size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">
                          {v.code}
                        </p>
                        <p className="text-xs text-slate-500">
                          {v.description ||
                            `Giảm ${
                              v.type === "percent"
                                ? v.value + "%"
                                : vnd(v.value)
                            }`}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          HSD: {dmy(v.expiresAt)}
                        </p>
                      </div>
                      {voucher?.code === v.code && (
                        <div className="text-emerald-600">
                          <Check size={20} />
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* --- Sub Components --- */
const UsersIcon = () => (
  <div className="flex -space-x-2">
    <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white" />
    <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white" />
  </div>
);

function Card({ title, icon, children }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm shadow-slate-100">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Input({ label, icon, error, ...props }: any) {
  const hasError = !!error;
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {icon}
        </div>
        <input
          {...props}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium text-slate-700 bg-slate-50/50 focus:bg-white outline-none transition-all ${
            hasError
              ? "border-rose-400 focus:ring-2 focus:ring-rose-400"
              : "border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          }`}
        />
      </div>
      {hasError && (
        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function QuantitySelector({ label, value, onChange, min, price }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
      <div>
        <p className="font-bold text-slate-700 text-sm">{label}</p>
        <p className="text-xs text-emerald-600 font-medium">
          {vnd(price)}/khách
        </p>
      </div>
      <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
        >
          -
        </button>
        <span className="w-6 text-center font-bold text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600"
        >
          +
        </button>
      </div>
    </div>
  );
}

function PaymentMethods({ value, onChange, typeValue, onTypeChange }: any) {
  const methods = [
    {
      id: "office-payment",
      type: "office",
      name: "Thanh toán tại văn phòng",
      desc: "Giữ chỗ trong 24h",
      img: "/pay.png",
    },
    {
      id: "vnpay-payment",
      type: "full",
      name: "VNPay QR",
      desc: "Thanh toán qua ví VNPay",
      img: "/vnpay.png",
    },
    {
      id: "sepay-payment",
      type: "full",
      name: "Chuyển khoản (SePay)",
      desc: "Xác nhận tự động 24/7",
      img: "/sepay.png",
    },
  ];

  return (
    <div className="space-y-3">
      {methods.map((m) => (
        <label
          key={m.id}
          onClick={() => {
            onChange(m.id);
            onTypeChange(m.type);
          }}
          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
            value === m.id
              ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500"
              : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50"
          }`}
        >
          <input
            type="radio"
            name="payment"
            className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
            checked={value === m.id}
            readOnly
          />
          <div className="w-10 h-10 relative flex-shrink-0">
            <Image
              src={m.img}
              alt={m.name}
              fill
              className="object-contain"
              onError={(e: any) => {
                try {
                  (e.currentTarget as HTMLImageElement).src = "/pay.png";
                } catch {
                  // ignore
                }
              }}
            />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{m.name}</p>
            <p className="text-xs text-slate-500">{m.desc}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
function Button({ children, className = "", ...props }: any) {
  return (
    <button
      {...props}
      className={`
        w-full rounded-2xl 
        bg-gradient-to-r from-orange-500 to-orange-600 
        px-4 py-3
        text-sm font-bold text-white
        shadow-lg shadow-orange-500/30
        transition-all
        hover:from-orange-600 hover:to-orange-700
        active:scale-[0.97]
        disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
        ${className}
      `}
    >
      {children}
    </button>
  );
}
