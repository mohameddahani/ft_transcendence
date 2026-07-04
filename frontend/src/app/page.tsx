import { Sun } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    //  Top Navigation Bar
    <nav className="full-width top-0 sticky z-[100] bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant h-20 transition-all">
      <div className="flex justify-between items-center w-full px-lg max-w-container-max mx-auto h-full">
        <div className="flex items-center gap-xl">
          <span className="font-headline text-headline-md font-bold text-primary">
            GymFlow
          </span>
          <div className="hidden md:flex gap-lg items-center">
            <Link
              className="font-label text-label-md font-semibold text-on-surface-variant hover:text-primary transition-colors"
              href="#features"
            >
              Features
            </Link>
            <Link
              className="font-label text-label-md font-semibold text-on-surface-variant hover:text-primary transition-colors"
              href="#pricing"
            >
              Pricing
            </Link>
            <Link
              className="font-label text-label-md font-semibold text-on-surface-variant hover:text-primary transition-colors"
              href="#faq"
            >
              FAQ
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button className="p-sm rounded-full hover:bg-surface-container-high transition-colors cursor-pointer">
            <Sun size={20} />
          </button>
          <Link
            className="hidden sm:block font-label text-label-md font-bold text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Log In
          </Link>
          <button className="btn-primary text-white font-semibold px-lg py-sm rounded-full font-label text-label-md scale-95 active:opacity-80 transition-all cursor-pointer">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
