"use client";

import { useEffect, useState } from "react";
import { LuCopy } from "react-icons/lu";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import { toast } from "react-hot-toast";

export default function SocialShare() {
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(encodeURIComponent(window.location.href));
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã copy link bài viết!");
    }
  };

  const handleShareFacebook = () => {
    if (currentUrl) {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`,
        "_blank"
      );
    }
  };

  const handleShareInstagram = () => {
    toast(
      "Instagram không hỗ trợ chia sẻ trực tiếp. Hãy copy link và dán vào bài đăng Instagram.",
      { icon: "ℹ️" }
    );
    window.open("https://www.instagram.com/", "_blank");
  };

  const handleShareZalo = () => {
    if (currentUrl) {
      window.open(`https://zalo.me/share?url=${currentUrl}`, "_blank");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <hr className="flex-1 border-[#D1E7E5]" />
      <div className="flex gap-4">
        <button
          onClick={handleCopyLink}
          className="text-[var(--gray-2)] hover:text-[var(--gray-1)] transition"
        >
          <LuCopy size={20} />
        </button>
        <button
          onClick={handleShareFacebook}
          className="text-[var(--gray-2)] hover:text-[var(--gray-1)] transition"
        >
          <FaFacebookF size={20} />
        </button>
        <button
          onClick={handleShareInstagram}
          className="text-[var(--gray-2)] hover:text-[var(--gray-1)] transition"
        >
          <FaInstagram size={20} />
        </button>
        <button
          onClick={handleShareZalo}
          className="text-[var(--gray-2)] hover:text-[var(--gray-1)] transition"
        >
          <SiZalo size={40} />
        </button>
      </div>
      <hr className="flex-1 border-[#D1E7E5]" />
    </div>
  );
}
