// /stores/chatStore.ts
import { create } from "zustand";

// Định nghĩa kiểu dữ liệu cho cái Card Tour nhỏ
export type TourContextData = {
  id: string;
  title: string;
  image: string;
  price: string;
};

type ChatState = {
  isOpen: boolean;
  tourContext: TourContextData | null; // <--- THÊM CÁI NÀY

  openChat: (tourData?: TourContextData) => void; // <--- SỬA CÁI NÀY
  closeChat: () => void;
  toggleChat: () => void;
  clearTourContext: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  tourContext: null,

  // Hàm mở chat giờ nhận vào object tour thay vì string
  openChat: (tourData) =>
    set({
      isOpen: true,
      tourContext: tourData || null,
    }),

  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  clearTourContext: () => set({ tourContext: null }),
}));
