export const saasName = "Athlevaro";
export const saasEmail = "Athlevaro@gmail.com";
export const saasWhatsapp = "0606060606";

/** Authentication entry points defined in the frontend specification. */
export const authRoutes = {
  register: "/register",
  adminLogin: "/login",
  staffLogin: "/staff/login",
  memberLogin: "/member/login",
} as const;

export const loginOptions = [
  {
    href: authRoutes.adminLogin,
    label: "Club admin or owner",
    description: "Sign in with your email",
  },
  {
    href: authRoutes.staffLogin,
    label: "Staff",
    description: "Sign in with your username",
  },
  {
    href: authRoutes.memberLogin,
    label: "Member",
    description: "Book visits and open your pass",
  },
] as const;

export const landingSections = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

