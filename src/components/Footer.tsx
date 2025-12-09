"use client";

import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Globe,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm font-sans">
      {/* Phần nội dung chính */}
      <div className="w-full max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              AHH <span className="text-orange-500">Travel</span>
            </h3>
            <p className="leading-relaxed text-slate-400">
              Kiến tạo những hành trình hạnh phúc. Chúng tôi cam kết mang đến
              trải nghiệm du lịch tuyệt vời nhất với chi phí hợp lý và dịch vụ
              tận tâm.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="#"
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-blue-600 transition-colors"
              >
                <Facebook size={16} />
              </a>
              <a
                href="#"
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-sky-500 transition-colors"
              >
                <Twitter size={16} />
              </a>
              <a
                href="#"
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-pink-600 transition-colors"
              >
                <Instagram size={16} />
              </a>
              <a
                href="#"
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-red-600 transition-colors"
              >
                <Youtube size={16} />
              </a>
            </div>
          </div>

          {/* Cột 2: Liên kết nhanh */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wide">
              Về AHH Travel
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/user/about"
                  className="hover:text-orange-500 transition-colors"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  href="/user/destination"
                  className="hover:text-orange-500 transition-colors"
                >
                  Danh sách Tour
                </Link>
              </li>
              <li>
                <Link
                  href="/user/blog"
                  className="hover:text-orange-500 transition-colors"
                >
                  Cẩm nang du lịch
                </Link>
              </li>
              <li>
                <Link
                  href="/user/contact"
                  className="hover:text-orange-500 transition-colors"
                >
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Chính sách & Hỗ trợ */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wide">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="hover:text-orange-500 transition-colors"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-orange-500 transition-colors"
                >
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-orange-500 transition-colors"
                >
                  Chính sách hoàn tiền
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-orange-500 transition-colors"
                >
                  Hướng dẫn thanh toán
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Thông tin liên hệ */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wide">
              Liên hệ
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="shrink-0 text-orange-500 mt-0.5" size={18} />
                <span>
                  Số 1 Võ Văn Ngân, Phường Linh Chiểu,
                  <br />
                  Thành phố Thủ Đức, TP. HCM
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="shrink-0 text-orange-500" size={18} />
                <span className="font-medium text-white">
                  (+84) 123 456 789
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="shrink-0 text-orange-500" size={18} />
                <span>admin@ahhtravel.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Globe className="shrink-0 text-orange-500" size={18} />
                <span>www.ahhtravel.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dòng kẻ phân cách */}
        <div className="border-t border-slate-800 my-8"></div>

        {/* Phần dưới cùng (Copyright & Payment) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AHH Travel. All rights reserved.</p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-white transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
