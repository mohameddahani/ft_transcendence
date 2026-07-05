"use client";

import { useState } from "react";
import {
  Check,
  MessageSquare,
  Users,
  IdCard,
  Banknote,
  MessageCircle,
  LayoutDashboard,
  Bot,
  LogIn,
  LineChart,
  ChevronDown,
  Mail,
  Globe,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/header/Header";
import Hero from "@/components/hero/Hero";
import TrustStrip from "@/components/trust-strip/TrustStrip";
import FeatureHighlights from "@/components/feature-highlights/FeatureHighlights";

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="h-screen transition-all">
      {/* Top Navigation Bar */}
      <Header isDark={isDark} toggleTheme={toggleTheme} />

     <div className="container mx-auto px-3">
       {/* Hero */}
       <Hero />
     </div>
    </div>
  );
}
