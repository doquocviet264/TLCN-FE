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
};
