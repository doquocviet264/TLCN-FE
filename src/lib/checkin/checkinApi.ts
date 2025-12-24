import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface CheckinPayload {
  note?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  device?: string;
  imgList?: string[];
}

export const checkinApi = {
  // 1. Lấy lịch sử check-in
  getUserCheckins: async () => {
    const token = localStorage.getItem("accessToken");
    const res = await axios.get(`${API_URL}/me/checkins`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data.data;
  },

  // 2. Check-in theo địa điểm (QR)
  createCheckin: async (placeId: string, data: CheckinPayload) => {
    const token = localStorage.getItem("accessToken");
    const payload: CheckinPayload = {
      note: data.note || "",
      location: data.location || { type: "Point", coordinates: [106.7, 10.8] },
      device: data.device || "Unknown Device",
      imgList: data.imgList || [],
    };

    const res = await axios.post(
      `${API_URL}/places/${placeId}/checkin`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    return res.data.data;
  },

  // 3. Lấy dữ liệu tô màu Map
  getUserJourney: async () => {
    const token = localStorage.getItem("accessToken");
    const res = await axios.get(`${API_URL}/checkins/journey`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  },

  // 4. Check-in NHANH theo tên tỉnh
  checkinProvince: async (provinceName: string) => {
    const token = localStorage.getItem("accessToken");
    const payload = {
      provinceName: provinceName,
      type: "manual",
      note: `Khám phá ${provinceName} qua Bản đồ hành trình`,
    };

    const res = await axios.post(`${API_URL}/checkins`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  }, // <--- CHÚ Ý DẤU PHẨY Ở ĐÂY ĐỂ NGĂN CÁCH 2 HÀM

  // 5. Lấy danh sách Voucher (Đã tách ra ngoài)
  getMyVouchers: async () => {
    const token = localStorage.getItem("accessToken");
    const res = await axios.get(`${API_URL}/checkins/vouchers`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data.data;
  },

  // 6. Đánh dấu thủ công (KHÔNG nhận voucher - gọi cùng API nhưng FE xử lý khác)
  manualMarkProvince: async (provinceName: string) => {
    const token = localStorage.getItem("accessToken");
    const payload = {
      provinceName: provinceName,
      type: "manual_no_voucher",
      note: `Tự đánh dấu ${provinceName} - không qua tour`,
    };

    // Gọi cùng API /checkins nhưng với type khác để phân biệt
    const res = await axios.post(`${API_URL}/checkins`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    // Trả về nhưng đánh dấu là manual để FE không hiện voucher popup
    return { ...res.data, isManual: true };
  },

  // 7. Lấy danh sách tỉnh từ booking đã hoàn thành (TỰ ĐỘNG)
  // API trả về các tỉnh mà user đã đi qua các tour đã book và hoàn thành
  getBookingProvinces: async (): Promise<{ provinces: string[]; bookings: any[] }> => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axios.get(`${API_URL}/bookings/me/provinces`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      return res.data;
    } catch (error) {
      // Nếu API chưa có, trả về mảng rỗng
      console.log("API booking provinces chưa có, sử dụng fallback");
      return { provinces: [], bookings: [] };
    }
  },

  // 8. Lấy tất cả dữ liệu hành trình (kết hợp booking + manual)
  getFullJourney: async (): Promise<{
    fromBookings: string[];      // Tỉnh từ booking đã hoàn thành (tự động)
    fromManualCheckins: string[]; // Tỉnh tự đánh dấu (thủ công)
    bookingDetails?: any[];       // Chi tiết các booking
  }> => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axios.get(`${API_URL}/checkins/full-journey`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      return res.data;
    } catch (error) {
      // Fallback: gọi riêng từng API
      console.log("API full-journey chưa có, gọi riêng từng API");
      try {
        const [journeyRes, bookingRes] = await Promise.all([
          axios.get(`${API_URL}/checkins/journey`, {
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          }).catch(() => ({ data: { provinces: [] } })),
          axios.get(`${API_URL}/bookings/me`, {
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
            params: { limit: 100 }
          }).catch(() => ({ data: { data: [] } })),
        ]);

        // Lấy tỉnh từ booking đã hoàn thành (status = 'f' hoặc 'c')
        const completedBookings = (bookingRes.data.data || []).filter(
          (b: any) => b.bookingStatus === 'f' || b.bookingStatus === 'c'
        );

        // Lấy destination từ tour của mỗi booking
        const bookingProvinces = completedBookings
          .map((b: any) => b.tourDestination || b.tour?.destination)
          .filter(Boolean);

        return {
          fromBookings: [...new Set(bookingProvinces)] as string[],
          fromManualCheckins: journeyRes.data.provinces || [],
          bookingDetails: completedBookings,
        };
      } catch (fallbackError) {
        return { fromBookings: [], fromManualCheckins: [] };
      }
    }
  },
};
