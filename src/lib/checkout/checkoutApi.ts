// /lib/checkout/checkoutApi.ts
import axiosInstance from "@/lib/axiosInstance";

/* ================= Types ================= */
export type PaymentMethod =
  | "office-payment"
  | "vnpay-payment"
  | "sepay-payment";

export type CreateBookingBody = {
  tourId: string;
  contact: {
    fullName: string;
    phone: string;
    email: string;
    address?: string;
  };
  guests: { adults: number; children: number };
  pricing: { priceAdult: number; priceChild: number; total?: number };
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  paymentType: "full" | "deposit" | "office";
};

export type CreateBookingResponse = {
  code: string;
  status: "p" | "c" | "x" | "f";
  payment?: { redirectUrl?: string | null } | null;
  total?: number;
};

export type PaymentRef = {
  provider: string;
  ref: string;
  amount: number;
  at: string;
  note?: string;
};

export type MyBookingItem = {
  code: string;
  tourId: string;
  tourTitle?: string;
  tourImage?: string | null;
  tourDestination?: string | null;
  time?: string | null;
  startDate?: string | null;
  endDate?: string | null;

  numAdults: number;
  numChildren: number;

  totalPrice: number;
  paidAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  requireFullPayment?: boolean;

  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;

  paymentMethod?: string;
  paymentRefs?: PaymentRef[];

  bookingStatus: "p" | "c" | "x" | "f";
  createdAt?: string;
  updatedAt?: string;
};

export type MyBookingList = {
  total: number;
  page: number;
  limit: number;
  data: MyBookingItem[];
};

/* ================= Adapters ================= */
function adaptCreateBooking(res: any): CreateBookingResponse {
  return {
    code: String(res?.booking?.code ?? res?.code ?? ""),
    status: (res?.booking?.bookingStatus ?? res?.status ?? "p") as
      | "p"
      | "c"
      | "x"
      | "f",
    payment:
      res?.payUrl || res?.deeplink
        ? { redirectUrl: res?.payUrl ?? res?.deeplink }
        : res?.payment ?? null,
    total: Number(res?.booking?.totalPrice ?? res?.total ?? 0),
  };
}

function adaptMyBookings(res: any): MyBookingList {
  const rows = Array.isArray(res?.data) ? res.data : [];

  const mapped = rows.map((b: any): MyBookingItem => {
    const tour = b.tourId && typeof b.tourId === "object" ? b.tourId : null;

    return {
      code: String(b.code ?? ""),
      tourId: String(tour?._id ?? b.tourId ?? ""),

      tourTitle: tour?.title ?? b.tourTitle,
      tourImage: tour?.cover ?? tour?.images?.[0] ?? b.tourImage ?? null,
      tourDestination: tour?.destination ?? b.destination ?? null,
      time: tour?.time ?? b.time ?? null,
      startDate: tour?.startDate ?? b.startDate ?? null,
      endDate: tour?.endDate ?? b.endDate ?? null,

      numAdults: Number(b.numAdults ?? 0),
      numChildren: Number(b.numChildren ?? 0),

      totalPrice: Number(b.totalPrice ?? 0),
      paidAmount: Number(b.paidAmount ?? 0),
      depositAmount: Number(b.depositAmount ?? 0),
      depositPaid: Boolean(b.depositPaid),
      requireFullPayment:
        "requireFullPayment" in b ? Boolean(b.requireFullPayment) : undefined,

      fullName: b.fullName,
      email: b.email,
      phoneNumber: b.phoneNumber,
      address: b.address,

      paymentMethod: b.paymentMethod,
      paymentRefs: Array.isArray(b.paymentRefs) ? b.paymentRefs : [],

      bookingStatus: (b.bookingStatus ?? "p") as MyBookingItem["bookingStatus"],
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  });

  return {
    total: Number(res?.total ?? mapped.length),
    page: Number(res?.page ?? 1),
    limit: Number(res?.limit ?? (mapped.length || 10)),
    data: mapped,
  };
}

/* ================= Quote ================= */
export async function getCheckoutQuote(payload: {
  tourId: string;
  guests: { adults: number; children: number };
  pricing: { priceAdult: number; priceChild: number };
  couponCode: string | null;
}) {
  const { data } = await axiosInstance.post("/bookings/quote", payload);
  return data;
}

/* ================= User APIs ================= */
export async function createBooking(
  body: CreateBookingBody
): Promise<CreateBookingResponse> {
  const { data } = await axiosInstance.post("/bookings", body, {
    timeout: 20000,
  });
  return adaptCreateBooking(data);
}

export async function getMyBookings(
  page = 1,
  limit = 10
): Promise<MyBookingList> {
  const { data } = await axiosInstance.get("/bookings/me", {
    params: { page, limit },
  });
  return adaptMyBookings(data);
}

export async function cancelBooking(code: string): Promise<{ ok: boolean }> {
  const { data } = await axiosInstance.put(
    `/bookings/${encodeURIComponent(code)}/cancel`
  );
  return {
    ok: Boolean(
      data?.message === "Canceled" ||
        data?.ok === true ||
        data?.success === true
    ),
  };
}

/* ================= Re-init Payment ================= */
export async function createPaymentForBooking(
  code: string,
  type: "deposit" | "remaining"
): Promise<{ payUrl?: string; deeplink?: string }> {
  const { data } = await axiosInstance.post(
    `/bookings/${encodeURIComponent(code)}/payment`,
    { type }
  );
  return data || {};
}
export async function initSepayPayment(
  bookingCode: string,
  totalPrice: number
) {
  const { data } = await axiosInstance.post(
    "/payment/sepay/create",
    { code: bookingCode, amount: totalPrice },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

export async function initBookingPayment(
  bookingCode: string,
  totalPrice: number
) {
  const { data } = await axiosInstance.post(
    "/payment/vnpay/create",
    { code: bookingCode, amount: totalPrice },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}
