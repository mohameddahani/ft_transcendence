"use client";

import Header from "@/components/landing/header/Header";
import Hero from "@/components/landing/hero/Hero";
import ProductPreview from "@/components/landing/product-preview/ProductPreview";
import Carousel from "@/components/landing/carousel/Carousel";
import Features from "@/components/landing/features/Features";
import HowItWorks from "@/components/landing/how-it-works/HowItWorks";
import Pricing from "@/components/landing/pricing/Pricing";
import Faq from "@/components/landing/faq/Faq";
import Cta from "@/components/landing/cta/Cta";
import Footer from "@/components/landing/footer/Footer";
import { LandingMotion } from "@/components/landing/motion";
import { WhatsappFloatingButton } from "@/components/landing/whatsapp";

export default function Home() {
  return (
    <LandingMotion>
      <div className="landing min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground">
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

        {/* WhatsApp chat with the platform, bottom right */}
        <WhatsappFloatingButton />
      </div>
    </LandingMotion>
  );
}

