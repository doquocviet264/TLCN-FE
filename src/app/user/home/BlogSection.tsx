"use client";

import React, { useMemo } from "react";
import BlogCard from "@/components/cards/BlogCard";
import BlogCardFeatured from "@/components/cards/BlogCardFeatured";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useGetBlogs } from "#/hooks/blogs-hook/useBlogs";

import "swiper/css";
import "swiper/css/autoplay";

// Slugify helper
const slugify = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// SỬA: Định nghĩa các trường là bắt buộc (string) để khớp với component con
type BlogPost = {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  featured: boolean;
};

export default function BlogSection() {
  const { data, isError } = useGetBlogs(1, 12) ?? {
    data: undefined,
    isLoading: false,
    isError: false,
  };

  const list: BlogPost[] = useMemo(() => {
    if (!data || !Array.isArray(data.data)) return [];
    return data.data.map((blog: any, index: number) => ({
      _id: blog._id,
      slug: blog.slug || slugify(blog.title),
      title: blog.title || "Bài viết mới",
      // Đảm bảo luôn trả về string, không undefined
      excerpt: blog.summary || blog.content?.substring(0, 150) + "..." || "",
      image: blog.coverImageUrl || "/hot1.jpg",
      // 2 bài đầu tiên là featured
      featured: index < 2,
    }));
  }, [data]);

  // Fallback data (đã sửa type cho khớp)
  const fallbackFeatured: BlogPost[] = [
    {
      slug: "cam-nang-du-lich",
      title: "CẨM NANG DU LỊCH",
      excerpt:
        "Những ai đã trải nghiệm mùa nước nổi ở miền Tây hẳn sẽ không thể nào quên…",
      image: "/hot1.jpg",
      featured: true,
    },
    {
      slug: "dac-san-mien-tay",
      title: "ĐẶC SẢN MIỀN TÂY",
      excerpt:
        "Cá linh, bông điên điển và nhiều món đặc trưng thiên nhiên ban tặng…",
      image: "/hot1.jpg",
      featured: true,
    },
  ];

  const fallbackPosts: BlogPost[] = [
    {
      slug: "phong-tuc-ngay-tet-mien-tay-1",
      title: "PHONG TỤC NGÀY TẾT MIỀN TÂY",
      excerpt: "Khám phá phong tục ngày Tết miền Tây…",
      image: "/hot1.jpg",
      featured: false,
    },
    {
      slug: "kinh-nghiem-di-tour-mien-tay-2n1d-1",
      title: "KINH NGHIỆM ĐI TOUR MIỀN TÂY 2N1Đ",
      excerpt: "Lịch trình ngắn nhưng đầy trải nghiệm…",
      image: "/hot1.jpg",
      featured: false,
    },
    {
      slug: "tour-mien-tay-2n1d-my-tho-ben-tre-can-tho-1",
      title: "TOUR MIỀN TÂY 2N1Đ | MỸ THO - BẾN TRE - CẦN THƠ",
      excerpt: "Khám phá Mỹ Tho – Bến Tre – Cần Thơ…",
      image: "/hot1.jpg",
      featured: false,
    },
  ];

  const [featured, posts] = useMemo(() => {
    const src = list.length ? list : [];
    if (!src.length) return [fallbackFeatured, fallbackPosts];

    const f = src.filter((p) => p.featured).slice(0, 2);
    const rest = src.filter((p) => !p.featured).slice(0, 12);

    const featuredFilled = f.length ? f : fallbackFeatured;
    const postsFilled = rest.length ? rest : fallbackPosts;

    return [featuredFilled, postsFilled];
  }, [list]);

  const makeKey = (p: BlogPost, idx: number) => {
    const base = p.slug || slugify(p.title);
    const id = p._id || String(idx);
    return `${base}-${id}`;
  };

  const toHref = (p: BlogPost) => `/user/blog/${p.slug || slugify(p.title)}`;

  return (
    <section className="py-14 sm:py-16 px-4">
      <div className="mx-auto w-full max-w-7xl">
        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#144d7e] mb-6">
          BLOG
        </h2>

        {/* Featured Grid */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          {featured.map((b, i) => (
            <BlogCardFeatured
              key={makeKey(b, i)}
              slug={b.slug || ""}
              title={b.title || ""}
              excerpt={b.excerpt || ""} // Thêm || "" để chắc chắn là string
              image={b.image || "/hot1.jpg"}
              href={toHref(b)} // Bây giờ component con đã nhận prop này
            />
          ))}
        </div>

        {/* Swiper List */}
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={posts.length > 3} // Chỉ loop nếu đủ items
          grabCursor
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 1.05, spaceBetween: 12 },
            640: { slidesPerView: 2, spaceBetween: 14 },
            1024: { slidesPerView: 3, spaceBetween: 16 },
            1280: { slidesPerView: 3.2, spaceBetween: 18 },
          }}
          className="!pb-8"
        >
          {posts.map((p, i) => (
            <SwiperSlide key={makeKey(p, i)} className="!h-auto flex">
              <BlogCard
                slug={p.slug || ""}
                title={p.title || ""}
                excerpt={p.excerpt || ""}
                image={p.image || "/hot1.jpg"}
                href={toHref(p)}
                className="w-full"
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {isError && (
          <p className="mt-4 text-center text-sm text-red-600">
            Không tải được bài viết mới. Đang hiển thị nội dung mặc định.
          </p>
        )}
      </div>
    </section>
  );
}
