import { saasName } from "@/utils/constants";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const copyrightText = `© 2026${currentYear === 2026 ? "" : "–" + currentYear} ${saasName}`;
  return (
    // <!-- Footer -->
    <footer className="mt-30 w-full bg-secondary p-10">
      <div className="container mx-auto px-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
        <div className="col-span-2 lg:col-span-2">
          <div className="text-xl font-bold text-on-surface mb-6">
            {saasName}
          </div>
          <p className="text-[16px] font-light text-muted-foreground max-w-xs mb-6">
            The world{"'"}s most advanced management platform for elite fitness
            and wellness businesses.
          </p>
          {/* <div className="flex gap-md">
            <a
              className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center hover:text-primary transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px]">
                public
              </span>
            </a>
            <a
              className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center hover:text-primary transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px]">
                group
              </span>
            </a>
          </div> */}
        </div>
        <div>
          <h5 className="font-medium mb-6">Product</h5>
          <ul className="space-y-1">
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                Features
              </a>
            </li>
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                Pricing
              </a>
            </li>
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                Member Portal
              </a>
            </li>
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                Mobile App
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-6">Company</h5>
          <ul className="space-y-1">
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                About Us
              </a>
            </li>
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                Contact
              </a>
            </li>
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-6">Support</h5>
          <ul className="space-y-1">
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                Help Center
              </a>
            </li>
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                Documentation
              </a>
            </li>
            <li>
              <a
                className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
                href="#"
              >
                API Status
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-2 border-t pt-6 mt-10">
        <span className="text-[16px] font-light text-muted-foreground max-w-xs  opacity-60">
          {copyrightText} SaaS. All rights reserved.
        </span>
        <div className="flex gap-6">
          <a
            className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
            href="#"
          >
            Cookies
          </a>
          <a
            className="text-[16px] font-light text-muted-foreground max-w-xs  hover:text-primary transition-colors"
            href="#"
          >
            Security
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
