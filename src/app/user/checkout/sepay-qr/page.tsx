"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axiosInstance from "@/lib/axiosInstance";

const vnd = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      })
        .format(n)
        .replace(/\s?₫$/, " VND")
    : "—";

/* ===========================================================
 * Loading Fallback
 * ===========================================================
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
        <p className="mt-4 text-slate-600">Đang tải mã QR thanh toán…</p>
      </div>
    </div>
  );
}

/* ===========================================================
 * PAGE WRAPPER (with Suspense for useSearchParams)
 * ===========================================================
 */
export default function SepayQRPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SepayQRContent />
    </Suspense>
  );
}

/* ===========================================================
 * SEPAY QR CONTENT
 * ===========================================================
 */
function SepayQRContent() {
  const search = useSearchParams();
  const router = useRouter();

  const code = search.get("code") || "";
  const amount = Number(search.get("amount") || 0);
  const qrUrl = search.get("qr") || "";
  const ref = search.get("ref") || "";

  const [checking, setChecking] = React.useState(false);
  const [isPaid, setIsPaid] = React.useState(false);
  const [countdown, setCountdown] = React.useState(15 * 60); // 15 minutes

  // Poll để check thanh toán
  React.useEffect(() => {
    if (!code || isPaid) return;

    const checkPayment = async () => {
      try {
        setChecking(true);
        const { data } = await axiosInstance.get(`/payment/sepay/check/${code}`);
        if (data.isPaid || data.depositPaid) {
          setIsPaid(true);
          // Redirect to success after 2s
          setTimeout(() => {
            router.replace(
              `/user/checkout/success?bookingId=${code}&paymentMethod=sepay-payment`
            );
          }, 2000);
        }
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkPayment, 5000);
    checkPayment(); // Check immediately

    return () => clearInterval(interval);
  }, [code, isPaid, router]);

  // Countdown timer
  React.useEffect(() => {
    if (countdown <= 0 || isPaid) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, isPaid]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  if (!code || !qrUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Thiếu thông tin thanh toán.</p>
          <Link href="/" className="text-[var(--primary)] underline mt-2 block">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quét QR để thanh toán
          </h1>
          <p className="text-slate-600 mt-1">Mã đơn hàng: {code}</p>
        </div>

        {/* QR Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          {isPaid ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-600">
                Thanh toán thành công!
              </h2>
              <p className="text-slate-600 mt-2">
                Đang chuyển hướng...
              </p>
            </div>
          ) : (
            <>
              {/* QR Image */}
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 mb-4">
                <div className="relative aspect-square w-full max-w-[280px] mx-auto">
                  <Image
                    src={decodeURIComponent(qrUrl)}
                    alt="QR Code"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="bg-purple-50 rounded-xl p-4 text-center mb-4">
                <p className="text-sm text-purple-600 font-medium">
                  Số tiền cần thanh toán
                </p>
                <p className="text-3xl font-bold text-purple-700 mt-1">
                  {vnd(amount)}
                </p>
              </div>

              {/* Timer */}
              <div className="text-center mb-4">
                <p className="text-sm text-slate-500">
                  QR hết hạn sau:{" "}
                  <span className="font-mono font-bold text-slate-700">
                    {String(minutes).padStart(2, "0")}:
                    {String(seconds).padStart(2, "0")}
                  </span>
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-700 mb-2">Hướng dẫn:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Mở app ngân hàng của bạn</li>
                  <li>Chọn chức năng Quét QR</li>
                  <li>Quét mã QR phía trên</li>
                  <li>Xác nhận thanh toán</li>
                </ol>
              </div>

              {/* Status indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                {checking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang kiểm tra thanh toán...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Đang chờ thanh toán</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Back link */}
        {!isPaid && (
          <div className="text-center mt-6">
            <Link
              href={`/user/checkout/success?bookingId=${code}&paymentMethod=office-payment`}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Thanh toán sau tại văn phòng
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
