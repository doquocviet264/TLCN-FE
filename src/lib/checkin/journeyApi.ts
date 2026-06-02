import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface JourneyCollection {
  id: string;
  name: string;
  description: string;
  provinces: string[];
  icon: string;
  total: number;
  unlocked: number;
  missingProvinces: string[];
  completed: boolean;
}

export const journeyApi = {
  // Lấy danh sách bộ sưu tập và tiến độ
  getMyCollections: async (): Promise<{ success: boolean; data: JourneyCollection[] }> => {
    const token = localStorage.getItem("accessToken");
    const res = await axios.get(`${API_URL}/journey/collections/me`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  },

  // Lấy danh sách tour gợi ý (theo bộ sưu tập đang đi dở)
  getTourSuggestions: async (): Promise<{ success: boolean; data: any[] }> => {
    const token = localStorage.getItem("accessToken");
    const res = await axios.get(`${API_URL}/journey/suggestions`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  }
};
