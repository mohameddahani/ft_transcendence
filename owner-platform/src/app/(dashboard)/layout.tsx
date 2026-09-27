import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TopNavBar from "@/components/admins/TopNavBar";
import SideNavBar from "@/components/admins/SideNavBar";
import ToastProvider from "@/components/providers/ToastProvider";
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
    <div className="min-h-screen bg-background text-on-surface font-body-md selection:bg-primary selection:text-on-primary">
      {/* Single persistent Top Navigation Bar */}
      <TopNavBar />

      {/* Single persistent Sidebar Navigation */}
      <SideNavBar />

      {/* Main Content Area */}
      <main className="ml-64 mt-[40px] p-layout-margin min-h-[calc(100vh-40px)] overflow-y-auto">
        {children}
      </main>

      {/* Global Toast Container */}
      <ToastProvider />
    </div>
  );
}

