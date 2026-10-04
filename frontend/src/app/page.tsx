"use client";

import Header from "@/components/header/Header";
import Hero from "@/components/hero/Hero";
import ProductPreview from "@/components/product-preview/ProductPreview";
import Carousel from "@/components/carousel/Carousel";
import Features from "@/components/features/Features";
import HowItWorks from "@/components/how-it-works/HowItWorks";
import Pricing from "@/components/pricing/Pricing";
import Faq from "@/components/faq/Faq";
import Cta from "@/components/cta/Cta";
import Footer from "@/components/footer/Footer";
import { LandingMotion } from "@/components/landing/motion";

export default function Home() {
  return (
    <LandingMotion>
      <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground">
        {/* Navigation */}
        <Header />

        <main className="flex-1">
          {/* Hero */}
          <Hero />

          {/* Product Preview */}
          <ProductPreview />

          {/* Full-width Carousel */}
          <Carousel />

          {/* Role-based Features */}
          <Features />

          {/* How It Works */}
          <HowItWorks />

          {/* Platform Pricing */}
          <Pricing />

          {/* FAQ */}
          <Faq />

          {/* Registration CTA */}
          <Cta />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </LandingMotion>
  );
}

