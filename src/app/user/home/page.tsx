"use client";

import FadeInWhenVisible from "@/components/FadeInWhenVisible";
import SlideIn from "@/components/SlideIn";
import { StaggerContainer, StaggerItem } from "@/components/Stagger";
import ScrollProgress from "@/components/ScrollProgress";

import SearchBox from "@/components/ui/SearchBox";
import HomeBanner from "./HomeBanner";
import ServiceSection from "./ServiceSection";
import HotDestinations from "./HotDestinations";
import HotSearchSection from "./HotSearchSection";
import QNASection from "./QNASection";
import TourList from "./TourList";
import BlogSection from "./BlogSection";
import TourRecommendations from "@/components/TourRecommendations";

export default function UserHomePage() {
  return (
    <div className="relative overflow-hidden">
      <ScrollProgress />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute w-[500px] h-[450px] bg-[var(--secondary)] opacity-50 blur-[250px]"
          style={{ top: "400px", left: "-420px" }}
        />
        <div
          className="absolute w-[500px] h-[550px] bg-[var(--primary)] opacity-50 blur-[250px]"
          style={{ top: "770px", left: "1470px" }}
        />
        <div
          className="absolute w-[400px] h-[300px] bg-[var(--primary)] opacity-50 blur-[250px]"
          style={{ top: "1350px", left: "-300px" }}
        />
        <div
          className="absolute w-[500px] h-[450px] bg-[var(--secondary)] opacity-50 blur-[250px]"
          style={{ top: "2050px", left: "1470px" }}
        />
        <div
          className="absolute w-[400px] h-[300px] bg-[var(--primary)] opacity-50 blur-[250px]"
          style={{ top: "2980px", left: "-150px" }}
        />
        <div
          className="absolute w-[500px] h-[550px] bg-[var(--secondary)] opacity-50 blur-[250px]"
          style={{ top: "4750px", left: "1470px" }}
        />
      </div>

      <FadeInWhenVisible>
        <HomeBanner />
      </FadeInWhenVisible>

      <FadeInWhenVisible delay={0.1}>
        <SearchBox />
      </FadeInWhenVisible>

      <section>
        <SlideIn dir="left">
          <ServiceSection />
        </SlideIn>
      </section>

      <section>
        <StaggerContainer delay={0.1} interval={0.07}>
          <StaggerItem>
            <HotDestinations />
          </StaggerItem>
        </StaggerContainer>
      </section>
      <FadeInWhenVisible delay={0.1}>
        <HotSearchSection />
      </FadeInWhenVisible>
      <FadeInWhenVisible delay={0.1}>
        <TourList />
      </FadeInWhenVisible>

      {/* Tour gợi ý cá nhân hóa */}
      <FadeInWhenVisible delay={0.1}>
        <div className="container mx-auto px-4 py-8">
          <TourRecommendations
            type="homepage"
            heading="Tour gợi ý cho bạn"
            limit={6}
          />
        </div>
      </FadeInWhenVisible>

      <section>
        <SlideIn dir="right">
          <BlogSection />
        </SlideIn>
      </section>

      <StaggerContainer delay={0.1} interval={0.06}>
        <StaggerItem>
          <QNASection />
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
