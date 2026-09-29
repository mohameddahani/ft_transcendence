import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";
import AdminDetailView from "@/components/admins/AdminDetailView";
import { fetchFromBackend } from "@/lib/server-api";
import { AdminUser } from "@/types/admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Gym Owner Details | Super Admin Portal`,
    description: `Detailed profile information for gymnasium owner ID ${id}`,
  };
}

export default async function AdminDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let admin: AdminUser | null = null;
  try {
    const res = await fetchFromBackend(`/api/owners/users/${id}`, token, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      admin = await res.json();
    }
  } catch (error) {
    console.error("Error fetching admin in page:", error);
  }

  if (!admin) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-surface border border-outline-variant rounded-xl text-center space-y-4">
        <UserX className="size-12 text-error/60 mx-auto" />
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
          Gym Owner Not Found
        </h1>
        <p className="text-body-sm text-on-surface-variant">
          The requested gym owner account could not be found or may have been deleted.
        </p>
        <div className="pt-2">
          <Link
            href="/admins"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded text-body-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="size-4" />
            <span>Return to Gym Owners</span>
          </Link>
        </div>
      </div>
    );
  }

  return <AdminDetailView admin={admin} />;
}

