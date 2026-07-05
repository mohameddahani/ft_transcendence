import { Button, buttonVariants } from "@/components/ui/button";
import { saasName } from "@/utils/constants";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";

// Define the types for the props you are receiving
type HeaderProps = {
  isDark: boolean;
  toggleTheme: () => void;
};

const Header = ({ isDark, toggleTheme }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b bg-surface/80 backdrop-blur-md shadow-sm border-outline-variant transition-all">
      <nav className="max-w-6xl mx-auto flex items-center justify-between h-20 px-6">
        <Link
          className="cursor-pointer font-bold text-2xl text-primary"
          href="#"
        >
          {saasName}
        </Link>
        <div className="hidden md:flex gap-6 text-muted-foreground">
          <Link href="#" className="hover:text-primary">
            Features
          </Link>
          <Link href="#" className="hover:text-primary">
            Pricing
          </Link>
          <Link href="#" className="hover:text-primary">
            FAQ
          </Link>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Button
            variant={"ghost"}
            size={"icon-lg"}
            className={"cursor-pointer"}
            onClick={toggleTheme}
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
          <Button variant={"secondary"} size={"lg"}>
            Login
          </Button>
          <Button className="rounded-full btn-primary-gradient" size={"lg"}>
            Get Started
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
