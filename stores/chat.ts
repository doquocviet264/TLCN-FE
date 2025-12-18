import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatThread, RoomType } from "@/lib/chat/chatApi";

interface ChatState {
  // Widget state
  isWidgetOpen: boolean;
  isMinimized: boolean;

  // Current active chat
  activeSupportId: string | null;
  activeBookingCode: string | null;
  activeTourId: string | null;
  activeRoomType: RoomType | null;

  // Messages cache
  messages: ChatMessage[];

  // User's chat history (for quick access)
  supportChats: ChatThread[];
  bookingChats: ChatThread[];
  tourChats: ChatThread[];

  // Unread counts
  unreadSupport: number;
  unreadBooking: number;
  unreadTour: number;

  // Actions
  openWidget: () => void;
  closeWidget: () => void;
  minimizeWidget: () => void;
  toggleWidget: () => void;

  // Set active chat
  setActiveChat: (type: RoomType, id: string) => void;
  clearActiveChat: () => void;

  // Messages
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;

  // Chat history
  setSupportChats: (chats: ChatThread[]) => void;
  setBookingChats: (chats: ChatThread[]) => void;
  setTourChats: (chats: ChatThread[]) => void;

  // Unread
  setUnreadSupport: (count: number) => void;
  setUnreadBooking: (count: number) => void;
  setUnreadTour: (count: number) => void;
  clearAllUnread: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  isWidgetOpen: false,
  isMinimized: false,
  activeSupportId: null,
  activeBookingCode: null,
  activeTourId: null,
  activeRoomType: null,
  messages: [],
  supportChats: [],
  bookingChats: [],
  tourChats: [],
  unreadSupport: 0,
  unreadBooking: 0,
  unreadTour: 0,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Widget actions
      openWidget: () => set({ isWidgetOpen: true, isMinimized: false }),
      closeWidget: () => set({ isWidgetOpen: false, isMinimized: false }),
      minimizeWidget: () => set({ isMinimized: true }),
      toggleWidget: () => {
        const { isWidgetOpen, isMinimized } = get();
        if (isWidgetOpen && !isMinimized) {
          set({ isMinimized: true });
        } else if (isWidgetOpen && isMinimized) {
          set({ isMinimized: false });
        } else {
          set({ isWidgetOpen: true, isMinimized: false });
        }
      },

      // Active chat
      setActiveChat: (type, id) => {
        const updates: Partial<ChatState> = {
          activeRoomType: type,
          activeSupportId: null,
          activeBookingCode: null,
          activeTourId: null,
        };

        if (type === "support") updates.activeSupportId = id;
        else if (type === "booking") updates.activeBookingCode = id;
        else if (type === "tour") updates.activeTourId = id;

        set(updates);
      },

      clearActiveChat: () =>
        set({
          activeRoomType: null,
          activeSupportId: null,
          activeBookingCode: null,
          activeTourId: null,
          messages: [],
        }),

      // Messages
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),

      // Chat history
      setSupportChats: (chats) => set({ supportChats: chats }),
      setBookingChats: (chats) => set({ bookingChats: chats }),
      setTourChats: (chats) => set({ tourChats: chats }),

      // Unread
      setUnreadSupport: (count) => set({ unreadSupport: count }),
      setUnreadBooking: (count) => set({ unreadBooking: count }),
      setUnreadTour: (count) => set({ unreadTour: count }),
      clearAllUnread: () =>
        set({ unreadSupport: 0, unreadBooking: 0, unreadTour: 0 }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        // Only persist these fields
        activeSupportId: state.activeSupportId,
        supportChats: state.supportChats,
      }),
    }
  )
);
