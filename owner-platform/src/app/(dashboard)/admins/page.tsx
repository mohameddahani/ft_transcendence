import type { Metadata } from "next";
import AdminsTable from "@/components/admins/AdminsTable";

export const metadata: Metadata = {
  title: "Super Admin Portal | Gym Owners",
  description: "Manage and monitor all gymnasium owner accounts across the platform.",
};

export default function AdminsPage() {
  return <AdminsTable />;
}

