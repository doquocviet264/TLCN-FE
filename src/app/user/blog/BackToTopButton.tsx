"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Cuộn lên đầu trang"
      className="fixed bottom-8 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 hover:scale-110 active:scale-95 transition-all duration-200"
    >
      <ChevronUp size={22} strokeWidth={2.5} />
    </button>
  );
}
