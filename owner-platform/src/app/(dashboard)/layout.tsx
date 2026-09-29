import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TopNavBar from "@/components/admins/TopNavBar";
import SideNavBar from "@/components/admins/SideNavBar";
import ToastProvider from "@/components/providers/ToastProvider";
import DashboardShell from "@/components/layout/DashboardShell";
import { parseJwtPayload, isAdminUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = parseJwtPayload(token);
  if (!isAdminUser(payload)) {
    redirect("/login?error=unauthorized");
  }

  return (
    <DashboardShell>
      {/* Single persistent Top Navigation Bar */}
      <TopNavBar />

      {/* Persistent Sidebar (desktop) & Off-canvas drawer (mobile) */}
      <SideNavBar />

      {/* Main Content Area */}
      <main className="ml-0 md:ml-64 mt-[48px] sm:mt-[40px] p-3 sm:p-5 md:p-layout-margin min-h-[calc(100vh-48px)] sm:min-h-[calc(100vh-40px)] overflow-x-hidden">
        {children}
      </main>

      {/* Global Toast Container */}
      <ToastProvider />
    </DashboardShell>
  );
}

