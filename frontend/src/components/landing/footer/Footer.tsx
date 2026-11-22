import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { authRoutes, landingSections, loginOptions, saasEmail, saasName } from "@/components/landing/constants";
import { BrandMark } from "@/components/landing/header/Header";
import { Container } from "@/components/landing/primitives";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/60 pt-16 pb-12">
      <Container>
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand info */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${saasName} home`}
            >
              <BrandMark />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A multi-tenant management platform for fitness clubs, martial arts dojos, swimming clubs, football clubs, and running organizations.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail size={16} aria-hidden="true" className="text-primary" />
              <a
                href={`mailto:${saasEmail}`}
                className="hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4 transition-colors"
              >
                {saasEmail}
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Product
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="#product-preview"
                  className="text-muted-foreground transition-colors hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4"
                >
                  Platform preview
                </a>
              </li>
              {landingSections.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#sports"
                  className="text-muted-foreground transition-colors hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4"
                >
                  Supported sports
                </a>
              </li>
            </ul>
          </div>

          {/* Role Portals */}
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Portals & Access
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href={authRoutes.register}
                  className="text-muted-foreground transition-colors hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4 inline-flex items-center gap-1"
                >
                  Register your club
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </li>
              {loginOptions.map((option) => (
                <li key={option.href}>
                  <Link
                    href={option.href}
                    className="text-muted-foreground transition-colors hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4"
                  >
                    {option.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Policy */}
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Information
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground transition-colors hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition-colors hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span className="text-xs text-muted-foreground/80 block mt-2">
                  Multi-tenant isolation enforced by gym workspace.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {currentYear} {saasName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground hover:underline decoration-selected decoration-2 underline-offset-4 transition-colors">
              Privacy
            </Link>
            <span>ft_transcendence</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

