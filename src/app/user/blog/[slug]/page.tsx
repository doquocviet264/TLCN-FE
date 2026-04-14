// /app/user/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";

import BlogDetail from "../BlogDetail";
import RecentPosts from "../RecentPosts";
import PopularPostsSection from "../../home/TourList";
import BlogCommentsSection from "../BlogCommentsSection";
import SocialShare from "../SocialShare";
import ReadingProgressBar from "../ReadingProgressBar";
import BackToTopButton from "../BackToTopButton";
import RelatedPosts from "../RelatedPosts";

import { dataReviews } from "@/data/dataReviews";
import { blogApi } from "@/lib/blog/blogApi";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

// helper nhỏ: bỏ tag HTML để lấy plain text
const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await blogApi.getBlogBySlug(slug);

    // Lấy description: ưu tiên text trong content, fallback summary / excerpt
    let rawText = "";

    if (Array.isArray(post.content)) {
      const firstBlock =
        post.content.find((b: any) => b.type === "text" || b.type === "html")
          ?.value ?? "";
      rawText = stripHtml(firstBlock);
    } else if (typeof post.content === "string") {
      rawText = stripHtml(post.content);
    } else if (post.summary || (post as any).excerpt) {
      rawText = stripHtml(post.summary || (post as any).excerpt || "");
    }

    const baseDesc =
      rawText || "Bài viết chia sẻ kinh nghiệm và câu chuyện du lịch.";
    const description =
      baseDesc.length > 150 ? baseDesc.slice(0, 150) + "..." : baseDesc;

    const ogImage =
      post.cover ||
      post.coverImageUrl ||
      post.thumbnail ||
      post.mediaUrls?.[0] ||
      "/blog-placeholder.jpg";

    return {
      title: post.title ? `${post.title} | Travel Blog` : "Travel Blog",
      description,
      openGraph: {
        title: post.title ?? "Travel Blog",
        description,
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
    };
  } catch (error) {
    console.error("generateMetadata blog error:", error);
    return {
      title: "Travel Blog",
      description: "Bài viết du lịch.",
    };
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  try {
    const { slug } = await params;
    const post = await blogApi.getBlogBySlug(slug);

    if (!post) {
      return notFound();
    }

    return (
      <main className="relative overflow-hidden">
        {/* Reading Progress Bar */}
        <ReadingProgressBar />

        {/* background blur */}
        <div
          className="pointer-events-none absolute h-[500px] w-[500px] bg-[var(--secondary)] opacity-50 blur-[250px]"
          style={{ top: "270px", left: "-240px" }}
        />
        <div
          className="pointer-events-none absolute h-[500px] w-[500px] bg-[var(--primary)] opacity-50 blur-[250px]"
          style={{ top: "600px", left: "1200px" }}
        />
        <div
          className="pointer-events-none absolute h-[500px] w-[500px] bg-[var(--primary)] opacity-50 blur-[250px]"
          style={{ top: "1100px", left: "-60px" }}
        />
        <div
          className="pointer-events-none absolute h-[500px] w-[500px] bg-[var(--secondary)] opacity-50 blur-[250px]"
          style={{ top: "2000px", left: "1300px" }}
        />
        <div
          className="pointer-events-none absolute h-[500px] w-[500px] bg-[var(--primary)] opacity-50 blur-[250px]"
          style={{ top: "2500px", left: "-60px" }}
        />

        <Image
          src="/city-bg.svg"
          alt="city-bg"
          width={355}
          height={216}
          className="pointer-events-none absolute left-[-100px] top-[535px] z-0 h-auto w-[200px] sm:w-[250px] md:w-[300px] lg:w-[355px]"
        />
        <Image
          src="/Graphic_Elements.svg"
          alt="Graphic_Elements"
          width={192}
          height={176}
          className="pointer-events-none absolute left-[1420px] top-[875px] z-0 h-auto w-[100px] sm:w-[140px] md:w-[160px] lg:w-[192px]"
        />
        <Image
          src="/Graphic_Elements.svg"
          alt="Graphic_Elements"
          width={192}
          height={176}
          className="pointer-events-none absolute left-[1420px] top-[2800px] z-0 h-auto w-[100px] sm:w-[140px] md:w-[160px] lg:w-[192px]"
        />

        <div className="mx-auto mt-12 max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            {/* Nội dung bài viết */}
            <div className="min-w-0 flex-[0.7]">
              <BlogDetail post={post} />

              <div className="mt-8">
                <SocialShare />
              </div>

              <BlogCommentsSection slug={slug} />

              {/* Related Posts */}
              <RelatedPosts tags={post.tags ?? []} currentSlug={slug} />
            </div>

            {/* Sidebar */}
            <aside className="w-full flex-[0.3] px-4 pb-4 md:px-6 md:pb-6 lg:max-w-xs lg:pl-4 lg:pr-8 lg:pb-8 xl:px-0">
              <RecentPosts />
              <div className="mt-6"></div>
            </aside>
          </div>

          <div className="mt-12">
            <PopularPostsSection />
          </div>
        </div>

        {/* Back to Top Button */}
        <BackToTopButton />
      </main>
    );
  } catch (error) {
    console.error("BlogDetailPage error:", error);
    return notFound();
  }
}
