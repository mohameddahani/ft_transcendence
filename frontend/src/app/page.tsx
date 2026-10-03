"use client";

import { useTheme } from "next-themes";
import Header from "@/components/header/Header";
import Hero from "@/components/hero/Hero";
import FeatureHighlights from "@/components/feature-highlights/FeatureHighlights";
import Carousel from "@/components/carousel/Carousel";
import GridItems from "@/components/grid-items/GridItems";
import Testimonials from "@/components/testimonials/Testimonials";
import Pricing from "@/components/pricing/Pricing";
import Faq from "@/components/faq/Faq";
import ContactUs from "@/components/contact-us/ContactUs";
import { ToastContainer } from "react-toastify";
import Cta from "@/components/cta/Cta";

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    // * Theme information may be unavailable before mounting.
    if (!resolvedTheme) return;

    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen transition-all">
      {/* Top Navigation Bar */}
      <Header toggleTheme={toggleTheme} />

      <div className="container mx-auto px-5">
        {/* Hero */}
        <Hero />
      </div>
      <Carousel />
      <div className="container mx-auto px-5">
        {/* Feature Highlights */}
        <FeatureHighlights />

        {/* Grid Items */}
        <GridItems />

        {/* Testimonials */}
        <Testimonials />

        {/* Pricing */}
        <Pricing />

        {/* Contact Section */}
        <ContactUs />
      </div>
      {/* FAQ */}
      <Faq />

      <div className="container mx-auto px-5">
        {/* CTA */}
        <Cta />
      </div>
      <ToastContainer />
    </div>
  );
}
